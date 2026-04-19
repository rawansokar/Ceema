# CEEMA — Complete Project Documentation

> **Who this document is for:** Business students, project managers, and anyone who is comfortable with a computer but has limited coding experience. This guide will help you understand what CEEMA does, get it running on your machine, explore the API, and make small edits to the code — no computer science degree required.

---

## Table of Contents

1. [What is CEEMA?](#1-what-is-ceema)
2. [System Architecture — How It All Fits Together](#2-system-architecture--how-it-all-fits-together)
3. [Quick Start: Running the Project](#3-quick-start-running-the-project)
   - [Mac Instructions](#31-mac-instructions)
   - [Windows Instructions](#32-windows-instructions)
   - [Loading Sample Data](#33-loading-sample-data)
   - [Starting the Server on Subsequent Days](#34-starting-the-server-on-subsequent-days)
4. [Project File Map](#4-project-file-map)
5. [Understanding the Data (Models)](#5-understanding-the-data-models)
6. [The APIs — Every Endpoint Explained](#6-the-apis--every-endpoint-explained)
   - [Authentication Endpoints](#61-authentication-endpoints)
   - [Movie Endpoints](#62-movie-endpoints)
   - [Showtime and Seat Endpoints](#63-showtime-and-seat-endpoints)
   - [Booking Endpoints](#64-booking-endpoints)
   - [Social Endpoints (Posts, Comments, Likes)](#65-social-endpoints-posts-comments-likes)
   - [Course Endpoints](#66-course-endpoints)
   - [Badges and Rewards Endpoints](#67-badges-and-rewards-endpoints)
   - [Recommendations Endpoints](#68-recommendations-endpoints)
   - [User Profile Endpoints](#69-user-profile-endpoints)
   - [Admin Endpoints](#610-admin-endpoints)
7. [Using Swagger UI](#7-using-swagger-ui)
8. [Authentication: How JWT Works](#8-authentication-how-jwt-works)
9. [Sample Data](#9-sample-data)
10. [Common Edits — The "How Do I...?" Cookbook](#10-common-edits--the-how-do-i-cookbook)
11. [The Django Admin Panel](#11-the-django-admin-panel)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. What is CEEMA?

CEEMA is a **cinema booking platform with social features**. Think of it as the back-end engine that could power a cinema app like Fandango or Vue Cinema — but with a social media layer built in (think posts, likes, comments, and reviews).

The project exposes a **REST API**: a set of web addresses (called endpoints) that a front-end app (website or mobile app) can call to get or send data. All of the data and business logic lives in this Django backend.

### What Regular Users Can Do

| Feature | Description |
|---|---|
| Register and log in | Create an account, get a login token |
| Browse movies | See all available movies, search by title or genre |
| Browse showtimes | See when movies are playing |
| Check seat availability | See which seats are available for a showtime |
| Book seats | Reserve one or more seats and receive tickets automatically |
| Cancel bookings | Cancel a confirmed booking and free up the seats |
| View tickets | See the tickets (with a ticket code) attached to a booking |
| Write reviews | Leave a star rating and comment for a movie |
| Make social posts | Post short messages for others to see |
| Like and comment | Like others' posts and leave comments |
| Earn points | Points are awarded automatically on each confirmed booking |
| Earn badges | Badges are awarded for milestones (e.g., "First Booking") |
| Redeem rewards | Trade points for rewards like free popcorn or a free ticket |
| Enroll in courses | Join cinema-education courses (e.g., "History of Cinema") |
| Get recommendations | See personalized movie suggestions |
| Edit profile | Update your bio and profile details |

### What Admins Can Do (Everything Users Can + More)

| Feature | Description |
|---|---|
| Create / edit / delete movies | Manage the movie catalog |
| Create / edit / delete showtimes | Manage screening schedules |
| Manage seats | Add seats to showtimes |
| Manage courses | Create and update educational courses |
| View all users | See a list of every registered user |
| Manage any user | Edit or delete any user account |
| Generate reports | Create platform activity reports |
| Moderate content | Read all posts and comments |

### What This Project Is NOT (Yet)

- There is no front-end website included — this is just the API (the back-end engine)
- There is no real payment processing — payments are tracked but not connected to Stripe or similar
- There is no email system — registration does not send a confirmation email

---

## 2. System Architecture — How It All Fits Together

### 2.1 The Big Picture

```mermaid
graph TD
    Client["Client (Browser / Mobile App / Swagger UI)"]
    API["Django REST Framework API<br/>Running on localhost:8000"]
    Auth["JWT Authentication<br/>CinemaJWTAuthentication"]
    DB["PostgreSQL Database<br/>(or SQLite for dev)"]
    Admin["Django Admin Panel<br/>/admin/"]
    Swagger["Swagger UI<br/>/api/docs/"]

    Client -->|"HTTP Request + Bearer Token"| API
    Client -->|"Interactive API testing"| Swagger
    Swagger --> API
    API --> Auth
    Auth -->|"Validates token, loads User"| API
    API -->|"Read / Write"| DB
    Admin -->|"Direct DB access via browser"| DB
```

### 2.2 How a Request Flows Through the System

When someone (or an app) makes a request to CEEMA — for example, booking a seat — here is exactly what happens step by step:

```mermaid
sequenceDiagram
    participant User as User / App
    participant Django as Django API
    participant Auth as JWT Auth
    participant Perm as Permissions
    participant DB as Database

    User->>Django: POST /api/bookings/ with token in header
    Django->>Auth: Validate the Bearer token
    Auth->>DB: Look up user_id from token
    DB-->>Auth: User object (e.g., Sara)
    Auth-->>Django: "Authenticated as Sara"
    Django->>Perm: Check: IsAuthenticated?
    Perm-->>Django: Yes, allow
    Django->>DB: Create Booking, mark seats as booked, create Tickets
    DB-->>Django: Saved records
    Django-->>User: 201 Created — booking + tickets in JSON
```

### 2.3 Data Model Relationships

This diagram shows how all 17 database models relate to each other. Think of it as an entity-relationship diagram, but in plain English.

```mermaid
erDiagram
    USER {
        int id
        string name
        string email
        string password
        int points
        string role
    }
    ADMIN {
        int id
    }
    PROFILE {
        int id
        text bio
        int followers_count
    }
    MOVIE {
        int id
        string title
        text description
        int duration
        string genre
        decimal rating
    }
    SHOWTIME {
        int id
        date date
        time time
    }
    SEAT {
        int id
        string seat_number
        string status
    }
    BOOKING {
        int id
        datetime booking_date
        decimal total_price
        string status
    }
    TICKET {
        int id
        string ticket_code
        string qr_code
    }
    REVIEW {
        int id
        int rating
        text comment
    }
    POST {
        int id
        text content
        datetime created_at
    }
    COMMENT {
        int id
        text content
        datetime created_at
    }
    POSTLIKE {
        int id
        datetime created_at
    }
    BADGE {
        int id
        string name
        text description
    }
    REWARD {
        int id
        string name
        int points_required
    }
    COURSE {
        int id
        string title
        text description
    }
    RECOMMENDATION {
        int id
        string type
    }
    REPORT {
        int id
        datetime generated_at
    }
    PAYMENTTRANSACTION {
        int id
        string provider
        decimal amount
        string status
    }

    USER ||--o{ BOOKING : "makes"
    USER ||--|| PROFILE : "has"
    USER ||--o{ REVIEW : "writes"
    USER ||--o{ POST : "creates"
    USER ||--o{ COMMENT : "writes"
    USER ||--o{ POSTLIKE : "creates"
    USER ||--o{ RECOMMENDATION : "receives"
    USER }o--o{ BADGE : "earns"
    USER }o--o{ REWARD : "redeems"
    USER }o--o{ COURSE : "enrolls in"
    ADMIN ||--o{ REPORT : "generates"
    ADMIN ||--|| USER : "extends"
    MOVIE ||--o{ SHOWTIME : "has"
    MOVIE ||--o{ REVIEW : "receives"
    MOVIE ||--o{ RECOMMENDATION : "appears in"
    SHOWTIME ||--o{ SEAT : "has"
    SHOWTIME ||--o{ BOOKING : "for"
    BOOKING ||--o{ TICKET : "generates"
    BOOKING ||--o| PAYMENTTRANSACTION : "has"
    SEAT ||--o{ TICKET : "for"
    POST ||--o{ COMMENT : "has"
    POST ||--o{ POSTLIKE : "has"
    REVIEW }o--o| COURSE : "linked to"
```

### 2.4 The Three-Layer Architecture

The code is organized into three clear layers. Every feature passes through all three:

```mermaid
graph LR
    subgraph "Layer 1: URL Routing"
        direction TB
        U1["Ceema/urls.py<br/>Top-level router"]
        U2["Cinema/urls.py<br/>All /api/ routes"]
    end
    subgraph "Layer 2: Business Logic"
        direction TB
        V1["Cinema/views.py<br/>ViewSets — what happens"]
        P1["Cinema/permissions.py<br/>Who is allowed"]
    end
    subgraph "Layer 3: Data"
        direction TB
        S1["Cinema/serializers.py<br/>Shape of JSON in/out"]
        M1["Cinema/models.py<br/>Database tables"]
    end

    U1 --> U2 --> V1
    V1 --> P1
    V1 --> S1
    S1 --> M1
```

---

## 3. Quick Start: Running the Project

Before you start, make sure you have installed:

1. **Python 3.10 or newer** — the programming language the project is written in
2. **PostgreSQL** — the database that stores all the data

### What is PostgreSQL?

PostgreSQL (often called "Postgres") is a free, open-source database system — think of it as a very powerful spreadsheet program that runs in the background and stores all the project's data (users, movies, bookings, etc.) in an organized way. The project can also fall back to SQLite (a simpler built-in database) if you do not set up Postgres, but Postgres is recommended for full functionality.

- **Mac download:** Install via Homebrew (see Mac instructions below) or from [https://www.postgresql.org/download/macosx/](https://www.postgresql.org/download/macosx/)
- **Windows download:** [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)

### What is a Virtual Environment?

A virtual environment is like a clean, isolated box on your computer where Python packages are installed just for this project — so they don't interfere with anything else on your machine. When you "activate" the virtual environment, your terminal will know to use only the packages inside that box.

---

### 3.1 Mac Instructions

**Step 1: Install Homebrew (if you don't have it)**

Homebrew is a package manager for Mac — it lets you install software easily from the terminal.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Step 2: Install Python and PostgreSQL**

```bash
brew install python postgresql@16
brew services start postgresql@16
```

**Step 3: Open Terminal and navigate to the project folder**

```bash
cd /Users/YourName/Downloads/omar/Ceema/Backend/Ceema
```

> **Note:** Replace `/Users/YourName/Downloads/omar/Ceema` with the actual path where you downloaded the project.

**Step 4: Run the setup script**

The setup script will create the virtual environment, install all dependencies, set up the database, and run the database migrations automatically.

```bash
chmod +x setup.sh
./setup.sh
```

You will be asked for a few things. Here are the recommended answers for a local development setup:

```
Database name   [ceema_db]:       (just press Enter to accept the default)
Database user   [ceema_user]:     (just press Enter to accept the default)
Database password:                (type a password — e.g. ceema1234 — and press Enter)
Database host   [localhost]:      (just press Enter)
Database port   [5432]:           (just press Enter)
```

> **Note:** The script automatically creates the database and user in Postgres for you. You do not need to set up Postgres manually.

**Step 5: Start the server**

The setup script runs the server at the end. For subsequent runs, use these commands:

```bash
cd /Users/YourName/Downloads/omar/Ceema/Backend/Ceema
source venv/bin/activate
export $(cat .env | xargs)
python manage.py runserver
```

**Step 6: Open your browser**

Visit [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/) to see the Swagger UI with all the API endpoints.

---

### 3.2 Windows Instructions

**Step 1: Install Python**

Download from [https://www.python.org/downloads/](https://www.python.org/downloads/) and run the installer. During installation, **check the box that says "Add Python to PATH"** — this is important.

**Step 2: Install PostgreSQL**

Download from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/) and run the installer. During installation:
- Choose a password for the "postgres" superuser — remember this password, you will need it in Step 4
- Keep the default port (5432)

**Step 3: Open PowerShell as a regular user (not Administrator)**

Press `Windows + X` and click "Windows PowerShell" (not the Administrator version).

**Step 4: Navigate to the project folder**

```powershell
cd C:\Users\YourName\Downloads\omar\Ceema\Backend\Ceema
```

> **Note:** Replace `YourName` with your actual Windows username.

**Step 5: Allow PowerShell to run scripts (one-time only)**

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Type `Y` and press Enter when prompted.

**Step 6: Run the setup script**

```powershell
.\setup.ps1
```

The script will ask for your PostgreSQL superuser password (the one you created in Step 2). It will then:
- Automatically find your PostgreSQL installation
- Create the `ceema_db` database and `ceema_user` database user
- Create a virtual environment and install all Python packages
- Run database migrations
- Start the server

> **Note:** The default database credentials the Windows script uses are:
> - Database name: `ceema_db`
> - Database user: `ceema_user`
> - Database password: `ceema1234`
>
> You can customize these by passing parameters: `.\setup.ps1 -DBName mydb -DBPass mypassword`

**Step 7: Open your browser**

Visit [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/) to see the Swagger UI.

---

### 3.3 Loading Sample Data

After the server is running, you can load 66 pre-made records (users, movies, bookings, posts, reviews, etc.) so you have something to work with immediately.

**Mac/Linux:**

```bash
# Make sure venv is active and env vars are loaded
source venv/bin/activate
export $(cat .env | xargs)
python manage.py loaddata Cinema/fixtures/sample_data.json
```

**Windows (PowerShell):**

```powershell
Get-Content .env | ForEach-Object { $k,$v = $_ -split '=',2; $env:$k = $v }
venv\Scripts\activate
python manage.py loaddata Cinema/fixtures/sample_data.json
```

You should see output like:

```
Installed 66 object(s) from 1 fixture(s)
```

All sample users have the password `ceema123`. See [Section 9](#9-sample-data) for the full list of users.

---

### 3.4 Starting the Server on Subsequent Days

Once setup is done, you only need to run a few commands each time you want to start the project.

**Mac:**

```bash
cd /path/to/Ceema/Backend/Ceema
source venv/bin/activate
export $(cat .env | xargs)
python manage.py runserver
```

**Windows (PowerShell):**

```powershell
cd C:\path\to\Ceema\Backend\Ceema
Get-Content .env | ForEach-Object { $k,$v = $_ -split '=',2; $env:$k = $v }
venv\Scripts\activate
python manage.py runserver
```

Or on Windows, you can use the shortcut script:

```powershell
.\run.ps1
```

The server will print something like:

```
Starting development server at http://127.0.0.1:8000/
```

Leave this terminal window open while you work. Press `Ctrl + C` to stop the server.

---

## 4. Project File Map

Here is a complete map of every important file and folder in the project, with a plain-English explanation of what each one does.

```
Ceema/                                  ← Root of the entire project
│
├── DOCUMENTATION.md                    ← This file you are reading
├── .gitignore                          ← Tells Git which files to ignore
│
├── docs/                               ← Design documents and specifications
│   └── superpowers/specs/
│       └── 2026-04-02-ceema-api-design.md  ← Original API design spec
│
└── Backend/
    └── Ceema/                          ← The actual Django project folder
        │
        ├── manage.py                   ← Django's command-line tool (run migrations, start server, etc.)
        ├── requirements.txt            ← List of Python packages this project needs
        ├── setup.sh                    ← Automated setup script for Mac/Linux
        ├── setup.ps1                   ← Automated setup script for Windows
        ├── run.ps1                     ← Shortcut to start the server on Windows
        ├── .env                        ← Your database credentials (created by setup script — do not share!)
        ├── db.sqlite3                  ← SQLite database file (only used if PostgreSQL is not configured)
        │
        ├── static/                     ← Folder for CSS/JS/image files (currently empty)
        │
        ├── Ceema/                      ← Django project configuration package
        │   ├── __init__.py             ← Marks this folder as a Python package (don't edit)
        │   ├── settings.py             ← ALL project settings: database, JWT, Swagger, installed apps
        │   ├── urls.py                 ← Top-level URL routing (connects /api/ and /admin/ to their handlers)
        │   ├── asgi.py                 ← For async server deployments (not needed for development)
        │   └── wsgi.py                 ← For production server deployments (not needed for development)
        │
        └── Cinema/                     ← The main application package — all business logic lives here
            ├── __init__.py             ← Marks this as a Python package (don't edit)
            ├── admin.py                ← Registers all models with Django's /admin/ panel
            ├── apps.py                 ← App configuration (don't edit)
            ├── models.py               ← ALL 17 database models — the heart of the data layer
            ├── serializers.py          ← Converts Python objects to JSON and back; validates input
            ├── views.py                ← API logic — what happens when each endpoint is called
            ├── urls.py                 ← Maps URL paths to the right view (within the /api/ prefix)
            ├── permissions.py          ← Controls who can call which endpoints (IsAdmin, IsOwnerOrAdmin, etc.)
            ├── authentication.py       ← Custom JWT token reader that works with our custom User model
            ├── tests.py                ← Automated tests (currently placeholder)
            │
            ├── migrations/             ← Database migration files (auto-generated, do not edit manually)
            │   ├── __init__.py
            │   └── 0001_initial.py     ← The one migration that creates all the database tables
            │
            └── fixtures/
                └── sample_data.json    ← 66 pre-made records for testing and demonstration
```

### Key Files at a Glance

| If you want to... | Go to this file |
|---|---|
| Add or change a database field | `Cinema/models.py` |
| Change what data the API returns | `Cinema/serializers.py` |
| Add a new API endpoint or change what an endpoint does | `Cinema/views.py` |
| Add a new URL / route | `Cinema/urls.py` |
| Change who can access an endpoint | `Cinema/permissions.py` |
| Change JWT token expiry time | `Ceema/settings.py` (the `SIMPLE_JWT` section) |
| Change database connection settings | `Ceema/settings.py` or the `.env` file |
| Add a model to the Django admin panel | `Cinema/admin.py` |

---

## 5. Understanding the Data (Models)

A "model" in Django is a Python class that maps to a database table. Each model has fields (like columns in a spreadsheet). All 17 models live in one file: [`Backend/Ceema/Cinema/models.py`](Backend/Ceema/Cinema/models.py).

### Model 1: User

**What it stores:** Every person who registers on the platform — both regular users and admins.

**Where to edit it:** [`Cinema/models.py` lines 6–25](Backend/Ceema/Cinema/models.py#L6)

| Field | Type | Description |
|---|---|---|
| `id` | Auto integer | Unique identifier, assigned automatically |
| `name` | Text (max 100 chars) | The person's display name |
| `email` | Email (unique) | Used to log in — must be unique across all users |
| `password` | Text | Stored as a hashed (scrambled) value — never stored in plain text |
| `points` | Positive integer | Loyalty points earned through bookings, starts at 0 |
| `role` | Choice: `user` or `admin` | Determines what the person can do |

**Example:** A user record looks like:
```json
{
  "id": 3,
  "name": "Sara User",
  "email": "sara@ceema.com",
  "points": 30,
  "role": "user"
}
```

> **Note:** The password is never shown in API responses — only stored (hashed) in the database.

---

### Model 2: Admin

**What it stores:** A special type of User with admin powers. Technically, Admin "extends" User in the database — every Admin is also a User row with `role = "admin"`.

**Where to edit it:** [`Cinema/models.py` lines 28–47](Backend/Ceema/Cinema/models.py#L28)

**Example:** When you load the sample data, Alice and Bob are admins. They have a row in the `User` table with `role = "admin"` and also a row in the `Admin` table pointing to the same `id`.

> **Note:** You do not create admins through the registration API. To promote someone to admin, you would need to update their `role` field directly in the database or through the Django admin panel.

---

### Model 3: Profile

**What it stores:** Extended personal information about a user, separate from login credentials.

**Where to edit it:** [`Cinema/models.py` lines 50–56](Backend/Ceema/Cinema/models.py#L50)

| Field | Type | Description |
|---|---|---|
| `user` | Link to User | One-to-one: each User has exactly one Profile |
| `bio` | Long text | Free-text biography the user can write about themselves |
| `followers_count` | Positive integer | How many followers this user has |

**Example:**
```json
{
  "id": 3,
  "bio": "Movie lover and critic.",
  "followers_count": 12
}
```

---

### Model 4: Movie

**What it stores:** All information about a film in the catalog.

**Where to edit it:** [`Cinema/models.py` lines 86–99](Backend/Ceema/Cinema/models.py#L86)

| Field | Type | Description |
|---|---|---|
| `id` | Auto integer | Unique movie identifier |
| `title` | Text (max 200 chars) | Movie title, e.g. "Interstellar" |
| `description` | Long text | Plot summary |
| `duration` | Positive integer | Length in minutes, e.g. 169 |
| `genre` | Text (max 100 chars) | Genre tag, e.g. "Sci-Fi", "Action", "Thriller" |
| `rating` | Decimal (0.0 – 10.0) | Platform rating with 1 decimal place, e.g. 9.0 |

**Example:**
```json
{
  "id": 1,
  "title": "Interstellar",
  "description": "A team of explorers travel through a wormhole...",
  "duration": 169,
  "genre": "Sci-Fi",
  "rating": "9.0"
}
```

---

### Model 5: Showtime

**What it stores:** A specific screening of a movie — when and where (date + time).

**Where to edit it:** [`Cinema/models.py` lines 154–160](Backend/Ceema/Cinema/models.py#L154)

| Field | Type | Description |
|---|---|---|
| `id` | Auto integer | Unique showtime identifier |
| `movie` | Link to Movie | Which film is being shown |
| `date` | Date | The date of the screening, e.g. "2026-04-10" |
| `time` | Time | The time it starts, e.g. "18:00:00" |

**Example:**
```json
{
  "id": 1,
  "movie": 1,
  "movie_title": "Interstellar",
  "date": "2026-04-10",
  "time": "18:00:00"
}
```

---

### Model 6: Seat

**What it stores:** An individual seat for a particular showtime. Seats belong to a showtime, not to a cinema room — this keeps things simple.

**Where to edit it:** [`Cinema/models.py` lines 163–176](Backend/Ceema/Cinema/models.py#L163)

| Field | Type | Description |
|---|---|---|
| `id` | Auto integer | Unique seat identifier |
| `showtime` | Link to Showtime | Which screening this seat belongs to |
| `seat_number` | Text (max 20 chars) | Human-readable label, e.g. "A1", "B3" |
| `status` | Text | `"available"` or `"booked"` |

**Constraint:** Each seat number must be unique within a showtime (you can't have two "A1" seats in the same screening).

**Example:**
```json
{
  "id": 1,
  "seat_number": "A1",
  "status": "booked"
}
```

---

### Model 7: Booking

**What it stores:** A reservation made by a user for a showtime. A booking can cover multiple seats.

**Where to edit it:** [`Cinema/models.py` lines 179–206](Backend/Ceema/Cinema/models.py#L179)

| Field | Type | Description |
|---|---|---|
| `id` | Auto integer | Unique booking identifier |
| `user` | Link to User | Who made the booking |
| `showtime` | Link to Showtime | Which screening was booked |
| `booking_date` | DateTime | When the booking was made (set automatically) |
| `total_price` | Decimal | Total cost of all seats booked |
| `status` | Choice | `"pending"`, `"confirmed"`, or `"cancelled"` |

**Business logic:** When a booking is created through the API, it is immediately set to `"confirmed"`, seats are marked `"booked"`, tickets are generated, and loyalty points are awarded.

**Example:**
```json
{
  "id": 1,
  "user": 3,
  "user_name": "Sara User",
  "showtime": 1,
  "booking_date": "2026-04-01T10:00:00Z",
  "total_price": "50.00",
  "status": "confirmed"
}
```

---

### Model 8: Ticket

**What it stores:** An individual ticket for one seat within a booking. One booking can have multiple tickets (one per seat).

**Where to edit it:** [`Cinema/models.py` lines 209–240](Backend/Ceema/Cinema/models.py#L209)

| Field | Type | Description |
|---|---|---|
| `id` | Auto integer | Unique ticket identifier |
| `booking` | Link to Booking | The booking this ticket belongs to |
| `showtime` | Link to Showtime | Redundant but useful — which screening |
| `seat` | Link to Seat | Which seat this ticket is for |
| `ticket_code` | Text (unique) | A short unique code, e.g. "TCK-001-A1" |
| `qr_code` | Text | A text value representing a QR code, e.g. "QR-1-A1" |

**Constraint:** Only one ticket can exist per seat per showtime (you can't double-book a seat).

**Example:**
```json
{
  "id": 1,
  "booking": 1,
  "showtime": 1,
  "seat": 1,
  "seat_number": "A1",
  "ticket_code": "TCK-001-A1",
  "qr_code": "QR-1-A1"
}
```

---

### Model 9: Review

**What it stores:** A user's star rating and written comment for a specific movie.

**Where to edit it:** [`Cinema/models.py` lines 102–118](Backend/Ceema/Cinema/models.py#L102)

| Field | Type | Description |
|---|---|---|
| `id` | Auto integer | Unique review identifier |
| `user` | Link to User | Who wrote the review |
| `movie` | Link to Movie | Which movie was reviewed |
| `rating` | Integer (1–5) | Star rating — must be between 1 and 5 |
| `comment` | Long text | Written review text |
| `course` | Link to Course (optional) | Optionally link this review to a course |

**Example:**
```json
{
  "id": 1,
  "user": 3,
  "user_name": "Sara User",
  "movie": 1,
  "rating": 5,
  "comment": "Mind-blowing visuals and story. A masterpiece."
}
```

---

### Model 10: Post

**What it stores:** A social media post — a short message any authenticated user can write.

**Where to edit it:** [`Cinema/models.py` lines 121–127](Backend/Ceema/Cinema/models.py#L121)

| Field | Type | Description |
|---|---|---|
| `id` | Auto integer | Unique post identifier |
| `user` | Link to User | Who wrote the post |
| `content` | Long text | The post text |
| `created_at` | DateTime | When it was posted (set automatically) |

**Example:**
```json
{
  "id": 1,
  "user": 3,
  "user_name": "Sara User",
  "content": "Just watched Interstellar again — still gets me every time!",
  "created_at": "2026-04-01T12:00:00Z",
  "likes_count": 2,
  "comments_count": 2
}
```

---

### Model 11: Comment

**What it stores:** A reply to a Post.

**Where to edit it:** [`Cinema/models.py` lines 130–137](Backend/Ceema/Cinema/models.py#L130)

| Field | Type | Description |
|---|---|---|
| `id` | Auto integer | Unique comment identifier |
| `user` | Link to User | Who wrote the comment |
| `post` | Link to Post | Which post this is a comment on |
| `content` | Long text | The comment text |
| `created_at` | DateTime | When it was written (set automatically) |

---

### Model 12: PostLike

**What it stores:** A "like" on a post. Each user can only like a post once.

**Where to edit it:** [`Cinema/models.py` lines 140–151](Backend/Ceema/Cinema/models.py#L140)

| Field | Type | Description |
|---|---|---|
| `id` | Auto integer | Unique like identifier |
| `user` | Link to User | Who liked the post |
| `post` | Link to Post | Which post was liked |
| `created_at` | DateTime | When the like was created |

**Constraint:** A (user, post) pair must be unique — you cannot like the same post twice. If you call the like endpoint on a post you already liked, it automatically un-likes it (a toggle).

---

### Model 13: Badge

**What it stores:** An achievement badge that users can earn.

**Where to edit it:** [`Cinema/models.py` lines 59–65](Backend/Ceema/Cinema/models.py#L59)

| Field | Type | Description |
|---|---|---|
| `id` | Auto integer | Unique badge identifier |
| `name` | Text (max 100 chars) | Badge name, e.g. "First Booking" |
| `description` | Long text | What the user did to earn this badge |
| `users` | Many-to-many to User | All users who have earned this badge |

**Example badges in sample data:** "First Booking", "Cinephile", "Social Butterfly"

---

### Model 14: Reward

**What it stores:** A reward that users can redeem using loyalty points.

**Where to edit it:** [`Cinema/models.py` lines 68–74](Backend/Ceema/Cinema/models.py#L68)

| Field | Type | Description |
|---|---|---|
| `id` | Auto integer | Unique reward identifier |
| `name` | Text (max 100 chars) | Reward name, e.g. "Free Popcorn" |
| `points_required` | Positive integer | How many points needed to claim this reward |
| `users` | Many-to-many to User | Users who have claimed this reward |

**Example rewards in sample data:** "Free Popcorn" (20 points), "Free Ticket" (50 points), "VIP Lounge Access" (100 points)

---

### Model 15: Course

**What it stores:** An educational cinema course that users can enroll in.

**Where to edit it:** [`Cinema/models.py` lines 77–83](Backend/Ceema/Cinema/models.py#L77)

| Field | Type | Description |
|---|---|---|
| `id` | Auto integer | Unique course identifier |
| `title` | Text (max 200 chars) | Course title, e.g. "History of Cinema" |
| `description` | Long text | Course description |
| `users` | Many-to-many to User | All enrolled users |

---

### Model 16: Recommendation

**What it stores:** A movie recommendation for a specific user, with a type label explaining why it was recommended.

**Where to edit it:** [`Cinema/models.py` lines 257–267](Backend/Ceema/Cinema/models.py#L257)

| Field | Type | Description |
|---|---|---|
| `id` | Auto integer | Unique recommendation identifier |
| `user` | Link to User | Who this recommendation is for |
| `movie` | Link to Movie | The recommended movie |
| `type` | Text | Why it was recommended: `"based_on_genre"`, `"trending"`, `"top_rated"` |

---

### Model 17: PaymentTransaction

**What it stores:** A payment record associated with a booking.

**Where to edit it:** [`Cinema/models.py` lines 243–254](Backend/Ceema/Cinema/models.py#L243)

| Field | Type | Description |
|---|---|---|
| `id` | Auto integer | Unique transaction identifier |
| `booking` | One-to-one to Booking | Each booking has at most one payment record |
| `provider` | Text | Payment provider name, defaults to `"payment-system"` |
| `amount` | Decimal | Amount charged |
| `status` | Text | `"pending"`, `"completed"`, etc. |
| `external_reference` | Text (optional) | Reference ID from the payment provider |
| `created_at` | DateTime | When the transaction was created |

---

### Model 18: Report

**What it stores:** An admin-generated report entry.

**Where to edit it:** [`Cinema/models.py` lines 270–275](Backend/Ceema/Cinema/models.py#L270)

| Field | Type | Description |
|---|---|---|
| `id` | Auto integer | Unique report identifier |
| `admin` | Link to Admin | Which admin generated this report |
| `generated_at` | DateTime | When the report was created (set automatically) |

---

## 6. The APIs — Every Endpoint Explained

All API endpoints start with `http://localhost:8000/api/`. The URL routing is defined in:
- [`Backend/Ceema/Ceema/urls.py`](Backend/Ceema/Ceema/urls.py) — top level (connects `/api/` to Cinema)
- [`Backend/Ceema/Cinema/urls.py`](Backend/Ceema/Cinema/urls.py) — all `/api/` routes

### Access Level Key

| Symbol | Meaning |
|---|---|
| Public | Anyone can call this — no login required |
| Authenticated | Must be logged in (valid JWT token required) |
| Admin only | Must be logged in AND have `role = "admin"` |
| Owner or Admin | Must own the record, OR be an admin |

---

### 6.1 Authentication Endpoints

These endpoints let users create accounts, log in, and log out.

**Logic lives in:** [`Cinema/views.py` lines 40–99](Backend/Ceema/Cinema/views.py#L40)

---

#### POST `/api/auth/register/`

**What it does:** Creates a new user account. Automatically creates a Profile for the new user and returns JWT tokens so the user is logged in immediately.

**Access:** Public (anyone can register)

**Request body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "mypassword123"
}
```

**Successful response (201 Created):**
```json
{
  "user": {
    "id": 8,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "points": 0,
    "role": "user",
    "profile": {
      "id": 8,
      "bio": "",
      "followers_count": 0
    }
  },
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

> **Note:** The `access` token is what you use to authenticate subsequent requests. It expires after 1 hour. The `refresh` token lasts 7 days and can be used to get a new access token.

---

#### POST `/api/auth/login/`

**What it does:** Authenticates a user with their email and password, returns JWT tokens.

**Access:** Public

**Request body:**
```json
{
  "email": "sara@ceema.com",
  "password": "ceema123"
}
```

**Successful response (200 OK):**
```json
{
  "user": {
    "id": 3,
    "name": "Sara User",
    "email": "sara@ceema.com",
    "points": 30,
    "role": "user"
  },
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error response (400 Bad Request):**
```json
{
  "non_field_errors": ["Invalid email or password."]
}
```

---

#### POST `/api/auth/logout/`

**What it does:** Marks the user as logged out. Since JWT tokens are stateless, the server simply confirms — the client is responsible for discarding the token locally.

**Access:** Authenticated

**Request body:** (empty)

**Response (200 OK):**
```json
{
  "detail": "Logged out successfully."
}
```

---

#### POST `/api/auth/refresh/`

**What it does:** Uses a refresh token to get a new access token, without requiring the user to log in again.

**Access:** Public (just needs a valid refresh token)

**Request body:**
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 6.2 Movie Endpoints

**Logic lives in:** [`Cinema/views.py` lines 137–167](Backend/Ceema/Cinema/views.py#L137)

---

#### GET `/api/movies/`

**What it does:** Returns a list of all movies in the catalog.

**Access:** Public

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Interstellar",
    "description": "A team of explorers...",
    "duration": 169,
    "genre": "Sci-Fi",
    "rating": "9.0"
  },
  ...
]
```

---

#### POST `/api/movies/`

**What it does:** Creates a new movie in the catalog.

**Access:** Admin only

**Request body:**
```json
{
  "title": "Dune: Part Two",
  "description": "Paul Atreides unites with Chani...",
  "duration": 167,
  "genre": "Sci-Fi",
  "rating": 8.5
}
```

**Response (201 Created):** The created movie object.

---

#### GET `/api/movies/{id}/`

**What it does:** Returns details for a single movie.

**Access:** Public

**Example:** `GET /api/movies/1/` returns Interstellar's details.

---

#### PUT / PATCH `/api/movies/{id}/`

**What it does:** Updates a movie. `PUT` replaces all fields; `PATCH` updates only the fields you send.

**Access:** Admin only

**Example PATCH request body (only updating the rating):**
```json
{
  "rating": 9.5
}
```

---

#### DELETE `/api/movies/{id}/`

**What it does:** Permanently deletes a movie and all related showtimes, seats, bookings, tickets, and reviews.

**Access:** Admin only

> **Warning:** Deleting a movie is permanent and cascades to all related records. There is no undo.

---

#### GET `/api/movies/search/`

**What it does:** Searches movies by title and/or genre using query parameters.

**Access:** Public

**Query parameters:**
| Parameter | Description | Example |
|---|---|---|
| `q` | Search in title (case-insensitive) | `?q=dark` |
| `genre` | Filter by genre (case-insensitive) | `?genre=sci-fi` |

**Example:** `GET /api/movies/search/?q=dark&genre=action`

**Response:** Same format as movie list, but filtered.

---

#### GET `/api/movies/{id}/reviews/`

**What it does:** Returns all reviews for a specific movie.

**Access:** Authenticated

---

#### POST `/api/movies/{id}/reviews/`

**What it does:** Submits a review for a movie. The logged-in user is automatically set as the author.

**Access:** Authenticated

**Request body:**
```json
{
  "rating": 5,
  "comment": "Absolutely stunning film."
}
```

**Response (201 Created):**
```json
{
  "id": 5,
  "user": 3,
  "user_name": "Sara User",
  "movie": 1,
  "rating": 5,
  "comment": "Absolutely stunning film.",
  "course": null
}
```

---

### 6.3 Showtime and Seat Endpoints

**Logic lives in:** [`Cinema/views.py` lines 172–186](Backend/Ceema/Cinema/views.py#L172)

---

#### GET `/api/showtimes/`

**What it does:** Lists all showtimes, including the movie title.

**Access:** Public

**Response example:**
```json
[
  {
    "id": 1,
    "movie": 1,
    "movie_title": "Interstellar",
    "date": "2026-04-10",
    "time": "18:00:00"
  }
]
```

---

#### POST `/api/showtimes/`

**What it does:** Creates a new showtime for a movie.

**Access:** Admin only

**Request body:**
```json
{
  "movie": 1,
  "date": "2026-05-01",
  "time": "20:00:00"
}
```

---

#### GET `/api/showtimes/{id}/`

**What it does:** Returns details for a single showtime.

**Access:** Public

---

#### GET `/api/showtimes/{id}/seats/`

**What it does:** Returns all seats for a showtime, showing which ones are available and which are booked.

**Access:** Public

**Example:** `GET /api/showtimes/1/seats/`

**Response:**
```json
[
  {"id": 1, "seat_number": "A1", "status": "booked"},
  {"id": 2, "seat_number": "A2", "status": "available"},
  {"id": 3, "seat_number": "A3", "status": "available"},
  {"id": 4, "seat_number": "B1", "status": "available"}
]
```

---

### 6.4 Booking Endpoints

**Logic lives in:** [`Cinema/views.py` lines 190–255](Backend/Ceema/Cinema/views.py#L190)

---

#### GET `/api/bookings/`

**What it does:** Returns bookings. Regular users see only their own bookings. Admins see all bookings from all users.

**Access:** Authenticated

---

#### POST `/api/bookings/`

**What it does:** Creates a new booking. This is the most important business action in the system. In one request it:
1. Validates that the showtime and seats exist and are available
2. Creates the Booking record
3. Marks each seat as `"booked"`
4. Generates a Ticket for each seat (with a unique ticket code and QR code string)
5. Awards 10 loyalty points per seat to the user

**Access:** Authenticated

**Request body:**
```json
{
  "showtime_id": 1,
  "seat_ids": [2, 3],
  "price_per_seat": 50
}
```

| Field | Description |
|---|---|
| `showtime_id` | ID of the showtime you want to book |
| `seat_ids` | Array of seat IDs — must all belong to the given showtime and be available |
| `price_per_seat` | Price per seat. Defaults to 50 if not provided. Total = price × number of seats |

**Response (201 Created):**
```json
{
  "id": 4,
  "user": 3,
  "user_name": "Sara User",
  "showtime": 1,
  "booking_date": "2026-04-19T12:00:00Z",
  "total_price": "100.00",
  "status": "confirmed",
  "tickets": [
    {
      "id": 3,
      "booking": 4,
      "showtime": 1,
      "seat": 2,
      "seat_number": "A2",
      "ticket_code": "4F9A2B1C3D5E",
      "qr_code": "QR-4-A2"
    },
    {
      "id": 4,
      "booking": 4,
      "showtime": 1,
      "seat": 3,
      "seat_number": "A3",
      "ticket_code": "7B1E3A9C2F4D",
      "qr_code": "QR-4-A3"
    }
  ]
}
```

**Error responses:**

If a seat is already booked:
```json
{"non_field_errors": ["One or more seats are not available."]}
```

---

#### GET `/api/bookings/{id}/`

**What it does:** Returns the details of a single booking including its tickets.

**Access:** Owner or Admin

---

#### POST `/api/bookings/{id}/cancel/`

**What it does:** Cancels a booking. Marks the booking as `"cancelled"` and releases all seats back to `"available"`.

**Access:** Owner or Admin

**Request body:** (empty — just POST to the URL)

**Response (200 OK):** The updated booking with `status: "cancelled"`.

**Error if already cancelled:**
```json
{"detail": "Already cancelled."}
```

---

#### GET `/api/bookings/{id}/tickets/`

**What it does:** Returns all tickets for a specific booking.

**Access:** Owner or Admin

---

### 6.5 Social Endpoints (Posts, Comments, Likes)

**Logic lives in:** [`Cinema/views.py` lines 260–291](Backend/Ceema/Cinema/views.py#L260)

---

#### GET `/api/posts/`

**What it does:** Returns all social posts, newest first.

**Access:** Authenticated

**Response:**
```json
[
  {
    "id": 1,
    "user": 3,
    "user_name": "Sara User",
    "content": "Just watched Interstellar again — still gets me every time!",
    "created_at": "2026-04-01T12:00:00Z",
    "likes_count": 2,
    "comments_count": 2
  }
]
```

---

#### POST `/api/posts/`

**What it does:** Creates a new social post. The logged-in user is automatically set as the author.

**Access:** Authenticated

**Request body:**
```json
{
  "content": "Parasite was a masterpiece!"
}
```

---

#### PUT / PATCH / DELETE `/api/posts/{id}/`

**What it does:** Edit or delete a post.

**Access:** Owner or Admin (only the person who wrote the post, or an admin, can edit/delete it)

---

#### POST `/api/posts/{id}/like/`

**What it does:** Toggles a like on a post. If you haven't liked it, this likes it. If you already liked it, this un-likes it.

**Access:** Authenticated

**Request body:** (empty)

**Response when liking (201 Created):**
```json
{"liked": true, "likes_count": 3}
```

**Response when un-liking (200 OK):**
```json
{"liked": false, "likes_count": 2}
```

---

#### GET `/api/posts/{id}/comments/`

**What it does:** Returns all comments on a specific post.

**Access:** Authenticated

---

#### POST `/api/posts/{id}/comments/`

**What it does:** Adds a comment to a post. The logged-in user is set as the author automatically.

**Access:** Authenticated

**Request body:**
```json
{
  "content": "Same! The docking scene never gets old."
}
```

**Response (201 Created):**
```json
{
  "id": 4,
  "user": 4,
  "user_name": "Omar User",
  "post": 1,
  "content": "Same! The docking scene never gets old.",
  "created_at": "2026-04-19T12:00:00Z"
}
```

---

### 6.6 Course Endpoints

**Logic lives in:** [`Cinema/views.py` lines 296–314](Backend/Ceema/Cinema/views.py#L296)

---

#### GET `/api/courses/`

**What it does:** Lists all available cinema courses.

**Access:** Authenticated

**Response:**
```json
[
  {
    "id": 1,
    "title": "History of Cinema",
    "description": "A deep dive into the evolution of film...",
    "enrolled_count": 2
  }
]
```

---

#### POST `/api/courses/`

**What it does:** Creates a new course.

**Access:** Admin only

**Request body:**
```json
{
  "title": "Sound Design in Film",
  "description": "How audio shapes the cinematic experience."
}
```

---

#### POST `/api/courses/{id}/enroll/`

**What it does:** Enrolls the logged-in user in a course.

**Access:** Authenticated

**Request body:** (empty)

**Response (200 OK):**
```json
{"detail": "Enrolled in 'History of Cinema'."}
```

**Error if already enrolled:**
```json
{"detail": "Already enrolled."}
```

---

#### POST `/api/courses/{id}/unenroll/`

**What it does:** Removes the logged-in user from a course.

**Access:** Authenticated

**Response (200 OK):**
```json
{"detail": "Unenrolled from 'History of Cinema'."}
```

---

### 6.7 Badges and Rewards Endpoints

**Logic lives in:** [`Cinema/views.py` lines 319–330](Backend/Ceema/Cinema/views.py#L319)

---

#### GET `/api/badges/`

**What it does:** Lists all achievement badges available on the platform.

**Access:** Authenticated

**Response:**
```json
[
  {"id": 1, "name": "First Booking", "description": "Made your first cinema booking."},
  {"id": 2, "name": "Cinephile", "description": "Watched 10 movies."},
  {"id": 3, "name": "Social Butterfly", "description": "Made 5 posts."}
]
```

---

#### GET `/api/badges/{id}/`

**What it does:** Returns details for a specific badge.

**Access:** Authenticated

---

#### GET `/api/rewards/`

**What it does:** Lists all rewards available to redeem with loyalty points.

**Access:** Authenticated

**Response:**
```json
[
  {"id": 1, "name": "Free Popcorn", "points_required": 20},
  {"id": 2, "name": "Free Ticket", "points_required": 50},
  {"id": 3, "name": "VIP Lounge Access", "points_required": 100}
]
```

---

#### GET `/api/rewards/{id}/`

**What it does:** Returns details for a specific reward.

**Access:** Authenticated

---

### 6.8 Recommendations Endpoints

**Logic lives in:** [`Cinema/views.py` lines 335–341](Backend/Ceema/Cinema/views.py#L335)

---

#### GET `/api/recommendations/`

**What it does:** Returns personalized movie recommendations for the logged-in user. Each user only sees their own recommendations.

**Access:** Authenticated

**Response:**
```json
[
  {
    "id": 1,
    "movie": {
      "id": 2,
      "title": "The Dark Knight",
      "description": "When the menace known as the Joker...",
      "duration": 152,
      "genre": "Action",
      "rating": "9.0"
    },
    "type": "based_on_genre"
  }
]
```

---

### 6.9 User Profile Endpoints

**Logic lives in:** [`Cinema/views.py` lines 104–132](Backend/Ceema/Cinema/views.py#L104)

---

#### GET `/api/users/{id}/profile/`

**What it does:** Returns the profile for a specific user.

**Access:** Authenticated

**Response:**
```json
{
  "id": 3,
  "bio": "Movie lover and critic.",
  "followers_count": 12
}
```

---

#### PUT `/api/users/{id}/profile/`

**What it does:** Fully replaces the profile data for a user.

**Access:** Owner or Admin

**Request body:**
```json
{
  "bio": "Passionate about world cinema.",
  "followers_count": 12
}
```

---

#### PATCH `/api/users/{id}/profile/`

**What it does:** Partially updates the profile (only the fields you send).

**Access:** Owner or Admin

**Request body:**
```json
{
  "bio": "Passionate about world cinema."
}
```

---

#### GET `/api/users/`

**What it does:** Lists all users on the platform.

**Access:** Admin only

---

#### GET `/api/users/{id}/`

**What it does:** Returns details for a specific user.

**Access:** Owner or Admin

---

#### PATCH `/api/users/{id}/`

**What it does:** Updates a user's name or email.

**Access:** Owner or Admin

**Request body:**
```json
{
  "name": "Sara Ahmed"
}
```

---

#### DELETE `/api/users/{id}/`

**What it does:** Deletes a user account permanently.

**Access:** Admin only

---

### 6.10 Admin Endpoints

**Logic lives in:** [`Cinema/views.py` lines 344–364](Backend/Ceema/Cinema/views.py#L344)

---

#### GET `/api/admin/reports/`

**What it does:** Lists all reports generated by admins.

**Access:** Admin only

---

#### POST `/api/admin/reports/`

**What it does:** Creates a new report entry. The logged-in admin is automatically set as the report's author.

**Access:** Admin only

**Request body:** (empty — the system records which admin created it and when)

**Response (201 Created):**
```json
{
  "id": 3,
  "admin": 1,
  "admin_name": "Alice Admin",
  "generated_at": "2026-04-19T12:00:00Z"
}
```

---

#### GET `/api/admin/users/`

**What it does:** Lists all users — identical to `/api/users/` but specifically for admin management workflows.

**Access:** Admin only

---

#### GET/PUT/PATCH/DELETE `/api/admin/users/{id}/`

**What it does:** Full CRUD (Create, Read, Update, Delete) management of any user account.

**Access:** Admin only

---

### Complete Endpoint Reference Table

| Method | URL | Description | Access |
|---|---|---|---|
| POST | `/api/auth/register/` | Register a new account | Public |
| POST | `/api/auth/login/` | Login and get tokens | Public |
| POST | `/api/auth/logout/` | Logout | Authenticated |
| POST | `/api/auth/refresh/` | Refresh access token | Public |
| GET | `/api/movies/` | List all movies | Public |
| POST | `/api/movies/` | Create a movie | Admin only |
| GET | `/api/movies/{id}/` | Get movie details | Public |
| PUT/PATCH | `/api/movies/{id}/` | Update a movie | Admin only |
| DELETE | `/api/movies/{id}/` | Delete a movie | Admin only |
| GET | `/api/movies/search/` | Search movies | Public |
| GET | `/api/movies/{id}/reviews/` | List movie reviews | Authenticated |
| POST | `/api/movies/{id}/reviews/` | Write a review | Authenticated |
| GET | `/api/showtimes/` | List all showtimes | Public |
| POST | `/api/showtimes/` | Create a showtime | Admin only |
| GET | `/api/showtimes/{id}/` | Get showtime details | Public |
| PUT/PATCH | `/api/showtimes/{id}/` | Update a showtime | Admin only |
| DELETE | `/api/showtimes/{id}/` | Delete a showtime | Admin only |
| GET | `/api/showtimes/{id}/seats/` | List seats for a showtime | Public |
| GET | `/api/bookings/` | My bookings (or all if admin) | Authenticated |
| POST | `/api/bookings/` | Create a booking | Authenticated |
| GET | `/api/bookings/{id}/` | Get booking details | Owner or Admin |
| POST | `/api/bookings/{id}/cancel/` | Cancel a booking | Owner or Admin |
| GET | `/api/bookings/{id}/tickets/` | Get booking tickets | Owner or Admin |
| GET | `/api/posts/` | List all posts | Authenticated |
| POST | `/api/posts/` | Create a post | Authenticated |
| GET | `/api/posts/{id}/` | Get post details | Authenticated |
| PUT/PATCH | `/api/posts/{id}/` | Edit a post | Owner or Admin |
| DELETE | `/api/posts/{id}/` | Delete a post | Owner or Admin |
| POST | `/api/posts/{id}/like/` | Toggle like on a post | Authenticated |
| GET | `/api/posts/{id}/comments/` | List post comments | Authenticated |
| POST | `/api/posts/{id}/comments/` | Add a comment | Authenticated |
| GET | `/api/courses/` | List all courses | Authenticated |
| POST | `/api/courses/` | Create a course | Admin only |
| GET | `/api/courses/{id}/` | Get course details | Authenticated |
| PUT/PATCH | `/api/courses/{id}/` | Update a course | Admin only |
| DELETE | `/api/courses/{id}/` | Delete a course | Admin only |
| POST | `/api/courses/{id}/enroll/` | Enroll in a course | Authenticated |
| POST | `/api/courses/{id}/unenroll/` | Unenroll from a course | Authenticated |
| GET | `/api/badges/` | List all badges | Authenticated |
| GET | `/api/badges/{id}/` | Get badge details | Authenticated |
| GET | `/api/rewards/` | List all rewards | Authenticated |
| GET | `/api/rewards/{id}/` | Get reward details | Authenticated |
| GET | `/api/recommendations/` | My recommendations | Authenticated |
| GET | `/api/users/` | List all users | Admin only |
| GET | `/api/users/{id}/` | Get user details | Owner or Admin |
| PUT/PATCH | `/api/users/{id}/` | Update user | Owner or Admin |
| DELETE | `/api/users/{id}/` | Delete user | Admin only |
| GET | `/api/users/{id}/profile/` | Get profile | Authenticated |
| PUT/PATCH | `/api/users/{id}/profile/` | Update profile | Owner or Admin |
| GET | `/api/admin/reports/` | List reports | Admin only |
| POST | `/api/admin/reports/` | Create a report | Admin only |
| GET | `/api/admin/users/` | List all users (admin) | Admin only |
| GET/PATCH/DELETE | `/api/admin/users/{id}/` | Manage any user | Admin only |

---

## 7. Using Swagger UI

Swagger UI is a built-in interactive API explorer. You can use it to try every endpoint directly from your browser — no code required. Think of it as a control panel for the API.

**URL:** [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)

### Step-by-Step: Using Swagger UI

**Step 1: Open Swagger UI**

Make sure the server is running, then navigate to [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/). You will see a page with all endpoints listed and grouped by category (auth, movies, bookings, etc.).

**Step 2: Log in to get a token**

Most endpoints require authentication. Here's how to get a token:

1. Find the **auth** section and click on `POST /api/auth/login/`
2. Click the **"Try it out"** button on the right
3. In the Request body box, replace the example with:
   ```json
   {
     "email": "sara@ceema.com",
     "password": "ceema123"
   }
   ```
4. Click the blue **"Execute"** button
5. Scroll down to the **Response body** section
6. Copy the long string after `"access":` — this is your access token

**Step 3: Authorize Swagger UI with your token**

1. Scroll to the top of the Swagger page and click the **"Authorize"** button (it has a padlock icon)
2. In the dialog that appears, find the **BearerAuth** section
3. In the "Value" field, paste your access token
4. Click **"Authorize"** then **"Close"**

You will now see padlock icons appear closed next to each endpoint — this means Swagger is sending your token automatically with every request.

**Step 4: Try an endpoint**

Let's try listing movies:

1. Click on `GET /api/movies/` in the movies section
2. Click **"Try it out"**
3. Click **"Execute"**
4. The Response body will show all movies in the database

**Step 5: Try creating a booking**

1. First, check which seats are available: click `GET /api/showtimes/{id}/seats/`, enter `1` for the id, execute it
2. Note down the IDs of seats with `"status": "available"`
3. Now click `POST /api/bookings/`
4. Click **"Try it out"** and enter:
   ```json
   {
     "showtime_id": 1,
     "seat_ids": [2],
     "price_per_seat": 50
   }
   ```
5. Click **"Execute"** — you will see the created booking with a ticket automatically generated

**Step 6: Token expiry**

Access tokens expire after 1 hour. If you get a `401 Unauthorized` error, you need to log in again and re-authorize with the new token.

---

## 8. Authentication: How JWT Works

### What is JWT?

JWT stands for **JSON Web Token**. It is a secure way of proving who you are to the API without sending your password every time. Here is a simple analogy:

Think of JWT like a wristband at a concert:
- When you show your ticket at the door (login), they give you a wristband (the JWT token)
- From then on, you just show your wristband to get into different areas — you don't need to show your original ticket every time
- The wristband expires at the end of the night (access tokens expire in 1 hour)
- You can get a wristband extension using a backstage pass (the refresh token, valid for 7 days)

### The Two Tokens

| Token | Lifetime | Purpose |
|---|---|---|
| **Access token** | 1 hour | Sent with every API request to prove who you are |
| **Refresh token** | 7 days | Used to get a new access token without logging in again |

### The Login Flow

```mermaid
sequenceDiagram
    participant App as User / App
    participant API as CEEMA API
    participant DB as Database

    App->>API: POST /api/auth/login/ {email, password}
    API->>DB: Find user by email, check password hash
    DB-->>API: User found and password matches
    API->>API: Generate access token (1 hour) + refresh token (7 days)
    API-->>App: {access: "eyJ...", refresh: "eyJ...", user: {...}}

    Note over App,API: Now using the token...

    App->>API: GET /api/bookings/ with header: Authorization: Bearer eyJ...
    API->>API: CinemaJWTAuthentication reads token, extracts user_id
    API->>DB: Load User where id = user_id from token
    DB-->>API: User object (e.g., Sara)
    API-->>App: Sara's bookings
```

### How to Send the Token in a Request

When you are NOT using Swagger UI (e.g., writing code or using a tool like Postman), you must include the token in every request as an HTTP header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Refresh Flow

When your access token expires, use the refresh token to get a new one:

```mermaid
sequenceDiagram
    participant App as User / App
    participant API as CEEMA API

    App->>API: Any request with expired access token
    API-->>App: 401 Unauthorized — token expired

    App->>API: POST /api/auth/refresh/ {refresh: "eyJ..."}
    API-->>App: New access token: {access: "eyJ...NEW..."}

    App->>API: Retry request with new access token
    API-->>App: Success
```

### The Custom Authentication Class

CEEMA uses a custom JWT authentication class (`CinemaJWTAuthentication`) because the project has its own `User` model (not Django's built-in one). This class is defined in [`Cinema/authentication.py`](Backend/Ceema/Cinema/authentication.py) and does the following:

1. Reads the `Authorization: Bearer ...` header from the request
2. Validates the token's signature and expiry
3. Extracts the `user_id` from the token's payload
4. Looks up the matching `User` in the Cinema database
5. Attaches the User object to the request so views can access it as `request.user`

### Changing Token Expiry Times

Token lifetimes are configured in [`Ceema/settings.py`](Backend/Ceema/Ceema/settings.py) in the `SIMPLE_JWT` dictionary:

```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),   # Change this to adjust access token life
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),   # Change this to adjust refresh token life
}
```

For example, to make access tokens last 8 hours:
```python
"ACCESS_TOKEN_LIFETIME": timedelta(hours=8),
```

---

## 9. Sample Data

The project comes with a fixture file containing 66 pre-made records that give you a realistic dataset to work with.

**File location:** [`Backend/Ceema/Cinema/fixtures/sample_data.json`](Backend/Ceema/Cinema/fixtures/sample_data.json)

### How to Load the Sample Data

```bash
python manage.py loaddata Cinema/fixtures/sample_data.json
```

### How to Reset and Reload the Sample Data

If you want to start fresh:

```bash
python manage.py flush          # WARNING: This deletes ALL data from the database
python manage.py loaddata Cinema/fixtures/sample_data.json
```

> **Warning:** `manage.py flush` permanently deletes everything in the database. Only run it if you want to start completely fresh.

### The 7 Sample Users

All users have the same password: **`ceema123`**

| Name | Email | Role | Points |
|---|---|---|---|
| Alice Admin | `alice@ceema.com` | admin | 0 |
| Bob Admin | `bob@ceema.com` | admin | 0 |
| Sara User | `sara@ceema.com` | user | 30 |
| Omar User | `omar@ceema.com` | user | 10 |
| Rawan User | `rawan@ceema.com` | user | 50 |
| Layla User | `layla@ceema.com` | user | 20 |
| Karim User | `karim@ceema.com` | user | 0 |

### What Else Is in the Sample Data

| Type | Records | Details |
|---|---|---|
| Movies | 3 | Interstellar (Sci-Fi, 9.0), The Dark Knight (Action, 9.0), Parasite (Thriller, 8.5) |
| Showtimes | 4 | Various dates in April 2026 |
| Seats | 10 | A1–B1 style numbering; some already booked |
| Bookings | 3 | Sara and Omar have confirmed bookings; Rawan has a pending booking |
| Tickets | 2 | Associated with the confirmed bookings |
| Reviews | 4 | Various users reviewing movies |
| Posts | 3 | Social posts from Sara, Omar, and Rawan |
| Comments | 3 | Comments on the posts |
| Post Likes | 3 | Likes on posts |
| Badges | 3 | First Booking, Cinephile, Social Butterfly |
| Rewards | 3 | Free Popcorn (20 pts), Free Ticket (50 pts), VIP Lounge (100 pts) |
| Courses | 3 | History of Cinema, Film Criticism 101, Cinematography Basics |
| Recommendations | 4 | Personalized for Sara and Omar |
| Reports | 2 | Admin reports by Alice |
| Profiles | 7 | One profile per user |

---

## 10. Common Edits — The "How Do I...?" Cookbook

This section is a practical guide for the most common changes you might want to make. Follow these steps carefully.

---

### How Do I Add a New Movie?

**Method 1: Using Swagger UI (easiest)**

1. Log in to Swagger UI using an admin account (e.g., `alice@ceema.com` / `ceema123`)
2. Click `POST /api/movies/` → "Try it out"
3. Fill in the request body:
   ```json
   {
     "title": "Your Movie Title",
     "description": "A great movie about...",
     "duration": 120,
     "genre": "Drama",
     "rating": 7.5
   }
   ```
4. Click "Execute"

**Method 2: Using the Django Admin Panel**

1. Go to [http://localhost:8000/admin/](http://localhost:8000/admin/)
2. Log in with your superuser credentials (see [Section 11](#11-the-django-admin-panel) for how to create one)
3. Click "Movies" → "Add Movie"
4. Fill in the form and click "Save"

**Method 3: Adding to the Fixture File (for bulk/permanent sample data)**

Open [`Backend/Ceema/Cinema/fixtures/sample_data.json`](Backend/Ceema/Cinema/fixtures/sample_data.json) and add a new entry:

```json
{"model": "Cinema.movie", "pk": 4, "fields": {
  "title": "Oppenheimer",
  "description": "The story of J. Robert Oppenheimer...",
  "duration": 180,
  "genre": "Historical Drama",
  "rating": "8.3"
}}
```

Then reload the fixture:
```bash
python manage.py loaddata Cinema/fixtures/sample_data.json
```

---

### How Do I Add a New Field to a Model?

Let's say you want to add a `language` field to the Movie model (to show what language a film is in).

**Step 1: Edit the model**

Open [`Backend/Ceema/Cinema/models.py`](Backend/Ceema/Cinema/models.py) and find the Movie class (around line 86). Add your new field:

```python
class Movie(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    duration = models.PositiveIntegerField(help_text="Duration in minutes")
    genre = models.CharField(max_length=100)
    rating = models.DecimalField(...)
    language = models.CharField(max_length=50, default="English")  # <-- Add this line
```

> **Note:** Always provide a `default` value for new fields (or set `blank=True, null=True`), otherwise the migration will fail because the database doesn't know what value to put in existing rows.

**Step 2: Create a migration**

A migration is an instruction file that tells the database to add the new column.

```bash
python manage.py makemigrations
```

You should see:
```
Migrations for 'Cinema':
  Cinema/migrations/0002_movie_language.py
    - Add field language to movie
```

**Step 3: Apply the migration**

```bash
python manage.py migrate
```

**Step 4: Update the serializer**

Open [`Backend/Ceema/Cinema/serializers.py`](Backend/Ceema/Cinema/serializers.py) and find `MovieSerializer` (around line 67). Add `"language"` to the `fields` list:

```python
class MovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movie
        fields = ["id", "title", "description", "duration", "genre", "rating", "language"]
                                                                                   # ^^ Add here
```

**Done!** The new `language` field will now appear in all Movie API responses.

---

### How Do I Add a New API Endpoint?

Let's say you want to add an endpoint to see how many bookings a specific movie has: `GET /api/movies/{id}/booking-count/`.

**Step 1: Add the action to the view**

Open [`Backend/Ceema/Cinema/views.py`](Backend/Ceema/Cinema/views.py) and find the `MovieViewSet` class (around line 138). Add a new `@action` method inside the class:

```python
@action(detail=True, methods=["get"], url_path="booking-count", permission_classes=[AllowAny])
def booking_count(self, request, pk=None):
    movie = self.get_object()
    # Count all bookings for all showtimes of this movie
    count = Booking.objects.filter(showtime__movie=movie).count()
    return Response({"movie": movie.title, "booking_count": count})
```

Also add `Booking` to the imports at the top of the file if it's not already there.

**Step 2: That's it!**

Because `MovieViewSet` is registered with a DRF `router`, the `@action` decorator automatically registers the URL as `GET /api/movies/{id}/booking-count/`. No changes needed in `urls.py`.

**Step 3: Verify it appears in Swagger**

Restart the server and visit [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/) — your new endpoint will appear automatically.

---

### How Do I Change Who Can Access an Endpoint?

Permissions are defined in [`Backend/Ceema/Cinema/permissions.py`](Backend/Ceema/Cinema/permissions.py) and applied in views.

**The three custom permission classes:**

| Class | Who can access |
|---|---|
| `IsAdmin` | Must be logged in AND have `role = "admin"` |
| `IsAdminOrReadOnly` | Logged-in users can read (GET); only admins can write (POST/PUT/PATCH/DELETE) |
| `IsOwnerOrAdmin` | Object-level: only the record's owner or an admin |

**From DRF (built-in):**

| Class | Who can access |
|---|---|
| `AllowAny` | Literally anyone, no token needed |
| `IsAuthenticated` | Must have a valid JWT token |

**Example: Make movie listing require authentication (currently it's public)**

Open [`Cinema/views.py`](Backend/Ceema/Cinema/views.py) and find `MovieViewSet.get_permissions` (around line 142):

```python
def get_permissions(self):
    if self.action in ["list", "retrieve", "search"]:
        return [AllowAny()]           # <-- Change AllowAny() to IsAuthenticated()
    return [IsAdmin()]
```

Change to:

```python
def get_permissions(self):
    if self.action in ["list", "retrieve", "search"]:
        return [IsAuthenticated()]    # Now requires login to see movies
    return [IsAdmin()]
```

**Example: Creating a completely new permission**

Open [`Cinema/permissions.py`](Backend/Ceema/Cinema/permissions.py) and add a new class:

```python
class IsPremiumUser(BasePermission):
    """Only users with 50 or more points can access."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.points >= 50
        )
```

Then use it in a view: `permission_classes = [IsPremiumUser]`

---

### How Do I Change the JWT Token Expiry?

Open [`Backend/Ceema/Ceema/settings.py`](Backend/Ceema/Ceema/settings.py) and find the `SIMPLE_JWT` section (around line 118):

```python
from datetime import timedelta
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),   # Change this number
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),   # Change this number
    ...
}
```

Examples:
- `timedelta(minutes=30)` — 30 minutes
- `timedelta(hours=8)` — 8 hours
- `timedelta(days=1)` — 1 day
- `timedelta(days=30)` — 30 days

Restart the server after changing settings. Existing tokens are not affected (they keep their original expiry from when they were issued).

---

### How Do I Add a New Environment Variable?

Environment variables are sensitive settings (like passwords) stored outside the code in a `.env` file.

**Step 1: Add the variable to the `.env` file**

```bash
MY_NEW_SETTING=some_value
```

**Step 2: Read it in `settings.py`**

```python
MY_NEW_SETTING = os.getenv("MY_NEW_SETTING", "default_value_if_not_set")
```

**Step 3: Load it before starting the server**

Mac:
```bash
export $(cat .env | xargs)
```

Windows:
```powershell
Get-Content .env | ForEach-Object { $k,$v = $_ -split '=',2; $env:$k = $v }
```

---

## 11. The Django Admin Panel

Django comes with a built-in browser-based admin interface at `/admin/`. This lets you view and edit every record in the database through a visual form — no code required.

**URL:** [http://localhost:8000/admin/](http://localhost:8000/admin/)

### What Models Are Registered

All 17 models are registered in [`Cinema/admin.py`](Backend/Ceema/Cinema/admin.py), so you can manage all of them through the admin panel:

- Users, Admins, Profiles
- Movies, Reviews
- Showtimes, Seats
- Bookings, Tickets, PaymentTransactions
- Posts, Comments, PostLikes
- Badges, Rewards, Courses
- Recommendations, Reports

### Creating a Django Superuser

The Django admin panel uses Django's own authentication system (separate from the CEEMA JWT system). You need to create a "superuser" account to log in to `/admin/`.

```bash
python manage.py createsuperuser
```

You will be prompted for:
- Username: (choose any username, e.g. `admin`)
- Email address: (can be left blank)
- Password: (choose a secure password)

Then visit [http://localhost:8000/admin/](http://localhost:8000/admin/) and log in with these credentials.

> **Note:** This superuser account is separate from the CEEMA User records — it's only for the `/admin/` panel. Logging in here does NOT give you a JWT token for the API.

### Using the Admin Panel to Add Data

Once logged in to `/admin/`:

1. Click on the model you want to manage in the left sidebar (e.g., "Movies")
2. Click **"Add Movie"** in the top right
3. Fill in the form fields
4. Click **"Save"**

The record is immediately visible in the API.

---

## 12. Troubleshooting

### "Port 8000 is already in use"

**Symptom:**
```
Error: That port is already in use.
```

**Fix:** Either kill the process using that port, or use a different port:

Mac:
```bash
# Find what's using port 8000
lsof -i :8000
# Kill it (replace 12345 with the PID shown)
kill -9 12345
```

Or just use a different port:
```bash
python manage.py runserver 8001
```

Then access the app at [http://localhost:8001/api/docs/](http://localhost:8001/api/docs/)

---

### "could not connect to server: Connection refused (PostgreSQL not running)"

**Symptom:**
```
django.db.utils.OperationalError: could not connect to server: Connection refused
    Is the server running on host "localhost" (127.0.0.1) and accepting
    TCP/IP connections on port 5432?
```

**Fix:** PostgreSQL is not running. Start it:

Mac:
```bash
brew services start postgresql@16
```

Windows: Search for "Services" in the Start menu, find "postgresql-x64-16" and click "Start". Or run:
```powershell
net start postgresql-x64-16
```

---

### "No module named 'psycopg2'"

**Symptom:**
```
ModuleNotFoundError: No module named 'psycopg2'
```

**Fix:** Your virtual environment is not active, or dependencies are not installed.

```bash
source venv/bin/activate          # Mac
# or
venv\Scripts\activate             # Windows

pip install -r requirements.txt
```

---

### "django.db.utils.ProgrammingError: relation does not exist"

**Symptom:** The API returns a 500 error and the terminal shows a database table not found error.

**Fix:** Migrations have not been run. Run them:

```bash
python manage.py migrate
```

---

### "401 Unauthorized" on API calls

**Symptom:**
```json
{"detail": "Authentication credentials were not provided."}
```

**Fix:** You are calling an endpoint that requires authentication without a token. Either:
1. Log in first (call `POST /api/auth/login/`) and get a token
2. In Swagger UI, click "Authorize" and paste your access token
3. If your token has expired (after 1 hour), log in again to get a new one

---

### "400 Bad Request — Invalid email or password"

**Symptom:**
```json
{"non_field_errors": ["Invalid email or password."]}
```

**Fix:** Double-check:
1. The email is correct (e.g., `sara@ceema.com` — lowercase)
2. The password is correct — all sample data uses `ceema123`
3. The user exists — you may need to reload the sample data

---

### "403 Forbidden — You do not have permission"

**Symptom:**
```json
{"detail": "You do not have permission to perform this action."}
```

**Fix:** You are trying to do something that requires a higher permission level:
- If you need admin access, log in as `alice@ceema.com` or `bob@ceema.com`
- If you are trying to edit someone else's post or booking, you need to be the owner or an admin

---

### Migration Conflicts / "Inconsistent migration history"

**Symptom:**
```
django.db.migrations.exceptions.InconsistentMigrationHistory
```

**Fix:** This happens when the database state doesn't match the migration files. The safest fix for a development environment is to reset:

```bash
python manage.py migrate Cinema zero    # Roll back all Cinema migrations
python manage.py migrate                # Re-apply all migrations
python manage.py loaddata Cinema/fixtures/sample_data.json  # Reload data
```

> **Warning:** This will delete all data in the Cinema tables. Only do this in development.

---

### "Environment variables not loaded — database not connecting"

**Symptom:** The server uses SQLite instead of PostgreSQL, or shows connection errors.

**Fix:** The `.env` file exists but the variables are not loaded into your current terminal session. You must run the export command every time you open a new terminal:

Mac:
```bash
export $(cat .env | xargs)
```

Windows:
```powershell
Get-Content .env | ForEach-Object { $k,$v = $_ -split '=',2; $env:$k = $v }
```

---

### "fixture ... not found" when loading sample data

**Symptom:**
```
CommandError: No fixture named 'Cinema/fixtures/sample_data' found.
```

**Fix:** Make sure you are in the right directory when running the command:

```bash
cd /path/to/Ceema/Backend/Ceema
python manage.py loaddata Cinema/fixtures/sample_data.json
```

---

### The Server is Running But I Can't Access It

**Checklist:**
1. Is the terminal showing "Starting development server at http://127.0.0.1:8000/" without errors?
2. Are you using the correct URL: `http://localhost:8000/api/docs/` (not `https`)?
3. Is your browser trying to use a cached redirect? Try opening an incognito/private window.
4. On Windows, did you allow Python through the Windows Firewall when prompted?

---

## Appendix A: Environment Variables Reference

The following environment variables control database connections. They are loaded from the `.env` file.

| Variable | Description | Default |
|---|---|---|
| `POSTGRES_DB` | Database name | (none — uses SQLite if unset) |
| `POSTGRES_USER` | Database username | (none) |
| `POSTGRES_PASSWORD` | Database password | (none) |
| `POSTGRES_HOST` | Database host | `localhost` |
| `POSTGRES_PORT` | Database port | `5432` |
| `DJANGO_SECRET_KEY` | Django's cryptographic secret | (a hardcoded dev key) |
| `DJANGO_DEBUG` | Enable debug mode | `true` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated allowed hostnames | `localhost,127.0.0.1` |

> **Warning:** Never commit your `.env` file to Git or share it publicly — it contains your database password. The project's `.gitignore` already excludes `.env` files.

---

## Appendix B: Python Package Dependencies

All packages and their exact versions are in [`Backend/Ceema/requirements.txt`](Backend/Ceema/requirements.txt):

| Package | Version | Purpose |
|---|---|---|
| `Django` | 5.2.12 | The web framework — handles routing, ORM, admin |
| `djangorestframework` | 3.17.1 | Turns Django into an API framework (serializers, viewsets) |
| `djangorestframework-simplejwt` | 5.5.1 | JWT token generation and validation |
| `drf-spectacular` | 0.29.0 | Generates Swagger UI automatically from the code |
| `psycopg2-binary` | 2.9.11 | The PostgreSQL database driver for Python |
| `asgiref` | 3.11.1 | Async support (used internally by Django) |
| `sqlparse` | 0.5.5 | SQL formatting (used internally by Django) |
| `tzdata` | 2025.3 | Timezone data |

---

## Appendix C: Glossary

| Term | Plain English Explanation |
|---|---|
| **API** | Application Programming Interface — a set of URLs you can call to get or send data |
| **REST** | A standard style for organizing API URLs (each URL represents a "resource" like a movie or booking) |
| **JWT** | JSON Web Token — a secure, compact string that proves your identity without sending your password |
| **Bearer token** | The access token, sent in the `Authorization: Bearer ...` HTTP header |
| **Endpoint** | A specific URL that does a specific thing (e.g., `POST /api/auth/login/` is the login endpoint) |
| **HTTP method** | The action you're performing: GET (fetch), POST (create), PUT (replace), PATCH (update), DELETE (remove) |
| **Serializer** | Code that converts Python objects to JSON (for responses) and JSON to Python (for input validation) |
| **ViewSet** | A class in Django REST Framework that handles multiple related endpoints (list, detail, create, update, delete) |
| **Model** | A Python class that represents a database table |
| **Migration** | A file that describes changes to the database structure (add a table, add a column, etc.) |
| **Virtual environment** | An isolated Python installation for this project — keeps packages separate from your system Python |
| **Fixture** | A JSON file of pre-made data that can be loaded into the database for testing |
| **Router** | Django REST Framework code that automatically creates URLs for ViewSets |
| **Superuser** | A Django admin panel account with full access to everything (separate from the CEEMA User model) |
| **Cascade** | When you delete a record, related records are automatically deleted too |
| **CRUD** | Create, Read, Update, Delete — the four basic operations on data |
| **ORM** | Object-Relational Mapper — Django's system for talking to the database using Python instead of SQL |
| **DRF** | Django REST Framework — the toolkit used to build this API |
| **Swagger** | A standard format for documenting APIs, and also the interactive UI at `/api/docs/` |

---

*This documentation was written for CEEMA version 1.0.0 (commit 62abedd). Last updated: 2026-04-19.*
