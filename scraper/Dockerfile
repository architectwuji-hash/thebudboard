# ── TheBudBoard Scraper — Railway Dockerfile ──────────────────
# Uses Python 3.11 slim + Playwright's official dep installer.
# Playwright install-deps handles all Chromium system libraries.
FROM python:3.11-slim

# Avoid prompts during apt installs
ENV DEBIAN_FRONTEND=noninteractive

# Install wget + ca-certs (needed by playwright install-deps)
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (layer-cached unless requirements.txt changes)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Chromium + all its system dependencies via Playwright's own tool
RUN playwright install-deps chromium \
    && playwright install chromium

# Copy application code
COPY . .

# Railway runs this as a persistent worker process
CMD ["python", "scheduler.py"]
