#!/bin/bash

# Post-deploy hook for Elastic Beanstalk
# This script runs after deployment

set -e

echo "Running post-deploy setup..."

# Install pnpm if not already installed
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm@9.0.0
fi

# Run database migrations if needed
# Uncomment the following lines if you have migration scripts
# echo "Running database migrations..."
# pnpm run migrate

echo "Post-deploy setup completed!"
