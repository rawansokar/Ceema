import logging
import uuid

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.db import transaction
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiResponse, inline_serializer
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
    Movie, MovieCredit, NewsArticle, PaymentTransaction, Person, Post, PostLike, Profile, Purchase,
    Recommendation, Report, Review, Reward, Seat, Showtime, Ticket, User,
)
from .permissions import IsAdmin, IsAdminOrReadOnly, IsOwnerOrAdmin
from .serializers import (
    BadgeSerializer, BookingCreateSerializer, BookingSerializer,
    ChatbotAnswerSerializer, ChatbotSerializer, ChatMessageSerializer,
    CommentSerializer, CourseSerializer, FollowSerializer, LoginSerializer,
    MovieCreditSerializer, MovieSerializer, NewsArticleSerializer,
    PaymentProcessSerializer, PaymentSerializer, PersonSerializer,
    PostSerializer, ProfileSerializer, PurchaseSerializer, RecommendationSerializer,
    RegisterSerializer, ReportSerializer, ReviewSerializer, RewardSerializer,
    SeatSerializer, ShowtimeSerializer, TicketSerializer, UserSerializer,
    UserUpdateSerializer,
)
from .services import send_booking_confirmation_email, send_welcome_email

logger = logging.getLogger(__name__)


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
        email_result = send_welcome_email(user)
        if not email_result.get("sent") and not email_result.get("id"):
            logger.warning("Welcome email was not sent for user %s: %s", user.id, email_result)
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

@extend_schema_view(
    list=extend_schema(summary="List all users (admin only)"),
    retrieve=extend_schema(summary="Get a user by ID"),
    create=extend_schema(summary="Create a user (use /api/auth/register/ instead for self-signup)"),
    update=extend_schema(summary="Replace user info (owner or admin)"),
    partial_update=extend_schema(summary="Update some user fields (owner or admin)"),
    destroy=extend_schema(summary="Delete a user (admin only)"),
)
@extend_schema(tags=["users"])
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action == "list":
            return [IsAdmin()]
        if self.action in ["retrieve", "update", "partial_update", "profile"]:
            return [IsOwnerOrAdmin()]
        if self.action == "destroy":
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ["update", "partial_update"]:
            return UserUpdateSerializer
        return UserSerializer

    @extend_schema(summary="Get or update this user's profile (bio, avatar, etc.)")
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

    @extend_schema(request=None, summary="Follow this user")
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

    @extend_schema(request=None, summary="Unfollow this user")
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

    @extend_schema(summary="List users who follow this user")
    @action(detail=True, methods=["get"], url_path="followers")
    def followers(self, request, pk=None):
        user = self.get_object()
        return Response(FollowSerializer(user.follower_links.all(), many=True).data)

    @extend_schema(summary="List users that this user follows")
    @action(detail=True, methods=["get"], url_path="following")
    def following(self, request, pk=None):
        user = self.get_object()
        return Response(FollowSerializer(user.following_links.all(), many=True).data)


# ---------- Movies ----------

MOVIE_FILTER_PARAMS = [
    OpenApiParameter("q", OpenApiTypes.STR, description="Search by title or description (case-insensitive)"),
    OpenApiParameter("genre", OpenApiTypes.STR, description="Filter by genre (e.g. Sci-Fi, Action)"),
    OpenApiParameter("language", OpenApiTypes.STR, description="Filter by language (e.g. English, Arabic)"),
    OpenApiParameter("year", OpenApiTypes.INT, description="Filter by release year"),
    OpenApiParameter("country", OpenApiTypes.STR, description="Filter by country"),
    OpenApiParameter("city", OpenApiTypes.STR, description="Filter by showtime city"),
    OpenApiParameter("date", OpenApiTypes.DATE, description="Filter by showtime date (YYYY-MM-DD)"),
    OpenApiParameter("min_rating", OpenApiTypes.NUMBER, description="Minimum rating (0–10)"),
    OpenApiParameter("now_playing", OpenApiTypes.BOOL, description="Only currently-playing movies"),
    OpenApiParameter("in_cinemas", OpenApiTypes.BOOL, description="Only movies in cinemas"),
    OpenApiParameter("featured", OpenApiTypes.BOOL, description="Only featured movies"),
]


