import uuid

from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from django.db import transaction
from drf_spectacular.utils import extend_schema, OpenApiResponse, inline_serializer
from rest_framework import generics, serializers as drf_serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication


def make_tokens(user):
    """Create JWT access + refresh tokens for our custom User model."""
    refresh = RefreshToken()
    refresh["user_id"] = user.id
    refresh["role"] = user.role
    refresh["email"] = user.email
    return str(refresh.access_token), str(refresh)

from .models import (
    Badge, Booking, Chatbot, ChatMessage, Comment, Course, Follow,
    Movie, PaymentTransaction, Post, PostLike, Profile, Purchase,
    Recommendation, Report, Review, Reward, Seat, Showtime, Ticket, User,
)
from .permissions import IsAdmin, IsAdminOrReadOnly, IsOwnerOrAdmin
from .serializers import (
    BadgeSerializer, BookingCreateSerializer, BookingSerializer,
    ChatbotAnswerSerializer, ChatbotSerializer, ChatMessageSerializer,
    CommentSerializer, CourseSerializer, FollowSerializer, LoginSerializer,
    MovieSerializer, PaymentProcessSerializer, PaymentSerializer, PostSerializer,
    ProfileSerializer, PurchaseSerializer, RecommendationSerializer,
    RegisterSerializer, ReportSerializer, ReviewSerializer, RewardSerializer,
    SeatSerializer, ShowtimeSerializer, TicketSerializer, UserSerializer,
    UserUpdateSerializer,
)


# ---------- Auth ----------

@extend_schema(
    tags=["auth"],
    request=RegisterSerializer,
    responses={201: UserSerializer},
    summary="Register a new user account",
)
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        Profile.objects.get_or_create(user=user)
        access, refresh = make_tokens(user)
        return Response({
            "user": UserSerializer(user).data,
            "access": access,
            "refresh": refresh,
        }, status=status.HTTP_201_CREATED)


@extend_schema(
    tags=["auth"],
    request=LoginSerializer,
    responses={200: inline_serializer("LoginResponse", fields={
        "access": drf_serializers.CharField(),
        "refresh": drf_serializers.CharField(),
        "user": UserSerializer(),
    })},
    summary="Login and receive JWT tokens",
)
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        if user.is_banned:
            return Response(
                {"detail": "This account is banned."},
                status=status.HTTP_403_FORBIDDEN,
            )
        access, refresh = make_tokens(user)
        return Response({
            "user": UserSerializer(user).data,
            "access": access,
            "refresh": refresh,
        })


@extend_schema(
    tags=["auth"],
    request=None,
    responses={200: inline_serializer("LogoutResponse", fields={"detail": drf_serializers.CharField()})},
    summary="Logout (client should discard the token)",
)
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Tokens are stateless - client should discard the token on logout
        return Response({"detail": "Logged out successfully."}, status=status.HTTP_200_OK)


# ---------- Users ----------

