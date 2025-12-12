#!/bin/sh
set -e

echo "Starting backend entrypoint script..."

# Function to check if database is ready
wait_for_db() {
    echo "Waiting for database to be ready..."

    # Extract host and port from DATABASE_URL
    # DATABASE_URL format: postgresql://user:password@host:port/database
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

    if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ]; then
        echo "Could not parse DATABASE_URL, skipping wait..."
        return 0
    fi

    MAX_RETRIES=30
    RETRY_COUNT=0

    until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "Database not ready yet (attempt $RETRY_COUNT/$MAX_RETRIES)..."
        sleep 2
    done

    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo "Warning: Could not connect to database after $MAX_RETRIES attempts"
        echo "Proceeding anyway..."
    else
        echo "Database is ready!"
    fi

    # Give it an extra moment
    sleep 2
}

# Function to run database migrations
run_migrations() {
    echo "Running database migrations..."

    # Deploy migrations (production-safe)
    npx prisma migrate deploy

    if [ $? -eq 0 ]; then
        echo "Migrations completed successfully!"
    else
        echo "Warning: Migration failed, but continuing..."
    fi
}

# Skip database operations if SKIP_MIGRATIONS is set
if [ "$SKIP_MIGRATIONS" != "true" ]; then
    wait_for_db
    run_migrations
else
    echo "Skipping migrations (SKIP_MIGRATIONS=true)"
fi

echo "Starting application..."

# Execute the main command
exec "$@"
