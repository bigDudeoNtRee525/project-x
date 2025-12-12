#!/bin/sh
set -e

echo "Starting backend..."

# Run migrations unless skipped
if [ "$SKIP_MIGRATIONS" != "true" ]; then
    echo "Running database migrations..."
    npx prisma migrate deploy || echo "Migration warning - continuing..."
fi

echo "Starting server..."
exec "$@"
