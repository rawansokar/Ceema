import uuid

from django.shortcuts import get_object_or_404
from rest_framework import generics, status, viewsets
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
    Badge, Booking, Comment, Course, Movie, Post, PostLike,
    Profile, Recommendation, Report, Review, Reward, Seat,
    Showtime, Ticket, User,
)
from .permissions import IsAdmin, IsAdminOrReadOnly, IsOwnerOrAdmin
from .serializers import (
    BadgeSerializer, BookingCreateSerializer, BookingSerializer,
    CommentSerializer, CourseSerializer, LoginSerializer, MovieSerializer,
    PostSerializer, ProfileSerializer, RecommendationSerializer,
    RegisterSerializer, ReportSerializer, ReviewSerializer, RewardSerializer,
    SeatSerializer, ShowtimeSerializer, TicketSerializer, UserSerializer,
    UserUpdateSerializer,
)


# ---------- Auth ----------

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


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        access, refresh = make_tokens(user)
        return Response({
            "user": UserSerializer(user).data,
            "access": access,
            "refresh": refresh,
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Tokens are stateless - client should discard the token on logout
        return Response({"detail": "Logged out successfully."}, status=status.HTTP_200_OK)


# ---------- Users ----------

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


# ---------- Movies ----------

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


# ---------- Showtimes ----------

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


# ---------- Bookings ----------

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == "admin":
            return Booking.objects.all()
        return Booking.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == "create":
            return BookingCreateSerializer
        return BookingSerializer

    def create(self, request, *args, **kwargs):
        serializer = BookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        showtime = Showtime.objects.get(id=data["showtime_id"])
        seats = data["seats"]
        total = data["price_per_seat"] * len(seats)

        booking = Booking.objects.create(
            user=request.user,
            showtime=showtime,
            total_price=total,
            status=Booking.STATUS_CONFIRMED,
        )

        for seat in seats:
            seat.status = "booked"
            seat.save(update_fields=["status"])
            Ticket.objects.create(
                booking=booking,
                showtime=showtime,
                seat=seat,
                ticket_code=str(uuid.uuid4()).upper()[:12],
                qr_code=f"QR-{booking.id}-{seat.seat_number}",
            )

        booking.award_points(points=10 * len(seats))
        return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        booking = self.get_object()
        self.check_object_permissions(request, booking)
        if booking.status == Booking.STATUS_CANCELLED:
            return Response({"detail": "Already cancelled."}, status=400)
        # Free up the seats
        for ticket in booking.tickets.all():
            ticket.seat.status = "available"
            ticket.seat.save(update_fields=["status"])
        booking.status = Booking.STATUS_CANCELLED
        booking.save(update_fields=["status"])
        return Response(BookingSerializer(booking).data)

    @action(detail=True, methods=["get"], url_path="tickets")
    def tickets(self, request, pk=None):
        booking = self.get_object()
        self.check_object_permissions(request, booking)
        return Response(TicketSerializer(booking.tickets.all(), many=True).data)


# ---------- Posts ----------

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


# ---------- Badges & Rewards ----------

class BadgeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer
    permission_classes = [IsAuthenticated]


class RewardViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Reward.objects.all()
    serializer_class = RewardSerializer
    permission_classes = [IsAuthenticated]


# ---------- Recommendations ----------

class RecommendationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RecommendationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Recommendation.objects.filter(user=self.request.user).select_related("movie")


# ---------- Admin: Reports ----------

class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsAdmin]

    def perform_create(self, serializer):
        from .models import Admin as AdminModel
        admin = get_object_or_404(AdminModel, id=self.request.user.id)
        serializer.save(admin=admin)


# ---------- Admin: User management ----------

class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
