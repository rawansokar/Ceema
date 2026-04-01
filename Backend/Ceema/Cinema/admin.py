from django.contrib import admin

from .models import (
    Admin,
    Badge,
    Booking,
    Comment,
    Course,
    Movie,
    PaymentTransaction,
    Post,
    PostLike,
    Profile,
    Recommendation,
    Report,
    Review,
    Reward,
    Seat,
    Showtime,
    Ticket,
    User,
)

admin.site.register(User)
admin.site.register(Admin)
admin.site.register(Profile)
admin.site.register(Badge)
admin.site.register(Reward)
admin.site.register(Course)
admin.site.register(Movie)
admin.site.register(Review)
admin.site.register(Post)
admin.site.register(Comment)
admin.site.register(PostLike)
admin.site.register(Showtime)
admin.site.register(Seat)
admin.site.register(Booking)
admin.site.register(Ticket)
admin.site.register(PaymentTransaction)
admin.site.register(Recommendation)
admin.site.register(Report)
