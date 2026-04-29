from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


class User(models.Model):
    ROLE_USER = "user"
    ROLE_ADMIN = "admin"
    ROLE_CHOICES = [
        (ROLE_USER, "User"),
        (ROLE_ADMIN, "Admin"),
    ]

    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=100)
    age = models.PositiveIntegerField(null=True, blank=True)
    preferred_genres = models.JSONField(default=list, blank=True)
    mood_preference = models.CharField(max_length=100, blank=True)
    points = models.PositiveIntegerField(default=0)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_USER)
    is_banned = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now, editable=False)

    # Required by DRF permission classes
    is_authenticated = True
    is_anonymous = False

    def __str__(self):
        return self.name


class Admin(User):
    class Meta:
        verbose_name = "Admin"
        verbose_name_plural = "Admins"

    def save(self, *args, **kwargs):
        self.role = self.ROLE_ADMIN
        super().save(*args, **kwargs)

    def manage_movies(self):
        return Movie.objects.all()

    def manage_users(self):
        return User.objects.all()

    def generate_reports(self):
        return self.reports.all()

    def moderate_content(self):
        return Post.objects.all(), Comment.objects.all()


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    bio = models.TextField(blank=True)
    avatar_url = models.URLField(blank=True)
    portfolio = models.JSONField(default=list, blank=True)
    followers_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.user.name}'s profile"


class Badge(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    users = models.ManyToManyField(User, related_name="badges", blank=True)

    def __str__(self):
        return self.name


class Reward(models.Model):
    name = models.CharField(max_length=100)
    points_required = models.PositiveIntegerField()
    users = models.ManyToManyField(User, related_name="rewards", blank=True)

    def __str__(self):
        return self.name


class Follow(models.Model):
    follower = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="following_links"
    )
    following = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="follower_links"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["follower", "following"], name="unique_user_follow"
            ),
            models.CheckConstraint(
                condition=~models.Q(follower=models.F("following")),
                name="prevent_self_follow",
            ),
        ]

    def save(self, *args, **kwargs):
        if self.follower_id and self.following_id and self.follower_id == self.following_id:
            raise ValidationError("Users cannot follow themselves.")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.follower.name} follows {self.following.name}"


class Course(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    url = models.URLField(blank=True)
    users = models.ManyToManyField(User, related_name="courses", blank=True)

    def __str__(self):
        return self.title


class Movie(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    duration = models.PositiveIntegerField(help_text="Duration in minutes")
    genre = models.CharField(max_length=100)
    image_url = models.URLField(blank=True)
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        default=0,
    )

    def __str__(self):
        return self.title


class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews")
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField()
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    course = models.ForeignKey(
        Course,
        on_delete=models.SET_NULL,
        related_name="reviews",
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"{self.user.name} review for {self.movie.title}"


class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    content = models.TextField()
    original_post = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        related_name="shares",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Post #{self.pk} by {self.user.name}"


class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment #{self.pk} by {self.user.name}"


class PostLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="post_likes")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "post"], name="unique_post_like")
        ]

    def __str__(self):
        return f"{self.user.name} likes post #{self.post_id}"


class Showtime(models.Model):
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name="showtimes")
    date = models.DateField()
    time = models.TimeField()
    hall = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.movie.title} on {self.date} at {self.time}"


class Seat(models.Model):
    STATUS_AVAILABLE = "available"
    STATUS_RESERVED = "reserved"
    STATUS_BOOKED = "booked"
    STATUS_CHOICES = [
        (STATUS_AVAILABLE, "Available"),
        (STATUS_RESERVED, "Reserved"),
        (STATUS_BOOKED, "Booked"),
    ]

    showtime = models.ForeignKey(Showtime, on_delete=models.CASCADE, related_name="seats")
    seat_number = models.CharField(max_length=20)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_AVAILABLE
    )
    row = models.PositiveIntegerField(null=True, blank=True)
    column = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["showtime", "seat_number"], name="unique_seat_per_showtime"
            )
        ]

    def __str__(self):
        return f"{self.seat_number} for {self.showtime}"

    @property
    def is_available(self):
        return self.status == self.STATUS_AVAILABLE

    def reserve(self):
        if not self.is_available:
            raise ValidationError("Seat is not available.")
        self.status = self.STATUS_RESERVED
        self.save(update_fields=["status"])

    def release(self):
        self.status = self.STATUS_AVAILABLE
        self.save(update_fields=["status"])


class Booking(models.Model):
    STATUS_PENDING = "pending"
    STATUS_CONFIRMED = "confirmed"
    STATUS_CANCELLED = "cancelled"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_CONFIRMED, "Confirmed"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bookings")
    showtime = models.ForeignKey(
        Showtime, on_delete=models.CASCADE, related_name="bookings"
    )
    booking_date = models.DateTimeField(auto_now_add=True)
    total_price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING
    )

    def __str__(self):
        return f"Booking #{self.pk} for {self.user.name}"

    def award_points(self, points=10):
        if self.status != self.STATUS_CONFIRMED:
            return
        self.user.points += points
        self.user.save(update_fields=["points"])


