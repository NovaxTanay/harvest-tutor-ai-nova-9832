FROM python:3.10.13-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# ✅ Copy backend requirements
COPY backend/requirements.txt /app/requirements.txt

RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r /app/requirements.txt

# ✅ Copy backend code
COPY backend/ /app/

EXPOSE 10000

CMD ["sh", "-c", "python -m uvicorn backend_server:app --host 0.0.0.0 --port ${PORT:-10000}"]
