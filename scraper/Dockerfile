# ── TheBudBoard Scraper — Railway Dockerfile ──────────────────
# Uses the official Microsoft Playwright Python image which ships
# with Chromium + all system deps pre-installed (Ubuntu Jammy base).
FROM mcr.microsoft.com/playwright/python:v1.44.0-jammy

# Avoid prompts during apt installs
ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install Python deps first (layer-cached unless requirements.txt changes)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Railway runs this as a persistent worker process
CMD ["python", "scheduler.py"]
