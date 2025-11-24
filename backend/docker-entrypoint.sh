#!/bin/sh
set -e

# Initialize database schema on first run
echo "Initializing database..."
npx drizzle-kit push --force

echo "Starting server..."
exec "$@"
