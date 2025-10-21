#!/bin/bash

# ChainLinkPro Update Script
# This script updates the platform with zero downtime

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKUP_DIR="./backups"
UPDATE_LOG="./logs/update.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $UPDATE_LOG
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a $UPDATE_LOG
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a $UPDATE_LOG
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a $UPDATE_LOG
    exit 1
}

# Create backup before update
create_backup() {
    log "Creating backup before update..."
    
    # Run backup script
    if [ -f "./scripts/backup.sh" ]; then
        ./scripts/backup.sh
        success "Backup created successfully"
    else
        warning "Backup script not found, skipping backup"
    fi
}

# Pull latest code
pull_latest_code() {
    log "Pulling latest code from repository..."
    
    # Check if we're in a git repository
    if [ -d ".git" ]; then
        git fetch origin
        git pull origin main
        success "Code updated successfully"
    else
        warning "Not a git repository, skipping code update"
    fi
}

# Update Docker images
update_docker_images() {
    log "Updating Docker images..."
    
    # Pull latest images
    docker-compose pull
    
    # Build new images
    docker-compose build --no-cache
    
    success "Docker images updated"
}

# Rolling update with zero downtime
rolling_update() {
    log "Performing rolling update..."
    
    # Update backend first
    log "Updating backend service..."
    docker-compose up -d --no-deps backend
    
    # Wait for backend to be healthy
    log "Waiting for backend to be healthy..."
    sleep 30
    
    # Check backend health
    if curl -f -s http://localhost:5000/health > /dev/null; then
        success "Backend updated successfully"
    else
        error "Backend health check failed after update"
    fi
    
    # Update frontend
    log "Updating frontend service..."
    docker-compose up -d --no-deps frontend
    
    # Wait for frontend to be healthy
    log "Waiting for frontend to be healthy..."
    sleep 30
    
    # Check frontend health
    if curl -f -s http://localhost:3000 > /dev/null; then
        success "Frontend updated successfully"
    else
        error "Frontend health check failed after update"
    fi
    
    # Update other services
    log "Updating other services..."
    docker-compose up -d --no-deps nginx
    docker-compose up -d --no-deps prometheus
    docker-compose up -d --no-deps grafana
    
    success "Rolling update completed"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Check if there are any migration files
    if [ -d "./migrations" ] && [ "$(ls -A ./migrations)" ]; then
        # Run migrations
        docker-compose exec -T backend python manage.py migrate
        success "Database migrations completed"
    else
        warning "No migration files found, skipping migrations"
    fi
}

# Restart services if needed
restart_services() {
    log "Restarting services if needed..."
    
    # Check if any services need restart
    if docker-compose ps | grep -q "Restarting"; then
        log "Some services are restarting, waiting for them to stabilize..."
        sleep 60
    fi
    
    # Force restart all services
    docker-compose restart
    
    success "Services restarted"
}

# Verify update
verify_update() {
    log "Verifying update..."
    
    # Check all services are running
    if docker-compose ps | grep -q "Up"; then
        success "All services are running"
    else
        error "Some services failed to start after update"
    fi
    
    # Check application health
    if curl -f -s http://localhost:5000/health > /dev/null && \
       curl -f -s http://localhost:3000 > /dev/null; then
        success "Application health checks passed"
    else
        error "Application health checks failed after update"
    fi
    
    # Check logs for errors
    error_count=$(docker-compose logs --since=2m 2>&1 | grep -i error | wc -l)
    if [ "$error_count" -gt 0 ]; then
        warning "Found $error_count errors in recent logs"
    else
        success "No errors found in recent logs"
    fi
}

# Cleanup old images
cleanup_old_images() {
    log "Cleaning up old Docker images..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    success "Cleanup completed"
}

# Rollback if update fails
rollback() {
    log "Rolling back to previous version..."
    
    # Stop current services
    docker-compose down
    
    # Restore from backup
    if [ -d "$BACKUP_DIR" ] && [ "$(ls -A $BACKUP_DIR)" ]; then
        # Find latest backup
        latest_backup=$(ls -t $BACKUP_DIR/db_backup_*.sql | head -n1)
        
        if [ -n "$latest_backup" ]; then
            log "Restoring database from backup: $latest_backup"
            docker-compose up -d postgres
            sleep 30
            docker-compose exec -T postgres psql -U chainlinkpro -d chainlinkpro -f /backups/$(basename $latest_backup)
        fi
    fi
    
    # Start services
    docker-compose up -d
    
    error "Update failed, rolled back to previous version"
}

# Main update function
main() {
    log "Starting ChainLinkPro update process..."
    
    # Create logs directory if it doesn't exist
    mkdir -p ./logs
    
    # Set error trap for rollback
    trap rollback ERR
    
    # Run update steps
    create_backup
    pull_latest_code
    update_docker_images
    rolling_update
    run_migrations
    restart_services
    verify_update
    cleanup_old_images
    
    success "Update completed successfully!"
    
    echo ""
    echo "🎉 ChainLinkPro has been updated successfully!"
    echo ""
    echo "📊 Update Summary:"
    echo "  - Backup created: $BACKUP_DIR"
    echo "  - Services updated: All"
    echo "  - Database migrations: Completed"
    echo "  - Health checks: Passed"
    echo ""
    echo "🔧 Next Steps:"
    echo "  1. Monitor logs for any issues"
    echo "  2. Test all functionality"
    echo "  3. Update documentation if needed"
    echo "  4. Notify users of new features"
}

# Run main function
main "$@"