@extend_schema_view(
    list=extend_schema(parameters=MOVIE_FILTER_PARAMS, summary="List movies (with optional filters)"),
    retrieve=extend_schema(summary="Get a single movie by ID"),
    create=extend_schema(summary="Create a new movie (admin only)"),
    update=extend_schema(summary="Replace a movie (admin only)"),
    partial_update=extend_schema(summary="Update some fields of a movie (admin only)"),
    destroy=extend_schema(summary="Delete a movie (admin only)"),
)
@extend_schema(tags=["movies"])
class MovieViewSet(viewsets.ModelViewSet):
    serializer_class = MovieSerializer

    def get_queryset(self):
        qs = Movie.objects.prefetch_related("credits__person").all()
        if getattr(self, "swagger_fake_view", False):
            return qs.none()
        q = self.request.query_params.get("q")
        genre = self.request.query_params.get("genre")
        language = self.request.query_params.get("language")
        year = self.request.query_params.get("year") or self.request.query_params.get("release_year")
        country = self.request.query_params.get("country")
        city = self.request.query_params.get("city")
        show_date = self.request.query_params.get("date")
        min_rating = self.request.query_params.get("min_rating")
        now_playing = self.request.query_params.get("now_playing")
        in_cinemas = self.request.query_params.get("in_cinemas")
        featured = self.request.query_params.get("featured")

        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q))
        if genre:
            qs = qs.filter(genre__icontains=genre)
        if language:
            qs = qs.filter(language__iexact=language)
        if year:
            qs = qs.filter(release_year=year)
        if country:
            qs = qs.filter(country__iexact=country)
        if city:
            qs = qs.filter(showtimes__city__iexact=city)
        if show_date:
            qs = qs.filter(showtimes__date=show_date)
        if min_rating:
            qs = qs.filter(rating__gte=min_rating)
        if now_playing is not None:
            qs = qs.filter(is_now_playing=now_playing.lower() in {"1", "true", "yes"})
        if in_cinemas is not None:
            qs = qs.filter(is_in_cinemas=in_cinemas.lower() in {"1", "true", "yes"})
        if featured is not None:
            qs = qs.filter(is_featured=featured.lower() in {"1", "true", "yes"})
        return qs.distinct()

    def get_permissions(self):
        public_actions = [
            "list",
            "retrieve",
            "search",
            "filters",
            "featured",
            "now_playing",
            "in_cinemas",
            "highest_grossing_egyptian",
            "credits",
        ]
        if self.action in public_actions:
            return [AllowAny()]
        return [IsAdmin()]

    @extend_schema(parameters=MOVIE_FILTER_PARAMS, summary="Search & filter movies")
    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def search(self, request):
        return Response(MovieSerializer(self.get_queryset(), many=True).data)

    @extend_schema(
        summary="Get available filter values (genres, languages, years, cities)",
        description="Returns lists of all unique genres, languages, release years, and showtime cities so the front-end can populate dropdowns.",
        responses={200: inline_serializer("FilterOptions", fields={
            "genres": drf_serializers.ListField(child=drf_serializers.CharField()),
            "languages": drf_serializers.ListField(child=drf_serializers.CharField()),
            "years": drf_serializers.ListField(child=drf_serializers.IntegerField()),
            "cities": drf_serializers.ListField(child=drf_serializers.CharField()),
        })},
    )
    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def filters(self, request):
        movies = Movie.objects.all()
        cities = Showtime.objects.exclude(city="").values_list("city", flat=True).distinct()
        return Response(
            {
                "genres": sorted(set(movies.exclude(genre="").values_list("genre", flat=True))),
                "languages": sorted(set(movies.exclude(language="").values_list("language", flat=True))),
                "years": sorted(set(movies.exclude(release_year=None).values_list("release_year", flat=True)), reverse=True),
                "cities": sorted(set(cities)),
            }
        )

    @extend_schema(summary="List featured/highlighted movies")
    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def featured(self, request):
        movies = self.get_queryset().filter(is_featured=True)
        return Response(MovieSerializer(movies, many=True).data)

    @extend_schema(summary="List movies currently playing")
    @action(detail=False, methods=["get"], permission_classes=[AllowAny], url_path="now-playing")
    def now_playing(self, request):
        movies = self.get_queryset().filter(is_now_playing=True)
        return Response(MovieSerializer(movies, many=True).data)

    @extend_schema(summary="List movies still showing in cinemas")
    @action(detail=False, methods=["get"], permission_classes=[AllowAny], url_path="in-cinemas")
    def in_cinemas(self, request):
        movies = self.get_queryset().filter(is_in_cinemas=True)
        return Response(MovieSerializer(movies, many=True).data)

    @extend_schema(summary="Top-grossing Egyptian/Arabic movies (ranked by box office in EGP)")
    @action(detail=False, methods=["get"], permission_classes=[AllowAny], url_path="highest-grossing-egyptian")
    def highest_grossing_egyptian(self, request):
        movies = (
            self.get_queryset()
            .filter(box_office_gross_egp__isnull=False)
            .filter(Q(country__iexact="Egypt") | Q(language__iexact="Arabic"))
            .order_by("-box_office_gross_egp")
        )
        return Response(MovieSerializer(movies, many=True).data)

    @extend_schema(
        methods=["GET"],
        responses={200: ReviewSerializer(many=True)},
        summary="List reviews for this movie",
    )
    @extend_schema(
        methods=["POST"],
        request=ReviewSerializer,
        responses={201: ReviewSerializer},
        summary="Add a review for this movie",
    )
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

    @extend_schema(summary="List all showtimes for this movie")
    @action(detail=True, methods=["get"], url_path="showtimes")
    def showtimes(self, request, pk=None):
        movie = self.get_object()
        return Response(ShowtimeSerializer(movie.showtimes.all(), many=True).data)

    @extend_schema(summary="List cast & crew credits for this movie")
    @action(detail=True, methods=["get"], permission_classes=[AllowAny])
    def credits(self, request, pk=None):
        movie = self.get_object()
        credits = MovieCredit.objects.select_related("person").filter(movie=movie)
        return Response(MovieCreditSerializer(credits, many=True).data)


