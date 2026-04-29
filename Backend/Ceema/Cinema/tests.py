from datetime import date, time

from django.test import TestCase
from django.core.exceptions import ValidationError

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
    PaymentTransaction,
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
