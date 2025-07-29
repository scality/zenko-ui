#!/bin/bash

set -e  # Exit on any error
set -u  # Exit on undefined variables

echo "Starting Zenko UI container..."

# Run deploy script to configure nginx based on configs
echo "Running deploy script to configure nginx..."
if /usr/local/bin/deploy-script.sh; then
    echo "Deploy script completed successfully"
else
    echo "Deploy script failed or no configurations found, continuing with default nginx config..."
fi

# Start nginx
echo "Starting nginx..."
exec nginx -g "daemon off;" 