PERSON_FILTER_PARAMS = [
    OpenApiParameter("q", OpenApiTypes.STR, description="Search by full name"),
    OpenApiParameter("role", OpenApiTypes.STR, description="Filter by primary role: actor, director, screenwriter, dop, producer"),
]


@extend_schema_view(
    list=extend_schema(parameters=PERSON_FILTER_PARAMS, summary="List people (with optional filters)"),
    retrieve=extend_schema(summary="Get a person by ID"),
    create=extend_schema(summary="Create a new person (admin only)"),
    update=extend_schema(summary="Replace a person (admin only)"),
    partial_update=extend_schema(summary="Update some fields of a person (admin only)"),
    destroy=extend_schema(summary="Delete a person (admin only)"),
)
@extend_schema(tags=["people"])
class PersonViewSet(viewsets.ModelViewSet):
    serializer_class = PersonSerializer

    def get_queryset(self):
        qs = Person.objects.all()
        if getattr(self, "swagger_fake_view", False):
            return qs.none()
        q = self.request.query_params.get("q")
        role = self.request.query_params.get("role")
        if q:
            qs = qs.filter(full_name__icontains=q)
        if role:
            qs = qs.filter(primary_role=role)
        return qs

    def get_permissions(self):
        if self.action in ["list", "retrieve", "actors", "filmmakers"]:
            return [AllowAny()]
        return [IsAdmin()]

    @extend_schema(summary="List only actors")
    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def actors(self, request):
        people = self.get_queryset().filter(primary_role=Person.ROLE_ACTOR)
        return Response(PersonSerializer(people, many=True).data)

    @extend_schema(summary="List only filmmakers (directors, writers, DOPs, producers)")
    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def filmmakers(self, request):
        people = self.get_queryset().exclude(primary_role=Person.ROLE_ACTOR)
        return Response(PersonSerializer(people, many=True).data)


