FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies (production only)
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Test that app can be imported (will fail build if there's an error)
RUN echo "=== Testing App Import ===" && \
    python -c "from app.main import app; print('App import test: OK')"

# Make startup script executable
RUN chmod +x start.sh

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# DEBUG: Sleep to keep container alive for inspection
# Remove this and use the uvicorn CMD below for production
CMD sh -c 'echo "=== DEBUG MODE - Container will sleep ===" && \
    echo "DATABASE_URL set: $([ -n \"$DATABASE_URL\" ] && echo YES || echo NO)" && \
    echo "SECRET_KEY set: $([ -n \"$SECRET_KEY\" ] && echo YES || echo NO)" && \
    echo "ALLOWED_ORIGINS: $ALLOWED_ORIGINS" && \
    echo "Use terminal to run: uvicorn app.main:app --host 0.0.0.0 --port 8000" && \
    sleep infinity'

# PRODUCTION CMD (uncomment when debug is done):
# CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
