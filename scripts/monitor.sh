#!/bin/bash

# ChainLinkPro Monitoring Script
# This script monitors the health of all services

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
LOG_FILE="./logs/monitor.log"
ALERT_EMAIL="admin@chainlinkpro.io"
THRESHOLD_CPU=80
THRESHOLD_MEMORY=85
THRESHOLD_DISK=90

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a $LOG_FILE
}

# Check Docker services
check_docker_services() {
    log "Checking Docker services..."
    
    # Get list of services
    services=$(docker-compose ps --services)
    
    for service in $services; do
        status=$(docker-compose ps -q $service | xargs docker inspect -f '{{.State.Status}}' 2>/dev/null || echo "not_running")
        
        if [ "$status" = "running" ]; then
            success "$service is running"
        else
            error "$service is not running"
            # Try to restart the service
            log "Attempting to restart $service..."
            docker-compose restart $service
        fi
    done
}

# Check system resources
check_system_resources() {
    log "Checking system resources..."
    
    # CPU usage
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    if (( $(echo "$cpu_usage > $THRESHOLD_CPU" | bc -l) )); then
        warning "High CPU usage: ${cpu_usage}%"
    else
        success "CPU usage: ${cpu_usage}%"
    fi
    
    # Memory usage
    memory_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    if [ "$memory_usage" -gt $THRESHOLD_MEMORY ]; then
        warning "High memory usage: ${memory_usage}%"
    else
        success "Memory usage: ${memory_usage}%"
    fi
    
    # Disk usage
    disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt $THRESHOLD_DISK ]; then
        warning "High disk usage: ${disk_usage}%"
    else
        success "Disk usage: ${disk_usage}%"
    fi
}

# Check application health
check_application_health() {
    log "Checking application health..."
    
    # Check backend health
    if curl -f -s http://localhost:5000/health > /dev/null; then
        success "Backend is healthy"
    else
        error "Backend health check failed"
    fi
    
    # Check frontend
    if curl -f -s http://localhost:3000 > /dev/null; then
        success "Frontend is accessible"
    else
        error "Frontend is not accessible"
    fi
    
    # Check database connection
    if docker-compose exec -T postgres pg_isready -U chainlinkpro > /dev/null 2>&1; then
        success "Database is healthy"
    else
        error "Database health check failed"
    fi
    
    # Check Redis
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        success "Redis is healthy"
    else
        error "Redis health check failed"
    fi
}

# Check logs for errors
check_logs() {
    log "Checking logs for errors..."
    
    # Check for error logs in the last 5 minutes
    error_count=$(docker-compose logs --since=5m 2>&1 | grep -i error | wc -l)
    
    if [ "$error_count" -gt 0 ]; then
        warning "Found $error_count errors in logs"
        # Log recent errors
        docker-compose logs --since=5m 2>&1 | grep -i error | tail -10 >> $LOG_FILE
    else
        success "No recent errors found in logs"
    fi
}

# Check blockchain connectivity
check_blockchain() {
    log "Checking blockchain connectivity..."
    
    # Check if we can connect to Polygon Mumbai
    if curl -f -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        https://rpc-mumbai.maticvigil.com > /dev/null; then
        success "Blockchain connectivity is healthy"
    else
        warning "Blockchain connectivity issues detected"
    fi
}

# Clean up old logs
cleanup_logs() {
    log "Cleaning up old logs..."
    
    # Keep only last 7 days of logs
    find ./logs -name "*.log" -mtime +7 -delete
    
    # Clean Docker logs
    docker system prune -f --volumes
    
    success "Log cleanup completed"
}

# Send alert
send_alert() {
    local message="$1"
    local subject="ChainLinkPro Alert - $(date)"
    
    # Send email alert (requires mailutils)
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "$subject" $ALERT_EMAIL
    fi
    
    # Log alert
    error "ALERT: $message"
}

# Generate health report
generate_health_report() {
    log "Generating health report..."
    
    local report_file="./logs/health_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "ChainLinkPro Health Report - $(date)"
        echo "======================================"
        echo ""
        echo "Docker Services:"
        docker-compose ps
        echo ""
        echo "System Resources:"
        echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')"
        echo "Memory: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
        echo "Disk: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 ")"}')"
        echo ""
        echo "Recent Logs:"
        docker-compose logs --tail=50
    } > $report_file
    
    success "Health report generated: $report_file"
}

# Main monitoring function
main() {
    log "Starting ChainLinkPro monitoring..."
    
    # Create logs directory if it doesn't exist
    mkdir -p ./logs
    
    # Run all checks
    check_docker_services
    check_system_resources
    check_application_health
    check_logs
    check_blockchain
    
    # Cleanup
    cleanup_logs
    
    # Generate report
    generate_health_report
    
    success "Monitoring completed"
}

# Run main function
main "$@"