class Purchase(models.Model):
    PAYMENT_NEW = "new"
    PAYMENT_COMPLETE = "complete"
    PAYMENT_REFUNDED = "refunded"
    PAYMENT_FAILED = "failed"
    PAYMENT_STATUS_CHOICES = [
        (PAYMENT_NEW, "New"),
        (PAYMENT_COMPLETE, "Complete"),
        (PAYMENT_REFUNDED, "Refunded"),
        (PAYMENT_FAILED, "Failed"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="purchases")
    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name="purchase",
        null=True,
        blank=True,
    )
    purchase_date = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=8, decimal_places=2)
    payment_status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS_CHOICES, default=PAYMENT_NEW
    )
    points_earned = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"Purchase #{self.pk} for {self.user.name}"

    def calculate_points(self):
        self.points_earned = int(Decimal(str(self.total_amount)) // Decimal("10"))
        return self.points_earned


class Ticket(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="tickets")
    showtime = models.ForeignKey(
        Showtime, on_delete=models.CASCADE, related_name="tickets"
    )
    seat = models.ForeignKey(Seat, on_delete=models.CASCADE, related_name="tickets")
    ticket_code = models.CharField(max_length=100, unique=True)
    qr_code = models.CharField(max_length=255)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["showtime", "seat"], name="unique_ticket_seat_per_showtime"
            )
        ]

    def clean(self):
        if self.seat_id and self.showtime_id and self.seat.showtime_id != self.showtime_id:
            raise ValidationError("Ticket seat must belong to the selected showtime.")
        if (
            self.booking_id
            and self.showtime_id
            and self.booking.showtime_id != self.showtime_id
        ):
            raise ValidationError("Ticket showtime must match the booking showtime.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.ticket_code


class PaymentTransaction(models.Model):
    STATUS_PENDING = "pending"
    STATUS_PAID = "paid"
    STATUS_FAILED = "failed"
    STATUS_REFUNDED = "refunded"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_PAID, "Paid"),
        (STATUS_FAILED, "Failed"),
        (STATUS_REFUNDED, "Refunded"),
    ]

    booking = models.OneToOneField(
        Booking, on_delete=models.CASCADE, related_name="payment"
    )
    purchase = models.OneToOneField(
        Purchase,
        on_delete=models.CASCADE,
        related_name="payment",
        null=True,
        blank=True,
    )
    provider = models.CharField(max_length=100, default="payment-system")
    method = models.CharField(max_length=100, blank=True)
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    external_reference = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment for booking #{self.booking_id}"


class Recommendation(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="recommendations"
    )
    movie = models.ForeignKey(
        Movie, on_delete=models.CASCADE, related_name="recommendations"
    )
    type = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.type} recommendation for {self.user.name}"


class Report(models.Model):
    STATUS_OPEN = "open"
    STATUS_REVIEWED = "reviewed"
    STATUS_RESOLVED = "resolved"
    STATUS_DISMISSED = "dismissed"
    STATUS_CHOICES = [
        (STATUS_OPEN, "Open"),
        (STATUS_REVIEWED, "Reviewed"),
        (STATUS_RESOLVED, "Resolved"),
        (STATUS_DISMISSED, "Dismissed"),
    ]

    admin = models.ForeignKey(Admin, on_delete=models.CASCADE, related_name="reports")
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_OPEN)
    content_type = models.CharField(max_length=50, blank=True)
    content_id = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report #{self.pk} by {self.admin.name}"


class Chatbot(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="chatbot_sessions",
        null=True,
        blank=True,
    )
    current_mood = models.CharField(max_length=100, blank=True)
    last_question = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def ask_mood_question(self):
        self.last_question = "What kind of movie mood are you in today?"
        self.save(update_fields=["last_question", "updated_at"])
        return self.last_question

    def receive_answer(self, answer):
        lowered = answer.lower()
        if any(word in lowered for word in ["happy", "fun", "laugh", "comedy"]):
            self.current_mood = "happy"
        elif any(word in lowered for word in ["sad", "drama", "emotional"]):
            self.current_mood = "emotional"
        elif any(word in lowered for word in ["scared", "horror", "thriller"]):
            self.current_mood = "thriller"
        elif any(word in lowered for word in ["action", "excited", "fast"]):
            self.current_mood = "action"
        else:
            self.current_mood = "general"
        self.save(update_fields=["current_mood", "updated_at"])
        return self.current_mood

    def __str__(self):
        owner = self.user.name if self.user_id else "Guest"
        return f"Chatbot session for {owner}"


class ChatMessage(models.Model):
    SENDER_GUEST = "guest"
    SENDER_USER = "user"
    SENDER_BOT = "bot"
    SENDER_CHOICES = [
        (SENDER_GUEST, "Guest"),
        (SENDER_USER, "User"),
        (SENDER_BOT, "Bot"),
    ]

    chatbot = models.ForeignKey(
        Chatbot, on_delete=models.CASCADE, related_name="messages"
    )
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    sender = models.CharField(max_length=20, choices=SENDER_CHOICES)

    def __str__(self):
        return f"{self.sender} message #{self.pk}"