# ---------- News ----------

NEWS_FILTER_PARAMS = [
    OpenApiParameter("q", OpenApiTypes.STR, description="Search by title or summary"),
    OpenApiParameter("category", OpenApiTypes.STR, description="Filter by category: movies, box_office, awards, streaming, tv"),
    OpenApiParameter("featured", OpenApiTypes.BOOL, description="Only featured articles"),
]


@extend_schema_view(
    list=extend_schema(parameters=NEWS_FILTER_PARAMS, summary="List news articles (with optional filters)"),
    retrieve=extend_schema(summary="Get a news article by ID"),
    create=extend_schema(summary="Publish a new news article (admin only)"),
    update=extend_schema(summary="Replace a news article (admin only)"),
    partial_update=extend_schema(summary="Update some fields of a news article (admin only)"),
    destroy=extend_schema(summary="Delete a news article (admin only)"),
)
@extend_schema(tags=["news"])
class NewsArticleViewSet(viewsets.ModelViewSet):
    serializer_class = NewsArticleSerializer

    def get_queryset(self):
        qs = NewsArticle.objects.select_related("created_by")
        if getattr(self, "swagger_fake_view", False):
            return qs.none()
        is_admin = (
            self.request.user
            and self.request.user.is_authenticated
            and self.request.user.role == "admin"
        )
        if not is_admin:
            qs = qs.filter(is_published=True)
        q = self.request.query_params.get("q")
        category = self.request.query_params.get("category")
        featured = self.request.query_params.get("featured")
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(summary__icontains=q))
        if category:
            qs = qs.filter(category=category)
        if featured is not None:
            qs = qs.filter(is_featured=featured.lower() in {"1", "true", "yes"})
        return qs.distinct()

    def get_permissions(self):
        if self.action in ["list", "retrieve", "featured"]:
            return [AllowAny()]
        return [IsAdmin()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @extend_schema(summary="List only featured news articles")
    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def featured(self, request):
        articles = self.get_queryset().filter(is_featured=True)
        return Response(NewsArticleSerializer(articles, many=True).data)


# ---------- Showtimes ----------

SHOWTIME_FILTER_PARAMS = [
    OpenApiParameter("city", OpenApiTypes.STR, description="Filter by city"),
    OpenApiParameter("genre", OpenApiTypes.STR, description="Filter by movie genre"),
    OpenApiParameter("date", OpenApiTypes.DATE, description="Filter by showtime date (YYYY-MM-DD)"),
    OpenApiParameter("movie", OpenApiTypes.INT, description="Filter by movie ID"),
]


@extend_schema_view(
    list=extend_schema(parameters=SHOWTIME_FILTER_PARAMS, summary="List showtimes (with optional filters)"),
    retrieve=extend_schema(summary="Get a showtime by ID"),
    create=extend_schema(summary="Schedule a new showtime (admin only)"),
    update=extend_schema(summary="Replace a showtime (admin only)"),
    partial_update=extend_schema(summary="Update some fields of a showtime (admin only)"),
    destroy=extend_schema(summary="Delete a showtime (admin only)"),
)
@extend_schema(tags=["showtimes"])
class ShowtimeViewSet(viewsets.ModelViewSet):
    serializer_class = ShowtimeSerializer

    def get_queryset(self):
        qs = Showtime.objects.select_related("movie").all()
        if getattr(self, "swagger_fake_view", False):
            return qs.none()
        city = self.request.query_params.get("city")
        genre = self.request.query_params.get("genre")
        show_date = self.request.query_params.get("date")
        movie = self.request.query_params.get("movie")
        if city:
            qs = qs.filter(city__iexact=city)
        if genre:
            qs = qs.filter(movie__genre__icontains=genre)
        if show_date:
            qs = qs.filter(date=show_date)
        if movie:
            qs = qs.filter(movie_id=movie)
        return qs

    def get_permissions(self):
        if self.action in ["list", "retrieve", "seats"]:
            return [AllowAny()]
        return [IsAdmin()]

    @extend_schema(summary="List all seats for this showtime (with availability status)")
    @action(detail=True, methods=["get"], permission_classes=[AllowAny])
    def seats(self, request, pk=None):
        showtime = self.get_object()
        seats = Seat.objects.filter(showtime=showtime)
        return Response(SeatSerializer(seats, many=True).data)


@extend_schema_view(
    list=extend_schema(summary="List all seats"),
    retrieve=extend_schema(summary="Get a seat by ID"),
    create=extend_schema(summary="Create a new seat (admin only)"),
    update=extend_schema(summary="Replace a seat (admin only)"),
    partial_update=extend_schema(summary="Update some fields of a seat (admin only)"),
    destroy=extend_schema(summary="Delete a seat (admin only)"),
)
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

    @extend_schema(request=None, responses={200: SeatSerializer}, summary="Reserve this seat")
    @action(detail=True, methods=["post"], url_path="reserve")
    def reserve(self, request, pk=None):
        seat = self.get_object()
        try:
            seat.reserve()
        except DjangoValidationError as exc:
            return Response({"detail": exc.message}, status=400)
        return Response(SeatSerializer(seat).data)

    @extend_schema(request=None, responses={200: SeatSerializer}, summary="Release a reserved seat")
    @action(detail=True, methods=["post"], url_path="release")
    def release(self, request, pk=None):
        seat = self.get_object()
        seat.release()
        return Response(SeatSerializer(seat).data)


# ---------- Bookings ----------

@extend_schema_view(
    list=extend_schema(summary="List your bookings (admins see all)"),
    retrieve=extend_schema(summary="Get one of your bookings"),
    create=extend_schema(summary="Book a showtime — pick seats and pay"),
    update=extend_schema(summary="Replace a booking"),
    partial_update=extend_schema(summary="Update some fields of a booking"),
    destroy=extend_schema(summary="Delete a booking"),
)
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
        total = data.get("total_price") or (data["price_per_seat"] * len(seats))

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
        email_result = send_booking_confirmation_email(booking)
        if not email_result.get("sent") and not email_result.get("id"):
            logger.warning(
                "Booking confirmation email was not sent for booking %s: %s",
                booking.id,
                email_result,
            )
        return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)

    @extend_schema(request=None, responses={200: BookingSerializer}, summary="Cancel this booking")
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

    @extend_schema(summary="List all tickets in this booking")
    @action(detail=True, methods=["get"], url_path="tickets")
    def tickets(self, request, pk=None):
        booking = self.get_object()
        self.check_object_permissions(request, booking)
        return Response(TicketSerializer(booking.tickets.all(), many=True).data)


