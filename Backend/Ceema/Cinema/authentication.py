from drf_spectacular.extensions import OpenApiAuthenticationExtension
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken

from .models import User


class CinemaJWTAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = "Cinema.authentication.CinemaJWTAuthentication"
    name = "BearerAuth"

    def get_security_definition(self, auto_schema):
        return {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }


class CinemaJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that resolves tokens to our Cinema.User model
    instead of Django's built-in auth.User.
    """

    def get_user(self, validated_token):
        try:
            user_id = validated_token["user_id"]
        except KeyError:
            raise InvalidToken("Token contained no recognizable user identification")

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            raise InvalidToken("No user found for this token")

        return user
