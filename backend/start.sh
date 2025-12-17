#!/bin/sh
set -e

echo "=== Backend Startup Script ==="
echo "Checking environment..."
echo "DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo 'yes' || echo 'NO!')"

# Extract host and port from DATABASE_URL
DB_HOST=$(echo $DATABASE_URL | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's|.*:\([0-9]*\)/.*|\1|p')

echo "Database host: $DB_HOST"
echo "Database port: $DB_PORT"

# Wait for database to be ready (max 30 seconds)
echo "Waiting for database to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if python -c "
import socket
import sys
try:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(2)
    result = sock.connect_ex(('$DB_HOST', $DB_PORT))
    sock.close()
    sys.exit(0 if result == 0 else 1)
except Exception as e:
    print(f'Socket error: {e}')
    sys.exit(1)
" 2>/dev/null; then
        echo "Database is reachable!"
        break
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Attempt $RETRY_COUNT/$MAX_RETRIES - Database not ready, waiting..."
    sleep 1
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "ERROR: Could not connect to database after $MAX_RETRIES attempts"
    echo "Attempting to start anyway..."
fi

# Test Python app import
echo "Testing app import..."
python -c "from app.main import app; print('App import: OK')"

# Start uvicorn
echo "Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1 --log-level info
