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

# Start command - prints env vars then starts uvicorn
CMD sh -c 'echo "=== RUNTIME ENV CHECK ===" && \
    echo "DATABASE_URL set: $([ -n \"$DATABASE_URL\" ] && echo YES || echo NO)" && \
    echo "SECRET_KEY set: $([ -n \"$SECRET_KEY\" ] && echo YES || echo NO)" && \
    echo "Starting uvicorn..." && \
    uvicorn app.main:app --host 0.0.0.0 --port 8000'