@extend_schema_view(
    list=extend_schema(summary="List all your tickets"),
    retrieve=extend_schema(summary="Get a ticket by ID"),
)
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

@extend_schema_view(
    list=extend_schema(summary="List all social posts (newest first)"),
    retrieve=extend_schema(summary="Get a post by ID"),
    create=extend_schema(summary="Create a new social post"),
    update=extend_schema(summary="Replace your post"),
    partial_update=extend_schema(summary="Update some fields of your post"),
    destroy=extend_schema(summary="Delete your post"),
)
@extend_schema(tags=["posts"])
class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by("-created_at")
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        if self.action == "comments" and self.request.method == "GET":
            return [AllowAny()]
        if self.action in ["destroy", "update", "partial_update"]:
            return [IsOwnerOrAdmin()]
        return [IsAuthenticated()]

    @extend_schema(request=None, summary="Toggle like on this post")
    @action(detail=True, methods=["post"], url_path="like")
    def like(self, request, pk=None):
        post = self.get_object()
        like, created = PostLike.objects.get_or_create(user=request.user, post=post)
        if not created:
            like.delete()
            return Response({"liked": False, "likes_count": post.likes.count()})
        return Response({"liked": True, "likes_count": post.likes.count()}, status=status.HTTP_201_CREATED)

    @extend_schema(request=None, summary="Share this post")
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

    @extend_schema(
        methods=["GET"],
        responses={200: CommentSerializer(many=True)},
        summary="List comments on this post",
    )
    @extend_schema(
        methods=["POST"],
        request=CommentSerializer,
        responses={201: CommentSerializer},
        summary="Add a comment to this post",
    )
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

