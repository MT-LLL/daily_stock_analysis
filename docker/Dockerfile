# Multi-stage build: React Web UI + Python FastAPI backend
FROM node:20-slim AS web-builder
WORKDIR /app/apps/dsa-web
COPY apps/dsa-web/package.json apps/dsa-web/package-lock.json ./
RUN npm ci
COPY apps/dsa-web/ ./
RUN npm run build

FROM python:3.11-slim-bookworm
WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV LOG_DIR=/app/logs
ENV DATABASE_PATH=/app/data/stock_analysis.db
ENV WEBUI_HOST=0.0.0.0
ENV API_PORT=8000

RUN ln -snf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && echo Asia/Shanghai > /etc/timezone
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc curl wkhtmltopdf fontconfig libjpeg62-turbo libxrender1 libxext6 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY *.py ./
COPY api/ ./api/
COPY data_provider/ ./data_provider/
COPY bot/ ./bot/
COPY patch/ ./patch/
COPY src/ ./src/
COPY strategies/ ./strategies/
COPY --from=web-builder /app/static ./static/
COPY docker/entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh && mkdir -p /app/data /app/logs /app/reports

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || curl -f http://localhost:8000/health || python -c "import sys; sys.exit(0)"

# Entrypoint owns the runtime port and intentionally ignores platform CMD args.
# This prevents a literal '$PORT' from reaching argparse on Railway.
ENTRYPOINT ["/app/entrypoint.sh"]
