from django.contrib.auth.hashers import make_password, check_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Badge, Booking, Chatbot, ChatMessage, Comment, Course, Follow,
    Movie, PaymentTransaction, Post, PostLike, Profile, Purchase,
    Recommendation, Report, Review, Reward, Seat, Showtime, Ticket,
    User, Admin,
)


# ---------- Auth ----------

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "password",
            "age",
            "preferred_genres",
            "mood_preference",
            "role",
        ]
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
        fields = ["id", "bio", "avatar_url", "portfolio", "followers_count"]


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    following_count = serializers.IntegerField(source="following_links.count", read_only=True)
    followers_count = serializers.IntegerField(source="follower_links.count", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "age",
            "preferred_genres",
            "mood_preference",
            "points",
            "role",
            "is_banned",
            "created_at",
            "profile",
            "followers_count",
            "following_count",
        ]
        extra_kwargs = {"password": {"write_only": True}}


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["name", "email", "age", "preferred_genres", "mood_preference"]


class FollowSerializer(serializers.ModelSerializer):
    follower_name = serializers.CharField(source="follower.name", read_only=True)
    following_name = serializers.CharField(source="following.name", read_only=True)

    class Meta:
        model = Follow
        fields = [
            "id",
            "follower",
            "follower_name",
            "following",
            "following_name",
            "created_at",
        ]
        extra_kwargs = {"follower": {"read_only": True}}


# ---------- Movie ----------

class MovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movie
        fields = ["id", "title", "description", "duration", "genre", "image_url", "rating"]


# ---------- Review ----------

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "user",
            "user_name",
            "movie",
            "rating",
            "comment",
            "course",
            "created_at",
        ]
        extra_kwargs = {
            "user": {"read_only": True},
            "movie": {"read_only": True},
        }


# ---------- Showtime & Seat ----------

class SeatSerializer(serializers.ModelSerializer):
    is_available = serializers.BooleanField(read_only=True)

    class Meta:
        model = Seat
        fields = ["id", "seat_number", "status", "row", "column", "is_available"]


class ShowtimeSerializer(serializers.ModelSerializer):
    movie_title = serializers.CharField(source="movie.title", read_only=True)

    class Meta:
        model = Showtime
        fields = ["id", "movie", "movie_title", "date", "time", "hall"]


# ---------- Booking & Ticket ----------

class TicketSerializer(serializers.ModelSerializer):
    seat_number = serializers.CharField(source="seat.seat_number", read_only=True)
    booking_date = serializers.DateTimeField(source="booking.booking_date", read_only=True)
    total_price = serializers.DecimalField(
        source="booking.total_price", max_digits=8, decimal_places=2, read_only=True
    )
    status = serializers.CharField(source="booking.status", read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id",
            "booking",
            "showtime",
            "seat",
            "seat_number",
            "booking_date",
            "total_price",
            "status",
            "ticket_code",
            "qr_code",
        ]
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
    original_post_content = serializers.CharField(
        source="original_post.content", read_only=True
    )

    class Meta:
        model = Post
        fields = [
            "id",
            "user",
            "user_name",
            "content",
            "original_post",
            "original_post_content",
            "created_at",
            "likes_count",
            "comments_count",
        ]
        extra_kwargs = {"user": {"read_only": True}}


# ---------- Course ----------

class CourseSerializer(serializers.ModelSerializer):
    enrolled_count = serializers.IntegerField(source="users.count", read_only=True)

    class Meta:
        model = Course
        fields = ["id", "title", "description", "url", "enrolled_count"]


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
        fields = [
            "id",
            "admin",
            "admin_name",
            "reason",
            "status",
            "content_type",
            "content_id",
            "created_at",
            "generated_at",
        ]
        extra_kwargs = {"admin": {"read_only": True}}


# ---------- Payment ----------

class PurchaseSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True)

    class Meta:
        model = Purchase
        fields = [
            "id",
            "user",
            "user_name",
            "booking",
            "purchase_date",
            "total_amount",
            "payment_status",
            "points_earned",
        ]
        extra_kwargs = {"user": {"read_only": True}}


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = [
            "id",
            "booking",
            "purchase",
            "provider",
            "method",
            "amount",
            "status",
            "external_reference",
            "created_at",
        ]


class PaymentProcessSerializer(serializers.Serializer):
    booking_id = serializers.IntegerField()
    provider = serializers.CharField(default="mock")
    method = serializers.CharField(default="mock-card")
    mark_paid = serializers.BooleanField(default=True)

    def validate_booking_id(self, value):
        if not Booking.objects.filter(id=value).exists():
            raise serializers.ValidationError("Booking not found.")
        return value


# ---------- Chatbot ----------

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ["id", "chatbot", "content", "timestamp", "sender"]
        extra_kwargs = {"chatbot": {"read_only": True}}


class ChatbotSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = Chatbot
        fields = [
            "id",
            "user",
            "current_mood",
            "last_question",
            "created_at",
            "updated_at",
            "messages",
        ]
        extra_kwargs = {"user": {"read_only": True}}


class ChatbotAnswerSerializer(serializers.Serializer):
    answer = serializers.CharField()
