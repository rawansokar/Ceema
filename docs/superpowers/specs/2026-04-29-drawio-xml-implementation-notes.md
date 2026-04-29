# CEEMA draw.io XML implementation notes

This note tracks the backend work added from `/Users/kareemgamal/Downloads/CD..xml`.

## Implemented from the XML

- User profile data: age, preferred genres, mood preference, avatar URL, portfolio, created timestamp, banned flag.
- Follow graph: users can follow/unfollow users and list followers/following.
- Movies: image URL.
- Showtimes: hall.
- Seats: row, column, availability flag, reserve/release actions.
- Posts: share/repost through `original_post`.
- Reviews: direct review management plus nested movie reviews.
- Courses: external URL.
- Reports: reason, status, content target, review action.
- Admin controls: ban/unban users and platform statistics.
- Tickets: standalone read-only ticket API.
- Purchases: internal purchase history model linked to bookings.
- Payments: mock process endpoint that stores provider, method, status, and external reference.
- Chatbot: mock session/messages, mood question, answer intake, and simple movie recommendation endpoint.

## Mock integration contracts

The following APIs are intentionally usable without third-party services:

- `POST /api/payments/mock-process/`
  - Accepts `booking_id`, `provider`, `method`, `mark_paid`.
  - Creates or updates `Purchase` and `PaymentTransaction`.
  - Later Paymob integration should preserve this response shape and replace the mock processor behind the endpoint.

- `POST /api/chatbot/{id}/ask-mood-question/`
- `POST /api/chatbot/{id}/receive-answer/`
- `GET /api/chatbot/{id}/recommend-movies/`
  - Stores the conversation and returns deterministic demo recommendations.
  - Later AI/NLP integration can replace `Chatbot.receive_answer()` and recommendation filtering.

## Suggested next integration boundaries

- Payment provider adapter: create a service module around payment intent creation, callback validation, and refund handling.
- Webhook endpoint: add a provider webhook route before real payment launch.
- Recommendation engine: keep chatbot messages in the database, but move mood detection and recommendations into a service function.
- Media storage: if movie/profile images become uploads, use cloud object storage instead of URL-only fields.
