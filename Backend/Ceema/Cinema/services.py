import json
import smtplib
import base64
from email.message import EmailMessage
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings


def send_email(to_email, subject, html):
    if settings.EMAIL_PROVIDER == "gmail_api":
        return send_gmail_api_email(to_email, subject, html)
    if settings.EMAIL_PROVIDER == "smtp":
        return send_smtp_email(to_email, subject, html)
    return send_resend_email(to_email, subject, html)


def send_resend_email(to_email, subject, html):
    if not settings.RESEND_API_KEY:
        return {"skipped": True, "reason": "RESEND_API_KEY is not configured."}

    payload = {
        "from": settings.RESEND_FROM_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html,
    }
    if settings.RESEND_REPLY_TO:
        payload["reply_to"] = settings.RESEND_REPLY_TO

    request = Request(
        "https://api.resend.com/emails",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=10) as response:
            body = response.read().decode("utf-8")
            return json.loads(body) if body else {"sent": True}
    except HTTPError as exc:
        body = exc.read().decode("utf-8")
        return {"sent": False, "status": exc.code, "error": body}
    except URLError as exc:
        return {"sent": False, "error": str(exc.reason)}


def send_smtp_email(to_email, subject, html):
    missing = [
        name
        for name, value in {
            "SMTP_HOST": settings.SMTP_HOST,
            "SMTP_USERNAME": settings.SMTP_USERNAME,
            "SMTP_PASSWORD": settings.SMTP_PASSWORD,
            "SMTP_FROM_EMAIL": settings.SMTP_FROM_EMAIL,
        }.items()
        if not value
    ]
    if missing:
        return {"skipped": True, "reason": f"Missing SMTP settings: {', '.join(missing)}"}

    message = EmailMessage()
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content("This email requires an HTML-capable email client.")
    message.add_alternative(html, subtype="html")

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as smtp:
            if settings.SMTP_USE_TLS:
                smtp.starttls()
            smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            smtp.send_message(message)
        return {"sent": True, "provider": "smtp"}
    except smtplib.SMTPException as exc:
        return {"sent": False, "provider": "smtp", "error": str(exc)}
    except OSError as exc:
        return {"sent": False, "provider": "smtp", "error": str(exc)}


def send_gmail_api_email(to_email, subject, html):
    missing = [
        name
        for name, value in {
            "GMAIL_CLIENT_ID": settings.GMAIL_CLIENT_ID,
            "GMAIL_CLIENT_SECRET": settings.GMAIL_CLIENT_SECRET,
            "GMAIL_REFRESH_TOKEN": settings.GMAIL_REFRESH_TOKEN,
            "GMAIL_SENDER_EMAIL": settings.GMAIL_SENDER_EMAIL,
        }.items()
        if not value
    ]
    if missing:
        return {"skipped": True, "reason": f"Missing Gmail API settings: {', '.join(missing)}"}

    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request as GoogleAuthRequest
        from googleapiclient.discovery import build
    except ImportError as exc:
        return {"sent": False, "provider": "gmail_api", "error": str(exc)}

    credentials = Credentials(
        token=None,
        refresh_token=settings.GMAIL_REFRESH_TOKEN,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GMAIL_CLIENT_ID,
        client_secret=settings.GMAIL_CLIENT_SECRET,
        scopes=["https://www.googleapis.com/auth/gmail.send"],
    )

    try:
        credentials.refresh(GoogleAuthRequest())

        message = EmailMessage()
        message["From"] = f"{settings.GMAIL_FROM_NAME} <{settings.GMAIL_SENDER_EMAIL}>"
        message["To"] = to_email
        message["Subject"] = subject
        message.set_content("This email requires an HTML-capable email client.")
        message.add_alternative(html, subtype="html")

        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
        service = build("gmail", "v1", credentials=credentials, cache_discovery=False)
        result = service.users().messages().send(
            userId="me",
            body={"raw": raw_message},
        ).execute()
        return {"sent": True, "provider": "gmail_api", "id": result.get("id")}
    except Exception as exc:
        return {"sent": False, "provider": "gmail_api", "error": str(exc)}


def email_layout(title, body_html):
    return f"""
    <!doctype html>
    <html>
      <body style="margin:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#18202a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:28px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #dfe5ec;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="background:#111827;color:#ffffff;padding:20px 24px;">
                    <div style="font-size:22px;font-weight:700;letter-spacing:0;">CEEMA</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 24px;">
                    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#111827;">{title}</h1>
                    <div style="font-size:15px;line-height:1.7;color:#374151;">{body_html}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 24px;background:#f9fafb;color:#6b7280;font-size:12px;">
                    You are receiving this email because you used CEEMA.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """


def send_welcome_email(user):
    return send_email(
        user.email,
        "Welcome to CEEMA",
        email_layout(
            f"Welcome to CEEMA, {user.name}",
            """
            <p style="margin:0 0 14px;">Your account is ready.</p>
            <p style="margin:0;">You can now browse movies, reserve seats, receive tickets, and collect points.</p>
            """,
        ),
    )


def send_booking_confirmation_email(booking):
    tickets = "".join(
        f"<li>{ticket.seat.seat_number} - {ticket.ticket_code}</li>"
        for ticket in booking.tickets.select_related("seat")
    )
    showtime = booking.showtime
    return send_email(
        booking.user.email,
        f"CEEMA booking confirmation #{booking.id}",
        email_layout(
            "Booking confirmed",
            f"""
            <p style="margin:0 0 14px;">Hi {booking.user.name}, your booking for <strong>{showtime.movie.title}</strong> is confirmed.</p>
            <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:18px 0;">
              <tr><td style="padding:8px 0;color:#6b7280;">Date</td><td style="padding:8px 0;text-align:right;">{showtime.date}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;">Time</td><td style="padding:8px 0;text-align:right;">{showtime.time}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;">Hall</td><td style="padding:8px 0;text-align:right;">{showtime.hall or "TBA"}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;">Total</td><td style="padding:8px 0;text-align:right;">{booking.total_price}</td></tr>
            </table>
            <h2 style="font-size:18px;margin:18px 0 8px;color:#111827;">Tickets</h2>
            <ul style="margin:0;padding-left:20px;">{tickets}</ul>
            """,
        ),
    )
