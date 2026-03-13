# ── Stage 1: Base image ─────────────────────────────────────────────────────
FROM python:3.11-slim AS base

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Stage 2: Copy application code ──────────────────────────────────────────
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY .env.example .env.example

# ── Expose ports ─────────────────────────────────────────────────────────────
EXPOSE 8000 8501

# ── Default: Run backend (override in docker-compose for frontend) ───────────
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
