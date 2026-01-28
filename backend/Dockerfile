# Use Python 3.10 slim image (small + compatible with TF 2.12)
FROM python:3.10.13-slim

# Environment variables (better logs + faster builds)
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    TF_CPP_MIN_LOG_LEVEL=2

# Working directory inside container
WORKDIR /app

# System dependency needed for TensorFlow CPU
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .

# Install dependencies
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Copy all backend code
COPY . .

# Create non-root user (security)
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Render uses dynamic PORT (default fallback 10000)
EXPOSE 10000

# ✅ Start server (Render-safe)
CMD ["sh", "-c", "uvicorn backend_server:app --host 0.0.0.0 --port ${PORT:-10000}"]
