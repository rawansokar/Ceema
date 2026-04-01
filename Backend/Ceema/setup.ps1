param(
    [string]$DBName = "ceema_db",
    [string]$DBUser = "ceema_user",
    [string]$DBPass = "ceema1234",
    [string]$DBHost = "localhost",
    [string]$DBPort = "5432",
    [string]$PostgresUser = "postgres",
    [string]$PostgresPass = ""
)

Write-Host "=== Ceema Setup ===" -ForegroundColor Cyan

# Check Python
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Python is not installed. Download from https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}

# Find psql - auto-detect if not in PATH
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    $pgInstall = Get-ChildItem "C:\Program Files\PostgreSQL" -ErrorAction SilentlyContinue |
        Sort-Object Name -Descending |
        Select-Object -First 1

    if ($pgInstall) {
        $pgBin = "$($pgInstall.FullName)\bin"
        Write-Host "PostgreSQL found at $pgBin - adding to PATH." -ForegroundColor Yellow
        $env:PATH = "$pgBin;$env:PATH"
    } else {
        Write-Host "ERROR: PostgreSQL not found. Download from https://www.postgresql.org/download/windows/" -ForegroundColor Red
        exit 1
    }
}

# Create virtual environment
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..."
    python -m venv venv
}

# Install dependencies
Write-Host "Installing dependencies..."
& "venv\Scripts\pip.exe" install --upgrade pip -q
& "venv\Scripts\pip.exe" install -r requirements.txt -q
Write-Host "Dependencies installed." -ForegroundColor Green

# Set postgres password for psql commands
if ($PostgresPass) {
    $env:PGPASSWORD = $PostgresPass
}

# Create DB user and database
Write-Host "Setting up PostgreSQL..."
psql -U $PostgresUser -h $DBHost -p $DBPort -c "CREATE USER $DBUser WITH PASSWORD '$DBPass';" 2>$null
psql -U $PostgresUser -h $DBHost -p $DBPort -c "CREATE DATABASE $DBName OWNER $DBUser;" 2>$null
psql -U $PostgresUser -h $DBHost -p $DBPort -c "GRANT ALL PRIVILEGES ON DATABASE $DBName TO $DBUser;" 2>$null
Write-Host "Database ready." -ForegroundColor Green

# Write .env file
$envContent = "POSTGRES_DB=$DBName`nPOSTGRES_USER=$DBUser`nPOSTGRES_PASSWORD=$DBPass`nPOSTGRES_HOST=$DBHost`nPOSTGRES_PORT=$DBPort"
$envContent | Out-File -FilePath ".env" -Encoding utf8
Write-Host ".env created." -ForegroundColor Green

# Set env vars for current session
$env:POSTGRES_DB = $DBName
$env:POSTGRES_USER = $DBUser
$env:POSTGRES_PASSWORD = $DBPass
$env:POSTGRES_HOST = $DBHost
$env:POSTGRES_PORT = $DBPort

# Run migrations
Write-Host "Running migrations..."
& "venv\Scripts\python.exe" manage.py migrate

Write-Host ""
Write-Host "=== Setup complete! ===" -ForegroundColor Green
Write-Host "To start the server next time:" -ForegroundColor Yellow
Write-Host "  venv\Scripts\activate"
Write-Host "  Get-Content .env | ForEach-Object { `$k,`$v = `$_ -split '=',2; `$env:`$k = `$v }"
Write-Host "  python manage.py runserver"