@extend_schema(tags=["users"])
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action == "list":
            return [IsAdmin()]
        if self.action in ["retrieve", "update", "partial_update"]:
            return [IsOwnerOrAdmin()]
        if self.action == "destroy":
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ["update", "partial_update"]:
            return UserUpdateSerializer
        return UserSerializer

    @action(detail=True, methods=["get", "put", "patch"], url_path="profile")
    def profile(self, request, pk=None):
        user = self.get_object()
        profile, _ = Profile.objects.get_or_create(user=user)
        if request.method == "GET":
            return Response(ProfileSerializer(profile).data)
        serializer = ProfileSerializer(profile, data=request.data, partial=request.method == "PATCH")
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="follow")
    def follow(self, request, pk=None):
        target = self.get_object()
        if target == request.user:
            return Response({"detail": "You cannot follow yourself."}, status=400)
        follow, created = Follow.objects.get_or_create(
            follower=request.user, following=target
        )
        Profile.objects.get_or_create(user=target)
        target.profile.followers_count = target.follower_links.count()
        target.profile.save(update_fields=["followers_count"])
        return Response(
            {
                "following": True,
                "created": created,
                "followers_count": target.profile.followers_count,
                "follow": FollowSerializer(follow).data,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="unfollow")
    def unfollow(self, request, pk=None):
        target = self.get_object()
        deleted, _ = Follow.objects.filter(
            follower=request.user, following=target
        ).delete()
        profile, _ = Profile.objects.get_or_create(user=target)
        profile.followers_count = target.follower_links.count()
        profile.save(update_fields=["followers_count"])
        return Response({"following": False, "removed": bool(deleted)})

    @action(detail=True, methods=["get"], url_path="followers")
    def followers(self, request, pk=None):
        user = self.get_object()
        return Response(FollowSerializer(user.follower_links.all(), many=True).data)

    @action(detail=True, methods=["get"], url_path="following")
    def following(self, request, pk=None):
        user = self.get_object()
        return Response(FollowSerializer(user.following_links.all(), many=True).data)


# ---------- Movies ----------

@extend_schema(tags=["movies"])
class MovieViewSet(viewsets.ModelViewSet):
    queryset = Movie.objects.all()
    serializer_class = MovieSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve", "search"]:
            return [AllowAny()]
        return [IsAdmin()]

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def search(self, request):
        qs = Movie.objects.all()
        q = request.query_params.get("q")
        genre = request.query_params.get("genre")
        if q:
            qs = qs.filter(title__icontains=q)
        if genre:
            qs = qs.filter(genre__icontains=genre)
        return Response(MovieSerializer(qs, many=True).data)

    @action(detail=True, methods=["get", "post"], url_path="reviews")
    def reviews(self, request, pk=None):
        movie = self.get_object()
        if request.method == "GET":
            reviews = Review.objects.filter(movie=movie)
            return Response(ReviewSerializer(reviews, many=True).data)
        serializer = ReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, movie=movie)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="showtimes")
    def showtimes(self, request, pk=None):
        movie = self.get_object()
        return Response(ShowtimeSerializer(movie.showtimes.all(), many=True).data)


# ---------- Showtimes ----------

@extend_schema(tags=["showtimes"])
class ShowtimeViewSet(viewsets.ModelViewSet):
    queryset = Showtime.objects.select_related("movie").all()
    serializer_class = ShowtimeSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve", "seats"]:
            return [AllowAny()]
        return [IsAdmin()]

    @action(detail=True, methods=["get"], permission_classes=[AllowAny])
    def seats(self, request, pk=None):
        showtime = self.get_object()
        seats = Seat.objects.filter(showtime=showtime)
        return Response(SeatSerializer(seats, many=True).data)


@extend_schema(tags=["seats"])
class SeatViewSet(viewsets.ModelViewSet):
    queryset = Seat.objects.select_related("showtime", "showtime__movie").all()
    serializer_class = SeatSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        if self.action in ["reserve", "release"]:
            return [IsAuthenticated()]
        return [IsAdmin()]

    @action(detail=True, methods=["post"], url_path="reserve")
    def reserve(self, request, pk=None):
        seat = self.get_object()
        try:
            seat.reserve()
        except DjangoValidationError as exc:
            return Response({"detail": exc.message}, status=400)
        return Response(SeatSerializer(seat).data)

    @action(detail=True, methods=["post"], url_path="release")
    def release(self, request, pk=None):
        seat = self.get_object()
        seat.release()
        return Response(SeatSerializer(seat).data)


# ---------- Bookings ----------

