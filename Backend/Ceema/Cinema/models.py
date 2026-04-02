from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


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
    points = models.PositiveIntegerField(default=0)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_USER)

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


class Course(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    users = models.ManyToManyField(User, related_name="courses", blank=True)

    def __str__(self):
        return self.title


class Movie(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    duration = models.PositiveIntegerField(help_text="Duration in minutes")
    genre = models.CharField(max_length=100)
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

    def __str__(self):
        return f"{self.movie.title} on {self.date} at {self.time}"


class Seat(models.Model):
    showtime = models.ForeignKey(Showtime, on_delete=models.CASCADE, related_name="seats")
    seat_number = models.CharField(max_length=20)
    status = models.CharField(max_length=20, default="available")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["showtime", "seat_number"], name="unique_seat_per_showtime"
            )
        ]

    def __str__(self):
        return f"{self.seat_number} for {self.showtime}"


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
    booking = models.OneToOneField(
        Booking, on_delete=models.CASCADE, related_name="payment"
    )
    provider = models.CharField(max_length=100, default="payment-system")
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(max_length=20, default="pending")
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
    admin = models.ForeignKey(Admin, on_delete=models.CASCADE, related_name="reports")
    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report #{self.pk} by {self.admin.name}"
