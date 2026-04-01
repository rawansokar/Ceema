#!/bin/bash
set -e

echo "=== Ceema Setup ==="

# Check Python
if ! command -v python3 &>/dev/null; then
    echo "ERROR: python3 is not installed. Please install Python 3.10+."
    exit 1
fi

# Check PostgreSQL
if ! command -v psql &>/dev/null; then
    echo "ERROR: PostgreSQL is not installed."
    echo "  Mac:   brew install postgresql && brew services start postgresql"
    echo "  Linux: sudo apt install postgresql postgresql-contrib && sudo service postgresql start"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate and install dependencies
echo "Installing dependencies..."
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q

# Collect database credentials
echo ""
echo "=== PostgreSQL Setup ==="
read -p "Database name   [ceema_db]:    " DB_NAME
DB_NAME=${DB_NAME:-ceema_db}

read -p "Database user   [ceema_user]:  " DB_USER
DB_USER=${DB_USER:-ceema_user}

read -s -p "Database password:             " DB_PASS
echo ""

read -p "Database host   [localhost]:   " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Database port   [5432]:        " DB_PORT
DB_PORT=${DB_PORT:-5432}

# Create DB and user
echo "Creating database and user..."
psql postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
psql postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true

# Write .env file
cat > .env <<EOF
POSTGRES_DB=$DB_NAME
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=$DB_PASS
POSTGRES_HOST=$DB_HOST
POSTGRES_PORT=$DB_PORT
EOF

echo ".env file created."

# Export for current session and run migrations
export POSTGRES_DB=$DB_NAME
export POSTGRES_USER=$DB_USER
export POSTGRES_PASSWORD=$DB_PASS
export POSTGRES_HOST=$DB_HOST
export POSTGRES_PORT=$DB_PORT

echo "Running migrations..."
python manage.py migrate

echo ""
echo "=== Setup complete! ==="
echo "To start the server next time:"
echo "  cd $(pwd)"
echo "  source venv/bin/activate"
echo "  export \$(cat .env | xargs)"
echo "  python manage.py runserver"
