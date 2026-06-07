from calendar import monthrange
from datetime import date, datetime, time, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from Cinema.models import Movie, Seat, Showtime


CINEMA_SCHEDULE = [
    {
        "cinema_name": "CEEMA Downtown",
        "city": "Cairo",
        "hall": "Hall A",
        "ticket_price": "80.00",
        "times": [time(17, 0), time(20, 0)],
    },
    {
        "cinema_name": "CEEMA Mall of Egypt",
        "city": "Giza",
        "hall": "IMAX",
        "ticket_price": "120.00",
        "times": [time(18, 30), time(21, 30)],
    },
    {
        "cinema_name": "CEEMA New Cairo",
        "city": "Cairo",
        "hall": "Hall D",
        "ticket_price": "95.00",
        "times": [time(19, 0), time(22, 0)],
    },
    {
        "cinema_name": "CEEMA Corniche",
        "city": "Alexandria",
        "hall": "Hall C",
        "ticket_price": "75.00",
        "times": [time(18, 0), time(21, 0)],
    },
]


def parse_date(value):
    if not value:
        return None
    return datetime.strptime(value, "%Y-%m-%d").date()


def end_of_month(day):
    return date(day.year, day.month, monthrange(day.year, day.month)[1])


def ensure_showtime_seats(showtime):
    existing = set(
        Seat.objects.filter(showtime=showtime).values_list("seat_number", flat=True)
    )
    seats = []
    for row in range(1, 9):
        row_letter = chr(64 + row)
        for column in range(1, 11):
            seat_number = f"{row_letter}{column}"
            if seat_number in existing:
                continue
            seats.append(
                Seat(
                    showtime=showtime,
                    seat_number=seat_number,
                    status=Seat.STATUS_AVAILABLE,
                    row=row,
                    column=column,
                )
            )
    if seats:
        Seat.objects.bulk_create(seats, ignore_conflicts=True)
    return len(seats)


class Command(BaseCommand):
    help = "Create future CEEMA demo showtimes through the end of a month and ensure seats exist."

    def add_arguments(self, parser):
        parser.add_argument(
            "--start-date",
            help="First showtime date in YYYY-MM-DD. Defaults to tomorrow.",
        )
        parser.add_argument(
            "--end-date",
            help="Last showtime date in YYYY-MM-DD. Defaults to the end of the start date's month.",
        )
        parser.add_argument(
            "--include-all-in-cinemas",
            action="store_true",
            help="Use all is_in_cinemas movies. Default uses is_now_playing movies first.",
        )
        parser.add_argument(
            "--days",
            type=int,
            default=None,
            help="Optional number of days to generate from start-date. Overrides end-date.",
        )

    def handle(self, *args, **options):
        today = timezone.localdate()
        start_date = parse_date(options["start_date"]) or (today + timedelta(days=1))
        if options["days"]:
            end_date = start_date + timedelta(days=options["days"] - 1)
        else:
            end_date = parse_date(options["end_date"]) or end_of_month(start_date)

        if end_date < start_date:
            raise SystemExit("end-date must be on or after start-date")

        movie_qs = Movie.objects.filter(is_now_playing=True).order_by("id")
        if options["include_all_in_cinemas"] or not movie_qs.exists():
            movie_qs = Movie.objects.filter(is_in_cinemas=True).order_by("id")
        movies = list(movie_qs)

        if not movies:
            self.stdout.write(self.style.WARNING("No cinema movies found. Nothing created."))
            return

        created_showtimes = 0
        skipped_showtimes = 0
        created_seats = 0
        current_date = start_date

        with transaction.atomic():
            day_index = 0
            while current_date <= end_date:
                for movie_index, movie in enumerate(movies):
                    cinema = CINEMA_SCHEDULE[(movie_index + day_index) % len(CINEMA_SCHEDULE)]
                    show_time = cinema["times"][(movie_index + day_index) % len(cinema["times"])]
                    exists = Showtime.objects.filter(
                        movie=movie,
                        date=current_date,
                        time=show_time,
                        cinema_name=cinema["cinema_name"],
                        hall=cinema["hall"],
                    ).exists()
                    if exists:
                        skipped_showtimes += 1
                        continue

                    showtime = Showtime.objects.create(
                        movie=movie,
                        date=current_date,
                        time=show_time,
                        hall=cinema["hall"],
                        city=cinema["city"],
                        cinema_name=cinema["cinema_name"],
                        ticket_price=cinema["ticket_price"],
                    )
                    created_showtimes += 1
                    created_seats += ensure_showtime_seats(showtime)

                current_date += timedelta(days=1)
                day_index += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Future showtimes ready from {start_date} to {end_date}. "
                f"Created {created_showtimes}, skipped {skipped_showtimes}, "
                f"created {created_seats} seats."
            )
        )
