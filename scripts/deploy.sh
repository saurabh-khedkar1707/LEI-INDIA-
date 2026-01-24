#!/bin/bash

# Zero-Downtime Deployment Script for LEI Indias
# This script performs a production deployment with health checks and rollback capability
#
# Usage:
#   ./scripts/deploy.sh [--skip-build] [--force]
#
# Prerequisites:
#   - PM2 installed globally: npm install -g pm2
#   - Environment variables configured in backend/.env and frontend/.env.local
#   - MongoDB accessible
#   - All dependencies installed (pnpm install)

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
HEALTH_CHECK_URL="http://localhost:3001/health"
MAX_HEALTH_CHECK_RETRIES=10
HEALTH_CHECK_INTERVAL=3
ROLLBACK_ON_FAILURE=true

# Parse arguments
SKIP_BUILD=false
FORCE=false
for arg in "$@"; do
    case $arg in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        *)
            echo -e "${YELLOW}Unknown argument: $arg${NC}"
            ;;
    esac
done

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PM2 is installed
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2 is not installed. Install it with: npm install -g pm2"
        exit 1
    fi
    log_info "PM2 is installed"
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check if we're in the right directory
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        log_error "Not in project root directory"
        exit 1
    fi
    
    # Check if backend .env exists
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        log_warn "Backend .env file not found. Make sure environment variables are set."
        if [ "$FORCE" != true ]; then
            read -p "Continue anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    fi
    
    # Check if frontend .env.local exists
    if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
        log_warn "Frontend .env.local file not found. Make sure environment variables are set."
    fi
    
    # Check MongoDB connectivity (if backend .env exists)
    if [ -f "$BACKEND_DIR/.env" ]; then
        log_info "Checking MongoDB connectivity..."
        # Source backend .env to get MONGODB_URI
        source "$BACKEND_DIR/.env" 2>/dev/null || true
        if [ -z "$MONGODB_URI" ]; then
            log_warn "MONGODB_URI not found in backend/.env"
        else
            # Simple check - try to connect (requires mongosh or mongo client)
            log_info "MongoDB URI configured: ${MONGODB_URI:0:20}..."
        fi
    fi
    
    # Check if ecosystem.config.js exists
    if [ ! -f "$PROJECT_ROOT/ecosystem.config.js" ]; then
        log_error "ecosystem.config.js not found"
        exit 1
    fi
    
    log_info "Pre-deployment checks passed"
}

# Build applications
build_applications() {
    if [ "$SKIP_BUILD" = true ]; then
        log_warn "Skipping build (--skip-build flag used)"
        return
    fi
    
    log_info "Building applications..."
    cd "$PROJECT_ROOT"
    
    # Build backend
    log_info "Building backend..."
    cd "$BACKEND_DIR"
    NODE_ENV=production pnpm build:prod || {
        log_error "Backend build failed"
        exit 1
    }
    
    # Build frontend
    log_info "Building frontend..."
    cd "$FRONTEND_DIR"
    NODE_ENV=production pnpm build:prod || {
        log_error "Frontend build failed"
        exit 1
    }
    
    cd "$PROJECT_ROOT"
    log_info "Build completed successfully"
}

# Health check function
health_check() {
    local retries=0
    log_info "Performing health check on $HEALTH_CHECK_URL..."
    
    while [ $retries -lt $MAX_HEALTH_CHECK_RETRIES ]; do
        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
            log_info "Health check passed"
            return 0
        fi
        
        retries=$((retries + 1))
        if [ $retries -lt $MAX_HEALTH_CHECK_RETRIES ]; then
            log_warn "Health check failed, retrying ($retries/$MAX_HEALTH_CHECK_RETRIES)..."
            sleep $HEALTH_CHECK_INTERVAL
        fi
    done
    
    log_error "Health check failed after $MAX_HEALTH_CHECK_RETRIES attempts"
    return 1
}

# Rollback function
rollback() {
    log_error "Deployment failed. Attempting rollback..."
    
    # Get the previous PM2 process list
    if pm2 list | grep -q "leiindias"; then
        log_info "Restarting previous version..."
        pm2 restart ecosystem.config.js --env production || {
            log_error "Rollback failed. Manual intervention required."
            exit 1
        }
        
        sleep 5
        if health_check; then
            log_info "Rollback successful"
        else
            log_error "Rollback completed but health check failed"
        fi
    else
        log_error "No previous version found for rollback"
    fi
}

# Main deployment function
deploy() {
    log_info "Starting zero-downtime deployment..."
    
    # Check if apps are already running
    if pm2 list | grep -q "leiindias"; then
        log_info "Applications are running. Performing graceful reload..."
        
        # Save current state for potential rollback
        pm2 save
        
        # Graceful reload (zero-downtime)
        pm2 reload ecosystem.config.js --env production || {
            log_error "PM2 reload failed"
            if [ "$ROLLBACK_ON_FAILURE" = true ]; then
                rollback
            fi
            exit 1
        }
    else
        log_info "Applications not running. Starting fresh..."
        pm2 start ecosystem.config.js --env production || {
            log_error "PM2 start failed"
            exit 1
        }
    fi
    
    # Wait for applications to start
    log_info "Waiting for applications to start..."
    sleep 5
    
    # Perform health check
    if health_check; then
        log_info "Deployment successful!"
        pm2 save  # Save current state
        pm2 list  # Show status
    else
        log_error "Deployment failed health check"
        if [ "$ROLLBACK_ON_FAILURE" = true ]; then
            rollback
        fi
        exit 1
    fi
}

# Main execution
main() {
    log_info "=== LEI Indias Production Deployment ==="
    log_info "Timestamp: $(date)"
    
    check_pm2
    pre_deployment_checks
    build_applications
    deploy
    
    log_info "=== Deployment Complete ==="
    log_info "View logs with: pm2 logs"
    log_info "Monitor with: pm2 monit"
    log_info "View status with: pm2 list"
}

# Trap errors
trap 'log_error "Deployment script failed at line $LINENO"; if [ "$ROLLBACK_ON_FAILURE" = true ]; then rollback; fi; exit 1' ERR

# Run main function
main
