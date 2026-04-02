# CEEMA API Design — 2026-04-02

## Overview
Full REST API for the CEEMA cinema platform built with Django REST Framework, JWT authentication, and Swagger docs.

## Stack
- Django REST Framework (DRF) — viewsets, serializers, routers
- djangorestframework-simplejwt — JWT access + refresh tokens
- drf-spectacular — Swagger UI at /api/docs/

## File Structure
```
Cinema/
  serializers.py   — all model serializers
  views.py         — all viewsets
  urls.py          — all routes
  permissions.py   — IsAdmin custom permission
  fixtures/
    sample_data.json
```

## Authentication Endpoints
| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| POST | /api/auth/register/ | Create account | Public |
| POST | /api/auth/login/ | Get JWT tokens | Public |
| POST | /api/auth/refresh/ | Refresh access token | Public |
| POST | /api/auth/logout/ | Blacklist refresh token | Authenticated |

## Resource Endpoints
| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| GET/POST | /api/movies/ | List/create movies | GET=Public, POST=Admin |
| GET/PUT/PATCH/DELETE | /api/movies/{id}/ | Movie detail | GET=Public, rest=Admin |
| GET | /api/movies/search/ | Search by title/genre | Public |
| GET/POST | /api/movies/{id}/reviews/ | Movie reviews | GET=Public, POST=Auth |
| GET/POST | /api/showtimes/ | List/create showtimes | GET=Public, POST=Admin |
| GET | /api/showtimes/{id}/seats/ | Available seats | Public |
| GET/POST | /api/bookings/ | My bookings / create | Authenticated |
| GET/PATCH | /api/bookings/{id}/ | Detail / cancel | Authenticated (owner) |
| GET | /api/bookings/{id}/tickets/ | Booking tickets | Authenticated (owner) |
| GET/POST | /api/posts/ | Social posts | Authenticated |
| POST | /api/posts/{id}/like/ | Toggle like | Authenticated |
| GET/POST | /api/posts/{id}/comments/ | Post comments | Authenticated |
| GET/POST | /api/courses/ | Courses list/create | GET=Auth, POST=Admin |
| POST | /api/courses/{id}/enroll/ | Enroll in course | Authenticated |
| GET | /api/users/{id}/profile/ | View profile | Authenticated |
| PUT/PATCH | /api/users/{id}/profile/ | Edit own profile | Authenticated (owner) |
| GET | /api/recommendations/ | My recommendations | Authenticated |
| GET | /api/badges/ | All badges | Authenticated |
| GET | /api/rewards/ | All rewards | Authenticated |

## Admin Endpoints
| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/users/ | List all users |
| GET/POST | /api/admin/reports/ | Reports |
| PATCH | /api/admin/users/{id}/ | Ban/unban user |

## Permissions
- Public: register, login, movie list/detail, showtime list, seat list
- Authenticated (JWT): everything else
- Admin role: create/edit/delete movies, showtimes, courses; user list; reports

## Sample Data (fixture)
- 2 admins, 5 regular users
- 3 movies with showtimes and seats
- bookings, tickets
- posts, comments, likes
- reviews, recommendations
- badges, rewards, courses