@extend_schema(tags=["bookings"])
class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Booking.objects.none()
        if self.request.user.role == "admin":
            return Booking.objects.all()
        return Booking.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == "create":
            return BookingCreateSerializer
        return BookingSerializer

    @extend_schema(request=BookingCreateSerializer, responses={201: BookingSerializer})
    def create(self, request, *args, **kwargs):
        serializer = BookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        showtime = Showtime.objects.get(id=data["showtime_id"])
        seats = data["seats"]
        total = data["price_per_seat"] * len(seats)

        with transaction.atomic():
            booking = Booking.objects.create(
                user=request.user,
                showtime=showtime,
                total_price=total,
                status=Booking.STATUS_CONFIRMED,
            )

            points = 10 * len(seats)
            purchase = Purchase.objects.create(
                user=request.user,
                booking=booking,
                total_amount=total,
                payment_status=Purchase.PAYMENT_COMPLETE,
                points_earned=points,
            )
            PaymentTransaction.objects.create(
                booking=booking,
                purchase=purchase,
                provider="mock",
                method="mock-card",
                amount=total,
                status=PaymentTransaction.STATUS_PAID,
                external_reference=f"MOCK-{uuid.uuid4().hex[:12].upper()}",
            )

            for seat in seats:
                seat.status = Seat.STATUS_BOOKED
                seat.save(update_fields=["status"])
                Ticket.objects.create(
                    booking=booking,
                    showtime=showtime,
                    seat=seat,
                    ticket_code=str(uuid.uuid4()).upper()[:12],
                    qr_code=f"QR-{booking.id}-{seat.seat_number}",
                )

            booking.award_points(points=points)
        return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        booking = self.get_object()
        self.check_object_permissions(request, booking)
        if booking.status == Booking.STATUS_CANCELLED:
            return Response({"detail": "Already cancelled."}, status=400)
        # Free up the seats
        for ticket in booking.tickets.all():
            ticket.seat.status = Seat.STATUS_AVAILABLE
            ticket.seat.save(update_fields=["status"])
        booking.status = Booking.STATUS_CANCELLED
        booking.save(update_fields=["status"])
        if hasattr(booking, "purchase"):
            booking.purchase.payment_status = Purchase.PAYMENT_REFUNDED
            booking.purchase.save(update_fields=["payment_status"])
        if hasattr(booking, "payment"):
            booking.payment.status = PaymentTransaction.STATUS_REFUNDED
            booking.payment.save(update_fields=["status"])
        return Response(BookingSerializer(booking).data)

    @action(detail=True, methods=["get"], url_path="tickets")
    def tickets(self, request, pk=None):
        booking = self.get_object()
        self.check_object_permissions(request, booking)
        return Response(TicketSerializer(booking.tickets.all(), many=True).data)


@extend_schema(tags=["tickets"])
class TicketViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Ticket.objects.none()
        qs = Ticket.objects.select_related("booking", "showtime", "seat", "booking__user")
        if self.request.user.role == "admin":
            return qs
        return qs.filter(booking__user=self.request.user)


# ---------- Posts ----------

@extend_schema(tags=["posts"])
class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by("-created_at")
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_permissions(self):
        if self.action in ["destroy", "update", "partial_update"]:
            return [IsOwnerOrAdmin()]
        return [IsAuthenticated()]

    @action(detail=True, methods=["post"], url_path="like")
    def like(self, request, pk=None):
        post = self.get_object()
        like, created = PostLike.objects.get_or_create(user=request.user, post=post)
        if not created:
            like.delete()
            return Response({"liked": False, "likes_count": post.likes.count()})
        return Response({"liked": True, "likes_count": post.likes.count()}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="share")
    def share(self, request, pk=None):
        original = self.get_object()
        content = request.data.get("content") or original.content
        post = Post.objects.create(
            user=request.user,
            content=content,
            original_post=original,
        )
        return Response(PostSerializer(post).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get", "post"], url_path="comments")
    def comments(self, request, pk=None):
        post = self.get_object()
        if request.method == "GET":
            return Response(CommentSerializer(post.comments.all(), many=True).data)
        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, post=post)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ---------- Courses ----------

