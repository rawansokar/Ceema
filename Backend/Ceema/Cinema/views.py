from django.http import JsonResponse


def index(request):
    return JsonResponse(
        {
            "app": "CEEMA",
            "status": "ok",
            "message": "Cinema backend is running.",
            "implemented_domains": [
                "users",
                "profiles",
                "movies",
                "showtimes",
                "bookings",
                "tickets",
                "courses",
                "posts",
                "comments",
                "reviews",
                "recommendations",
                "reports",
            ],
        }
    )
