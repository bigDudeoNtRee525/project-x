#!/bin/sh
set -e

echo "Starting backend entrypoint script..."

# Function to check if database is ready
wait_for_db() {
    echo "Waiting for database to be ready..."

    # Use postgres as host (Docker network name) and default port
    DB_HOST="postgres"
    DB_PORT="5432"

    echo "Checking connection to $DB_HOST:$DB_PORT..."

    MAX_RETRIES=30
    RETRY_COUNT=0

    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
            echo "Database is ready!"
            sleep 2
            return 0
        fi
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "Database not ready yet (attempt $RETRY_COUNT/$MAX_RETRIES)..."
        sleep 2
    done

    echo "Warning: Could not connect to database after $MAX_RETRIES attempts"
    echo "Proceeding anyway..."
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