@extend_schema_view(
    list=extend_schema(summary="List all film courses"),
    retrieve=extend_schema(summary="Get a course by ID"),
    create=extend_schema(summary="Create a new course (admin only)"),
    update=extend_schema(summary="Replace a course (admin only)"),
    partial_update=extend_schema(summary="Update some fields of a course (admin only)"),
    destroy=extend_schema(summary="Delete a course (admin only)"),
)
@extend_schema(tags=["courses"])
class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAdminOrReadOnly]

    @extend_schema(request=None, summary="Enroll the current user in this course")
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def enroll(self, request, pk=None):
        course = self.get_object()
        if request.user in course.users.all():
            return Response({"detail": "Already enrolled."}, status=400)
        course.users.add(request.user)
        return Response({"detail": f"Enrolled in '{course.title}'."})

    @extend_schema(request=None, summary="Unenroll the current user from this course")
    @action(detail=True, methods=["post"], url_path="unenroll", permission_classes=[IsAuthenticated])
    def unenroll(self, request, pk=None):
        course = self.get_object()
        course.users.remove(request.user)
        return Response({"detail": f"Unenrolled from '{course.title}'."})


@extend_schema_view(
    list=extend_schema(summary="List all reviews"),
    retrieve=extend_schema(summary="Get a review by ID"),
    create=extend_schema(summary="Write a new review"),
    update=extend_schema(summary="Replace your review"),
    partial_update=extend_schema(summary="Update some fields of your review"),
    destroy=extend_schema(summary="Delete your review"),
)
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

@extend_schema_view(
    list=extend_schema(summary="List all available badges"),
    retrieve=extend_schema(summary="Get a badge by ID"),
)
@extend_schema(tags=["badges & rewards"])
class BadgeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer
    permission_classes = [IsAuthenticated]


@extend_schema_view(
    list=extend_schema(summary="List all available rewards"),
    retrieve=extend_schema(summary="Get a reward by ID"),
)
@extend_schema(tags=["badges & rewards"])
class RewardViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Reward.objects.all()
    serializer_class = RewardSerializer
    permission_classes = [IsAuthenticated]

    @extend_schema(request=None, summary="Redeem this reward using your points")
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

@extend_schema_view(
    list=extend_schema(summary="List your personalised movie recommendations"),
    retrieve=extend_schema(summary="Get a single recommendation by ID"),
)
@extend_schema(tags=["recommendations"])
class RecommendationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RecommendationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Recommendation.objects.none()
        return Recommendation.objects.filter(user=self.request.user).select_related("movie")


# ---------- Admin: Reports ----------

@extend_schema_view(
    list=extend_schema(summary="List all reports (admin only)"),
    retrieve=extend_schema(summary="Get a report by ID (admin only)"),
    create=extend_schema(summary="Submit a new report (admin only)"),
    update=extend_schema(summary="Replace a report (admin only)"),
    partial_update=extend_schema(summary="Update some fields of a report (admin only)"),
    destroy=extend_schema(summary="Delete a report (admin only)"),
)
@extend_schema(tags=["admin"])
class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsAdmin]

    def perform_create(self, serializer):
        from .models import Admin as AdminModel
        admin = get_object_or_404(AdminModel, id=self.request.user.id)
        serializer.save(admin=admin)

    @extend_schema(
        request=inline_serializer(
            "ReportReviewRequest",
            fields={
                "status": drf_serializers.CharField(required=False, help_text="e.g. reviewed, dismissed"),
                "reason": drf_serializers.CharField(required=False),
            },
        ),
        responses={200: ReportSerializer},
        summary="Mark a report as reviewed (admin)",
    )
    @action(detail=True, methods=["post"], url_path="review")
    def review(self, request, pk=None):
        report = self.get_object()
        report.status = request.data.get("status", Report.STATUS_REVIEWED)
        if "reason" in request.data:
            report.reason = request.data["reason"]
        report.save(update_fields=["status", "reason"])
        return Response(ReportSerializer(report).data)