@extend_schema(tags=["courses"])
class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def enroll(self, request, pk=None):
        course = self.get_object()
        if request.user in course.users.all():
            return Response({"detail": "Already enrolled."}, status=400)
        course.users.add(request.user)
        return Response({"detail": f"Enrolled in '{course.title}'."})

    @action(detail=True, methods=["post"], url_path="unenroll", permission_classes=[IsAuthenticated])
    def unenroll(self, request, pk=None):
        course = self.get_object()
        course.users.remove(request.user)
        return Response({"detail": f"Unenrolled from '{course.title}'."})


@extend_schema(tags=["reviews"])
class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Review.objects.none()
        qs = Review.objects.select_related("user", "movie", "course").all()
        if self.request.user.role == "admin":
            return qs
        return qs.filter(user=self.request.user)

    def get_permissions(self):
        if self.action in ["update", "partial_update", "destroy", "retrieve"]:
            return [IsOwnerOrAdmin()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        movie_id = request.data.get("movie_id") or request.data.get("movie")
        movie = get_object_or_404(Movie, id=movie_id)
        serializer = ReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, movie=movie)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ---------- Badges & Rewards ----------

@extend_schema(tags=["badges & rewards"])
class BadgeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer
    permission_classes = [IsAuthenticated]


@extend_schema(tags=["badges & rewards"])
class RewardViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Reward.objects.all()
    serializer_class = RewardSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["post"], url_path="redeem")
    def redeem(self, request, pk=None):
        reward = self.get_object()
        if request.user.points < reward.points_required:
            return Response({"detail": "Not enough points."}, status=400)
        request.user.points -= reward.points_required
        request.user.save(update_fields=["points"])
        reward.users.add(request.user)
        return Response(
            {
                "detail": f"Redeemed '{reward.name}'.",
                "points": request.user.points,
                "reward": RewardSerializer(reward).data,
            }
        )


# ---------- Recommendations ----------

@extend_schema(tags=["recommendations"])
class RecommendationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RecommendationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Recommendation.objects.none()
        return Recommendation.objects.filter(user=self.request.user).select_related("movie")


# ---------- Admin: Reports ----------

@extend_schema(tags=["admin"])
class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsAdmin]

    def perform_create(self, serializer):
        from .models import Admin as AdminModel
        admin = get_object_or_404(AdminModel, id=self.request.user.id)
        serializer.save(admin=admin)

    @action(detail=True, methods=["post"], url_path="review")
    def review(self, request, pk=None):
        report = self.get_object()
        report.status = request.data.get("status", Report.STATUS_REVIEWED)
        if "reason" in request.data:
            report.reason = request.data["reason"]
        report.save(update_fields=["status", "reason"])
        return Response(ReportSerializer(report).data)


# ---------- Admin: User management ----------

@extend_schema(tags=["admin"])
class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    @action(detail=True, methods=["post"], url_path="ban")
    def ban(self, request, pk=None):
        user = self.get_object()
        user.is_banned = True
        user.save(update_fields=["is_banned"])
        return Response(UserSerializer(user).data)

    @action(detail=True, methods=["post"], url_path="unban")
    def unban(self, request, pk=None):
        user = self.get_object()
        user.is_banned = False
        user.save(update_fields=["is_banned"])
        return Response(UserSerializer(user).data)

    @action(detail=False, methods=["get"], url_path="statistics")
    def statistics(self, request):
        return Response({
            "users": User.objects.count(),
            "movies": Movie.objects.count(),
            "showtimes": Showtime.objects.count(),
            "bookings": Booking.objects.count(),
            "tickets": Ticket.objects.count(),
            "posts": Post.objects.count(),
            "reports_open": Report.objects.filter(status=Report.STATUS_OPEN).count(),
            "payments_paid": PaymentTransaction.objects.filter(
                status=PaymentTransaction.STATUS_PAID
            ).count(),
        })


