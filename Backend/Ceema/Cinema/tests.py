from datetime import date, time

from django.test import TestCase
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient

from .models import (
    Admin,
    Badge,
    Booking,
    Chatbot,
    ChatMessage,
    Comment,
    Course,
    Follow,
    Movie,
    MovieCredit,
    NewsArticle,
    PaymentTransaction,
    Person,
    Post,
    PostLike,
    Profile,
    Purchase,
    Recommendation,
    Report,
    Review,
    Reward,
    Seat,
    Showtime,
    Ticket,
    User,
)


class CinemaAppTests(TestCase):
    def setUp(self):
        self.user = User.objects.create(
            name="Alice",
            email="alice@example.com",
            password="secret123",
            role=User.ROLE_USER,
        )
        self.admin = Admin.objects.create(
            name="Moderator",
            email="admin@example.com",
            password="admin-secret",
        )
        self.profile = Profile.objects.create(user=self.user, bio="Movie fan", followers_count=7)
        self.movie = Movie.objects.create(
            title="Interstellar",
            description="A science-fiction epic.",
            duration=169,
            genre="Sci-Fi",
            rating=8.7,
        )
        self.course = Course.objects.create(
            title="Film Appreciation",
            description="Understand the language of cinema.",
        )
        self.course.users.add(self.user)
        self.showtime = Showtime.objects.create(
            movie=self.movie,
            date=date(2026, 4, 2),
            time=time(20, 30),
        )
        self.seat = Seat.objects.create(
            showtime=self.showtime,
            seat_number="A1",
            status="available",
        )

    def test_homepage_returns_system_status(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")
        self.assertIn("movies", response.json()["implemented_domains"])

    def test_class_diagram_entities_link_together(self):
        badge = Badge.objects.create(name="First Booking", description="Booked first ticket")
        reward = Reward.objects.create(name="Popcorn Voucher", points_required=100)
        badge.users.add(self.user)
        reward.users.add(self.user)

        review = Review.objects.create(
            user=self.user,
            movie=self.movie,
            course=self.course,
            rating=5,
            comment="Excellent movie.",
        )
        post = Post.objects.create(user=self.user, content="Loved the soundtrack.")
        comment = Comment.objects.create(
            user=self.admin,
            post=post,
            content="Thanks for sharing your thoughts.",
        )
        PostLike.objects.create(user=self.admin, post=post)

        booking = Booking.objects.create(
            user=self.user,
            showtime=self.showtime,
            total_price="200.00",
            status=Booking.STATUS_CONFIRMED,
        )
        ticket = Ticket.objects.create(
            booking=booking,
            showtime=self.showtime,
            seat=self.seat,
            ticket_code="TICKET-001",
            qr_code="QR-001",
        )
        payment = PaymentTransaction.objects.create(
            booking=booking,
            provider="payment-system",
            amount="200.00",
            status="paid",
            external_reference="PAY-001",
        )
        recommendation = Recommendation.objects.create(
            user=self.user,
            movie=self.movie,
            type="genre-based",
        )
        report = Report.objects.create(admin=self.admin)

        self.assertEqual(self.profile.user, self.user)
        self.assertEqual(self.user.badges.get(), badge)
        self.assertEqual(self.user.rewards.get(), reward)
        self.assertEqual(self.user.courses.get(), self.course)
        self.assertEqual(review.movie, self.movie)
        self.assertEqual(comment.post, post)
        self.assertEqual(post.likes.count(), 1)
        self.assertEqual(ticket.booking, booking)
        self.assertEqual(ticket.seat, self.seat)
        self.assertEqual(payment.booking, booking)
        self.assertEqual(recommendation.movie, self.movie)
        self.assertEqual(report.admin, self.admin)

    def test_ticket_prevents_double_booking_same_seat_for_same_showtime(self):
        booking = Booking.objects.create(
            user=self.user,
            showtime=self.showtime,
            total_price="100.00",
            status=Booking.STATUS_CONFIRMED,
        )
        Ticket.objects.create(
            booking=booking,
            showtime=self.showtime,
            seat=self.seat,
            ticket_code="TICKET-002",
            qr_code="QR-002",
        )

        second_booking = Booking.objects.create(
            user=self.admin,
            showtime=self.showtime,
            total_price="100.00",
            status=Booking.STATUS_CONFIRMED,
        )

        with self.assertRaises(ValidationError):
            Ticket.objects.create(
                booking=second_booking,
                showtime=self.showtime,
                seat=self.seat,
                ticket_code="TICKET-003",
                qr_code="QR-003",
            )

    def test_confirmed_booking_can_award_points(self):
        booking = Booking.objects.create(
            user=self.user,
            showtime=self.showtime,
            total_price="150.00",
            status=Booking.STATUS_CONFIRMED,
        )

        booking.award_points(points=25)
        self.user.refresh_from_db()

        self.assertEqual(self.user.points, 25)

    def test_admin_helper_methods_expose_management_targets(self):
        Report.objects.create(admin=self.admin)

        self.assertEqual(self.admin.role, User.ROLE_ADMIN)
        self.assertEqual(self.admin.manage_movies().count(), 1)
        self.assertGreaterEqual(self.admin.manage_users().count(), 2)
        self.assertEqual(self.admin.generate_reports().count(), 1)

    def test_news_articles_are_public_and_support_filters(self):
        NewsArticle.objects.create(
            title="The Best Sci-Fi Movies of the 21st Century",
            summary="Cautionary tales about technology and cinema.",
            image_url="https://image.tmdb.org/t/p/w780/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
            category=NewsArticle.CATEGORY_MOVIES,
            is_featured=True,
            created_by=self.admin,
        )
        NewsArticle.objects.create(
            title="Oscars Led an Overall Decline",
            summary="Awards season ratings story.",
            category=NewsArticle.CATEGORY_AWARDS,
            is_published=False,
            created_by=self.admin,
        )

        response = self.client.get("/api/news/?q=sci-fi&featured=true")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["category"], NewsArticle.CATEGORY_MOVIES)

    def test_admin_can_post_news_article(self):
        api_client = APIClient()
        api_client.force_authenticate(user=self.admin)

        response = api_client.post(
            "/api/news/",
            {
                "title": "Box Office: Project Hail Mary Opens Strong",
                "summary": "A space epic starts with strong preview numbers.",
                "category": NewsArticle.CATEGORY_BOX_OFFICE,
                "image_url": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80",
                "is_published": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["created_by"], self.admin.id)

    def test_movie_filters_now_playing_and_people_credits(self):
        self.movie.language = "English"
        self.movie.release_year = 2014
        self.movie.country = "United States"
        self.movie.poster_url = "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
        self.movie.is_now_playing = True
        self.movie.is_in_cinemas = True
        self.movie.save()
        self.showtime.city = "Cairo"
        self.showtime.cinema_name = "CEEMA Downtown"
        self.showtime.save()
        director = Person.objects.create(
            full_name="Christopher Nolan",
            primary_role=Person.ROLE_DIRECTOR,
        )
        MovieCredit.objects.create(
            movie=self.movie,
            person=director,
            job=MovieCredit.JOB_DIRECTOR,
        )

        filters_response = self.client.get("/api/movies/filters/")
        now_playing_response = self.client.get("/api/movies/now-playing/?city=Cairo")
        people_response = self.client.get("/api/people/filmmakers/")
        credits_response = self.client.get(f"/api/movies/{self.movie.id}/credits/")

        self.assertEqual(filters_response.status_code, 200)
        self.assertIn("Sci-Fi", filters_response.json()["genres"])
        self.assertEqual(now_playing_response.status_code, 200)
        self.assertEqual(now_playing_response.json()[0]["poster"], self.movie.poster_url)
        self.assertEqual(people_response.status_code, 200)
        self.assertEqual(people_response.json()[0]["full_name"], "Christopher Nolan")
        self.assertEqual(credits_response.status_code, 200)
        self.assertEqual(credits_response.json()[0]["job"], MovieCredit.JOB_DIRECTOR)

    def test_xml_extension_entities_support_demo_flow(self):
        self.user.age = 25
        self.user.preferred_genres = ["Sci-Fi", "Drama"]
        self.user.mood_preference = "curious"
        self.user.save()

        self.profile.avatar_url = "https://example.com/avatar.png"
        self.profile.portfolio = ["reviews", "cinema club"]
        self.profile.save()

        Follow.objects.create(follower=self.admin, following=self.user)
        self.assertEqual(self.user.follower_links.count(), 1)

        self.movie.image_url = "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
        self.movie.save()
        self.showtime.hall = "Hall A"
        self.showtime.save()
        self.seat.row = 1
        self.seat.column = 1
        self.seat.save()

        post = Post.objects.create(user=self.user, content="Original thought.")
        shared = Post.objects.create(
            user=self.admin,
            content="Sharing this review.",
            original_post=post,
        )
        self.assertEqual(shared.original_post, post)

        booking = Booking.objects.create(
            user=self.user,
            showtime=self.showtime,
            total_price="100.00",
            status=Booking.STATUS_CONFIRMED,
        )
        purchase = Purchase.objects.create(
            user=self.user,
            booking=booking,
            total_amount="100.00",
            payment_status=Purchase.PAYMENT_COMPLETE,
        )
        self.assertEqual(purchase.calculate_points(), 10)

        chatbot = Chatbot.objects.create(user=self.user)
        question = chatbot.ask_mood_question()
        ChatMessage.objects.create(
            chatbot=chatbot,
            content=question,
            sender=ChatMessage.SENDER_BOT,
        )
        mood = chatbot.receive_answer("I want something fast and action heavy")

        self.assertEqual(mood, "action")
        self.assertEqual(chatbot.messages.count(), 1)

    def test_chatbot_recommends_from_current_movie_catalog(self):
        bershama = Movie.objects.create(
            title="Bershama",
            description="Egyptian comedy now playing.",
            duration=105,
            genre="Comedy",
            language="Arabic",
            country="Egypt",
            release_year=2026,
            is_in_cinemas=True,
            is_now_playing=True,
            rating=6.8,
        )
        Showtime.objects.create(
            movie=bershama,
            date=date(2026, 5, 10),
            time=time(20, 0),
            city="Cairo",
            cinema_name="CEEMA Downtown",
        )
        chatbot = Chatbot.objects.create(user=self.user)
        api_client = APIClient()
        api_client.force_authenticate(user=self.user)

        response = api_client.post(
            f"/api/chatbot/{chatbot.id}/receive-answer/",
            {"answer": "I want an Arabic comedy in Cairo cinema"},
            format="json",
        )
        recommendations_response = api_client.get(
            f"/api/chatbot/{chatbot.id}/recommend-movies/?q=Arabic comedy Cairo cinema"
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("Bershama", response.json()["messages"][-1]["content"])
        self.assertEqual(recommendations_response.status_code, 200)
        self.assertEqual(recommendations_response.json()[0]["title"], "Bershama")
