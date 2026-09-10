#!/bin/sh
set -e

# Railway may provide PORT at runtime. Keep the command inside the image so
# platform-level command overrides cannot inject a literal "$PORT" argument.
PORT="${PORT:-8000}"
exec python /app/main.py --webui-only --host 0.0.0.0 --port "$PORT"
