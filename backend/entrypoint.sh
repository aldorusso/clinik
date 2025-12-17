#!/bin/sh
set -e

echo "=== Clinik Backend Startup ==="
echo "Date: $(date)"
echo ""

# Wait for database to be ready
echo "=== Waiting for database... ==="
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if python -c "from app.db.session import engine; engine.connect()" 2>/dev/null; then
        echo "Database is ready!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for database... (attempt $RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "ERROR: Could not connect to database after $MAX_RETRIES attempts"
    exit 1
fi

echo ""

# Run migrations
echo "=== Running database migrations ==="
alembic upgrade head
echo "Migrations completed!"
echo ""

# Create test users (only if they don't exist)
echo "=== Creating initial users ==="
python create_test_users.py || echo "Users may already exist, continuing..."
echo ""

# Start the server
echo "=== Starting Uvicorn server ==="
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
