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

# Ensure we are in the right directory
if (-not (Test-Path "manage.py")) {
    Write-Host "ERROR: manage.py not found. Please run this script from the Backend\Ceema folder." -ForegroundColor Red
    Write-Host "Example:  cd C:\Users\YourName\Downloads\Ceema-main\Backend\Ceema" -ForegroundColor Yellow
    exit 1
}

# Check Python - try both 'python' and 'py' (Windows launcher)
$pythonCmd = $null
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonCmd = "py"
} else {
    Write-Host "ERROR: Python is not installed." -ForegroundColor Red
    Write-Host "Download from https://www.python.org/downloads/ and check 'Add Python to PATH'." -ForegroundColor Yellow
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
        Write-Host "ERROR: PostgreSQL not found." -ForegroundColor Red
        Write-Host "Download from https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
        exit 1
    }
}

# Ask for postgres password once if not provided
if (-not $PostgresPass) {
    $securePwd = Read-Host "Enter your PostgreSQL superuser (postgres) password" -AsSecureString
    $PostgresPass = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePwd)
    )
}

$env:PGPASSWORD = $PostgresPass

# Test the postgres connection before doing anything
Write-Host "Testing PostgreSQL connection..."
$testResult = psql -U $PostgresUser -h $DBHost -p $DBPort -c "\q" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Could not connect to PostgreSQL. Check your password or that PostgreSQL is running." -ForegroundColor Red
    exit 1
}
Write-Host "PostgreSQL connection OK." -ForegroundColor Green

# Remove old venv (may be from a different OS)
if (Test-Path "venv") {
    Write-Host "Removing old virtual environment..."
    Remove-Item -Recurse -Force "venv"
}

# Create virtual environment
Write-Host "Creating virtual environment..."
& $pythonCmd -m venv venv

# Install dependencies
Write-Host "Installing dependencies..."
& "venv\Scripts\pip.exe" install --upgrade pip -q
& "venv\Scripts\pip.exe" install -r requirements.txt -q
Write-Host "Dependencies installed." -ForegroundColor Green

# Create DB user and database
Write-Host "Setting up PostgreSQL database..."
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
Write-Host ""
Write-Host "To start the server next time, run:" -ForegroundColor Yellow
Write-Host "  venv\Scripts\activate"
Write-Host "  Get-Content .env | ForEach-Object { `$k,`$v = `$_ -split '=',2; `$env:`$k = `$v }"
Write-Host "  python manage.py runserver"
Write-Host ""
Write-Host "Starting server now..."
& "venv\Scripts\python.exe" manage.py runserver