@extend_schema(tags=["purchases"])
class PurchaseViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PurchaseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Purchase.objects.none()
        if self.request.user.role == "admin":
            return Purchase.objects.all()
        return Purchase.objects.filter(user=self.request.user)


@extend_schema(tags=["payments"])
class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return PaymentTransaction.objects.none()
        qs = PaymentTransaction.objects.select_related("booking", "purchase")
        if self.request.user.role == "admin":
            return qs
        return qs.filter(booking__user=self.request.user)

    @extend_schema(request=PaymentProcessSerializer, responses={201: PaymentSerializer})
    @action(detail=False, methods=["post"], url_path="mock-process")
    def mock_process(self, request):
        serializer = PaymentProcessSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        booking = get_object_or_404(Booking, id=data["booking_id"])
        if request.user.role != "admin" and booking.user != request.user:
            return Response({"detail": "Not allowed."}, status=403)

        purchase, _ = Purchase.objects.get_or_create(
            booking=booking,
            defaults={
                "user": booking.user,
                "total_amount": booking.total_price,
                "payment_status": Purchase.PAYMENT_NEW,
            },
        )
        if purchase.points_earned == 0:
            purchase.calculate_points()
        purchase.payment_status = (
            Purchase.PAYMENT_COMPLETE if data["mark_paid"] else Purchase.PAYMENT_FAILED
        )
        purchase.save(update_fields=["points_earned", "payment_status"])

        payment, _ = PaymentTransaction.objects.update_or_create(
            booking=booking,
            defaults={
                "purchase": purchase,
                "provider": data["provider"],
                "method": data["method"],
                "amount": booking.total_price,
                "status": PaymentTransaction.STATUS_PAID
                if data["mark_paid"]
                else PaymentTransaction.STATUS_FAILED,
                "external_reference": f"MOCK-{uuid.uuid4().hex[:12].upper()}",
            },
        )
        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=["chatbot"])
class ChatbotViewSet(viewsets.ModelViewSet):
    serializer_class = ChatbotSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Chatbot.objects.none()
        if self.request.user.role == "admin":
            return Chatbot.objects.all()
        return Chatbot.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"], url_path="ask-mood-question")
    def ask_mood_question(self, request, pk=None):
        chatbot = self.get_object()
        question = chatbot.ask_mood_question()
        ChatMessage.objects.create(
            chatbot=chatbot,
            content=question,
            sender=ChatMessage.SENDER_BOT,
        )
        return Response(ChatbotSerializer(chatbot).data)

    @extend_schema(request=ChatbotAnswerSerializer, responses={200: ChatbotSerializer})
    @action(detail=True, methods=["post"], url_path="receive-answer")
    def receive_answer(self, request, pk=None):
        chatbot = self.get_object()
        serializer = ChatbotAnswerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        answer = serializer.validated_data["answer"]
        ChatMessage.objects.create(
            chatbot=chatbot,
            content=answer,
            sender=ChatMessage.SENDER_USER,
        )
        mood = chatbot.receive_answer(answer)
        ChatMessage.objects.create(
            chatbot=chatbot,
            content=f"Detected mood: {mood}",
            sender=ChatMessage.SENDER_BOT,
        )
        return Response(ChatbotSerializer(chatbot).data)

    @action(detail=True, methods=["get"], url_path="recommend-movies")
    def recommend_movies(self, request, pk=None):
        chatbot = self.get_object()
        qs = Movie.objects.all()
        if chatbot.current_mood in {"happy"}:
            qs = qs.filter(genre__icontains="comedy")
        elif chatbot.current_mood in {"emotional"}:
            qs = qs.filter(genre__icontains="drama")
        elif chatbot.current_mood in {"thriller"}:
            qs = qs.filter(genre__icontains="thriller")
        elif chatbot.current_mood in {"action"}:
            qs = qs.filter(genre__icontains="action")
        if not qs.exists():
            qs = Movie.objects.order_by("-rating")[:5]
        return Response(MovieSerializer(qs, many=True).data)
