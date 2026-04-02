from django.contrib.auth.hashers import make_password, check_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Badge, Booking, Comment, Course, Movie, Post, PostLike,
    Profile, Recommendation, Report, Review, Reward, Seat,
    Showtime, Ticket, User, Admin, PaymentTransaction,
)


# ---------- Auth ----------

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["id", "name", "email", "password", "role"]
        extra_kwargs = {"role": {"read_only": True}}

    def create(self, validated_data):
        validated_data["password"] = make_password(validated_data["password"])
        return super().create(validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        try:
            user = User.objects.get(email=data["email"])
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password.")
        if not check_password(data["password"], user.password):
            raise serializers.ValidationError("Invalid email or password.")
        data["user"] = user
        return data


# ---------- User & Profile ----------

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["id", "bio", "followers_count"]


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "name", "email", "points", "role", "profile"]
        extra_kwargs = {"password": {"write_only": True}}


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["name", "email"]


# ---------- Movie ----------

class MovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movie
        fields = ["id", "title", "description", "duration", "genre", "rating"]


# ---------- Review ----------

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "user", "user_name", "movie", "rating", "comment", "course"]
        extra_kwargs = {
            "user": {"read_only": True},
            "movie": {"read_only": True},
        }


# ---------- Showtime & Seat ----------

class SeatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seat
        fields = ["id", "seat_number", "status"]


class ShowtimeSerializer(serializers.ModelSerializer):
    movie_title = serializers.CharField(source="movie.title", read_only=True)

    class Meta:
        model = Showtime
        fields = ["id", "movie", "movie_title", "date", "time"]


# ---------- Booking & Ticket ----------

class TicketSerializer(serializers.ModelSerializer):
    seat_number = serializers.CharField(source="seat.seat_number", read_only=True)

    class Meta:
        model = Ticket
        fields = ["id", "booking", "showtime", "seat", "seat_number", "ticket_code", "qr_code"]
        extra_kwargs = {"booking": {"read_only": True}}


class BookingSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True)
    tickets = TicketSerializer(many=True, read_only=True)

    class Meta:
        model = Booking
        fields = ["id", "user", "user_name", "showtime", "booking_date", "total_price", "status", "tickets"]
        extra_kwargs = {"user": {"read_only": True}}


class BookingCreateSerializer(serializers.Serializer):
    showtime_id = serializers.IntegerField()
    seat_ids = serializers.ListField(child=serializers.IntegerField(), min_length=1)
    price_per_seat = serializers.DecimalField(max_digits=6, decimal_places=2, default=50)

    def validate_showtime_id(self, value):
        if not Showtime.objects.filter(id=value).exists():
            raise serializers.ValidationError("Showtime not found.")
        return value

    def validate(self, data):
        seats = Seat.objects.filter(id__in=data["seat_ids"], showtime_id=data["showtime_id"])
        if seats.count() != len(data["seat_ids"]):
            raise serializers.ValidationError("One or more seats are invalid for this showtime.")
        unavailable = seats.exclude(status="available")
        if unavailable.exists():
            raise serializers.ValidationError("One or more seats are not available.")
        data["seats"] = seats
        return data


# ---------- Post & Comment ----------

class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "user", "user_name", "post", "content", "created_at"]
        extra_kwargs = {"user": {"read_only": True}, "post": {"read_only": True}}


class PostSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True)
    likes_count = serializers.IntegerField(source="likes.count", read_only=True)
    comments_count = serializers.IntegerField(source="comments.count", read_only=True)

    class Meta:
        model = Post
        fields = ["id", "user", "user_name", "content", "created_at", "likes_count", "comments_count"]
        extra_kwargs = {"user": {"read_only": True}}


# ---------- Course ----------

class CourseSerializer(serializers.ModelSerializer):
    enrolled_count = serializers.IntegerField(source="users.count", read_only=True)

    class Meta:
        model = Course
        fields = ["id", "title", "description", "enrolled_count"]


# ---------- Badge & Reward ----------

class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ["id", "name", "description"]


class RewardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reward
        fields = ["id", "name", "points_required"]


# ---------- Recommendation ----------

class RecommendationSerializer(serializers.ModelSerializer):
    movie = MovieSerializer(read_only=True)

    class Meta:
        model = Recommendation
        fields = ["id", "movie", "type"]


# ---------- Report ----------

class ReportSerializer(serializers.ModelSerializer):
    admin_name = serializers.CharField(source="admin.name", read_only=True)

    class Meta:
        model = Report
        fields = ["id", "admin", "admin_name", "generated_at"]
        extra_kwargs = {"admin": {"read_only": True}}


# ---------- Payment ----------

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = ["id", "booking", "provider", "amount", "status", "external_reference", "created_at"]
