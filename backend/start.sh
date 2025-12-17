#!/bin/sh

echo "=== Backend Startup Script ==="
echo "Date: $(date)"
echo ""

echo "=== Environment Check ==="
echo "DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo 'YES' || echo 'NO!')"
echo "SECRET_KEY is set: $([ -n "$SECRET_KEY" ] && echo 'YES' || echo 'NO!')"
echo "ALLOWED_ORIGINS: $ALLOWED_ORIGINS"
echo ""

# Extract host and port from DATABASE_URL
if [ -n "$DATABASE_URL" ]; then
    DB_HOST=$(echo $DATABASE_URL | sed -n 's|.*@\([^:]*\):.*|\1|p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
    echo "Database host: $DB_HOST"
    echo "Database port: $DB_PORT"
else
    echo "WARNING: DATABASE_URL not set!"
fi
echo ""

echo "=== Python Environment ==="
python --version
echo ""

echo "=== Testing Basic Python Import ==="
python -c "print('Python works!')" || echo "FAILED: Basic Python"

echo ""
echo "=== Testing FastAPI Import ==="
python -c "from fastapi import FastAPI; print('FastAPI import: OK')" || echo "FAILED: FastAPI import"

echo ""
echo "=== Testing Config Import ==="
python -c "from app.core.config import settings; print('Config import: OK'); print('PROJECT_NAME:', settings.PROJECT_NAME)" 2>&1 || echo "FAILED: Config import"

echo ""
echo "=== Testing Full App Import ==="
python -c "from app.main import app; print('Full app import: OK')" 2>&1 || echo "FAILED: Full app import"

echo ""
echo "=== Starting Uvicorn ==="
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1 --log-level debug 2>&1
