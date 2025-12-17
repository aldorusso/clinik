FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies (production only)
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Test that app can be imported (will fail build if there's an error)
RUN python -c "from app.main import app; print('App import test: OK')"

# Make startup script executable
RUN chmod +x start.sh

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check - give container time to start
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Start command with startup script
CMD ["./start.sh"]
