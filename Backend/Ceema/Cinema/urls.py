from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

router = DefaultRouter()
router.register(r"users", views.UserViewSet, basename="user")
router.register(r"movies", views.MovieViewSet, basename="movie")
router.register(r"showtimes", views.ShowtimeViewSet, basename="showtime")
router.register(r"seats", views.SeatViewSet, basename="seat")
router.register(r"bookings", views.BookingViewSet, basename="booking")
router.register(r"tickets", views.TicketViewSet, basename="ticket")
router.register(r"posts", views.PostViewSet, basename="post")
router.register(r"reviews", views.ReviewViewSet, basename="review")
router.register(r"courses", views.CourseViewSet, basename="course")
router.register(r"badges", views.BadgeViewSet, basename="badge")
router.register(r"rewards", views.RewardViewSet, basename="reward")
router.register(r"recommendations", views.RecommendationViewSet, basename="recommendation")
router.register(r"purchases", views.PurchaseViewSet, basename="purchase")
router.register(r"payments", views.PaymentViewSet, basename="payment")
router.register(r"chatbot", views.ChatbotViewSet, basename="chatbot")
router.register(r"admin/reports", views.ReportViewSet, basename="report")
router.register(r"admin/users", views.AdminUserViewSet, basename="admin-user")

urlpatterns = [
    # Auth
    path("auth/register/", views.RegisterView.as_view(), name="auth-register"),
    path("auth/login/", views.LoginView.as_view(), name="auth-login"),
    path("auth/logout/", views.LogoutView.as_view(), name="auth-logout"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),

    # All resource routes
    path("", include(router.urls)),
]