# ---------- Admin: User management ----------

@extend_schema_view(
    list=extend_schema(summary="List all users with admin filters (admin only)"),
    retrieve=extend_schema(summary="Get any user by ID (admin only)"),
    create=extend_schema(summary="Create a new user as admin"),
    update=extend_schema(summary="Replace user info (admin only)"),
    partial_update=extend_schema(summary="Update some user fields (admin only)"),
    destroy=extend_schema(summary="Delete a user (admin only)"),
)
@extend_schema(tags=["admin"])
class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    @extend_schema(request=None, responses={200: UserSerializer}, summary="Ban this user (admin only)")
    @action(detail=True, methods=["post"], url_path="ban")
    def ban(self, request, pk=None):
        user = self.get_object()
        user.is_banned = True
        user.save(update_fields=["is_banned"])
        return Response(UserSerializer(user).data)

    @extend_schema(request=None, responses={200: UserSerializer}, summary="Unban this user (admin only)")
    @action(detail=True, methods=["post"], url_path="unban")
    def unban(self, request, pk=None):
        user = self.get_object()
        user.is_banned = False
        user.save(update_fields=["is_banned"])
        return Response(UserSerializer(user).data)

    @extend_schema(
        summary="Platform statistics dashboard (admin only)",
        description="Returns counts of users, movies, showtimes, bookings, tickets, posts, open reports, and paid payments.",
        responses={200: inline_serializer("AdminStatistics", fields={
            "users": drf_serializers.IntegerField(),
            "movies": drf_serializers.IntegerField(),
            "showtimes": drf_serializers.IntegerField(),
            "bookings": drf_serializers.IntegerField(),
            "tickets": drf_serializers.IntegerField(),
            "posts": drf_serializers.IntegerField(),
            "reports_open": drf_serializers.IntegerField(),
            "payments_paid": drf_serializers.IntegerField(),
        })},
    )
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


@extend_schema_view(
    list=extend_schema(summary="List your purchase history"),
    retrieve=extend_schema(summary="Get a single purchase by ID"),
)
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


@extend_schema_view(
    list=extend_schema(summary="List payments"),
    retrieve=extend_schema(summary="Get a payment by ID"),
    create=extend_schema(summary="Record a new payment"),
    update=extend_schema(summary="Replace a payment record"),
    partial_update=extend_schema(summary="Update some fields of a payment"),
    destroy=extend_schema(summary="Delete a payment"),
)
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
    @extend_schema(
        request=PaymentProcessSerializer,
        responses={200: PurchaseSerializer},
        summary="Mock payment processing for a booking",
    )
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


