Write-Host "=== Ceema Setup ===" -ForegroundColor Cyan

# Check Python
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Python is not installed. Download from https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}

# Check PostgreSQL (psql)
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: PostgreSQL is not installed. Download from https://www.postgresql.org/download/windows/" -ForegroundColor Red
    exit 1
}

# Create virtual environment
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..."
    python -m venv venv
}

# Activate and install dependencies
Write-Host "Installing dependencies..."
& "venv\Scripts\pip.exe" install --upgrade pip -q
& "venv\Scripts\pip.exe" install -r requirements.txt -q

# Collect database credentials
Write-Host ""
Write-Host "=== PostgreSQL Setup ===" -ForegroundColor Cyan

$DB_NAME = Read-Host "Database name   [ceema_db]"
if (-not $DB_NAME) { $DB_NAME = "ceema_db" }

$DB_USER = Read-Host "Database user   [ceema_user]"
if (-not $DB_USER) { $DB_USER = "ceema_user" }

$DB_PASS = Read-Host "Database password" -AsSecureString
$DB_PASS = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASS)
)

$DB_HOST = Read-Host "Database host   [localhost]"
if (-not $DB_HOST) { $DB_HOST = "localhost" }

$DB_PORT = Read-Host "Database port   [5432]"
if (-not $DB_PORT) { $DB_PORT = "5432" }

# Create DB and user
Write-Host "Creating database and user..."
$env:PGPASSWORD = $DB_PASS
psql -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>$null
psql -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>$null
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>$null

# Write .env file
@"
POSTGRES_DB=$DB_NAME
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=$DB_PASS
POSTGRES_HOST=$DB_HOST
POSTGRES_PORT=$DB_PORT
"@ | Out-File -FilePath ".env" -Encoding utf8

Write-Host ".env file created."

# Set env vars for current session
$env:POSTGRES_DB = $DB_NAME
$env:POSTGRES_USER = $DB_USER
$env:POSTGRES_PASSWORD = $DB_PASS
$env:POSTGRES_HOST = $DB_HOST
$env:POSTGRES_PORT = $DB_PORT

# Run migrations
Write-Host "Running migrations..."
& "venv\Scripts\python.exe" manage.py migrate

Write-Host ""
Write-Host "=== Setup complete! ===" -ForegroundColor Green
Write-Host "To start the server next time:"
Write-Host "  venv\Scripts\activate"
Write-Host "  Get-Content .env | ForEach-Object { `$k, `$v = `$_ -split '=', 2; [System.Environment]::SetEnvironmentVariable(`$k, `$v) }"
Write-Host "  python manage.py runserver"