def chatbot_movie_queryset(answer, mood):
    lowered = answer.lower()
    qs = Movie.objects.prefetch_related("showtimes").all()

    matching_title_ids = [
        movie.id
        for movie in Movie.objects.only("id", "title")
        if movie.title.lower() in lowered
    ]
    if matching_title_ids:
        return Movie.objects.filter(id__in=matching_title_ids)

    if any(word in lowered for word in ["highest", "grossing", "box office", "egyptian films"]):
        return (
            qs.filter(box_office_gross_egp__isnull=False)
            .order_by("-box_office_gross_egp", "-rating")
        )

    if any(word in lowered for word in ["now playing", "cinema", "cinemas", "ticket", "tickets"]):
        qs = qs.filter(is_in_cinemas=True)

    if any(word in lowered for word in ["arabic", "egyptian", "egypt", "عربي", "مصري"]):
        qs = qs.filter(Q(language__iexact="Arabic") | Q(country__iexact="Egypt"))
    elif "english" in lowered:
        qs = qs.filter(language__iexact="English")
    elif "korean" in lowered:
        qs = qs.filter(language__iexact="Korean")
    elif "french" in lowered:
        qs = qs.filter(language__iexact="French")

    for city in ["cairo", "giza", "alexandria"]:
        if city in lowered:
            qs = qs.filter(showtimes__city__iexact=city)
            break

    if any(word in lowered for word in ["sci-fi", "sci fi", "science fiction", "space"]):
        qs = qs.filter(genre__icontains="Sci-Fi")
    elif any(word in lowered for word in ["horror", "scary", "scared"]):
        qs = qs.filter(genre__icontains="Horror")
    elif any(word in lowered for word in ["romance", "romantic"]):
        qs = qs.filter(genre__icontains="Romance")
    elif any(word in lowered for word in ["animation", "kids", "family"]):
        qs = qs.filter(Q(genre__icontains="Animation") | Q(genre__icontains="Comedy"))
    elif mood == "happy":
        qs = qs.filter(Q(genre__icontains="Comedy") | Q(genre__icontains="Animation"))
    elif mood == "emotional":
        qs = qs.filter(Q(genre__icontains="Drama") | Q(genre__icontains="Romance"))
    elif mood == "thriller":
        qs = qs.filter(Q(genre__icontains="Thriller") | Q(genre__icontains="Horror"))
    elif mood == "action":
        qs = qs.filter(Q(genre__icontains="Action") | Q(genre__icontains="Sci-Fi"))

    qs = qs.distinct().order_by("-is_now_playing", "-is_in_cinemas", "-rating", "title")
    if not qs.exists():
        qs = Movie.objects.order_by("-rating", "title")
    return qs


def chatbot_recommendation_message(movies):
    selected = list(movies[:5])
    if not selected:
        return "I could not find matching movies yet, but the catalog is ready for more seed data."
    titles = ", ".join(movie.title for movie in selected)
    return f"I found these from the CEEMA catalog: {titles}."


@extend_schema_view(
    list=extend_schema(summary="List your chatbot sessions"),
    retrieve=extend_schema(summary="Get a chatbot session by ID"),
    create=extend_schema(summary="Start a new chatbot session"),
    update=extend_schema(summary="Replace a chatbot session"),
    partial_update=extend_schema(summary="Update some fields of a chatbot session"),
    destroy=extend_schema(summary="End/delete a chatbot session"),
)
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

    @extend_schema(request=None, responses={200: ChatbotSerializer}, summary="Bot asks user a mood question")
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

    @extend_schema(
        request=ChatbotAnswerSerializer,
        responses={200: ChatbotSerializer},
        summary="Send the user's answer to the chatbot",
        description="Detects mood from the answer and returns updated chatbot state with movie recommendations.",
    )
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
        recommendations = chatbot_movie_queryset(answer, mood)
        ChatMessage.objects.create(
            chatbot=chatbot,
            content=f"Detected mood: {mood}. {chatbot_recommendation_message(recommendations)}",
            sender=ChatMessage.SENDER_BOT,
        )
        return Response(ChatbotSerializer(chatbot).data)

    @extend_schema(
        parameters=[OpenApiParameter("q", OpenApiTypes.STR, description="User's mood or query text")],
        responses={200: MovieSerializer(many=True)},
        summary="Get movie recommendations based on mood",
    )
    @action(detail=True, methods=["get"], url_path="recommend-movies")
    def recommend_movies(self, request, pk=None):
        chatbot = self.get_object()
        answer = request.query_params.get("q", "")
        qs = chatbot_movie_queryset(answer, chatbot.current_mood)
        return Response(MovieSerializer(qs[:10], many=True).data)
