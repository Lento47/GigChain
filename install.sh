#!/bin/bash

# ChainLinkPro Complete Installation Script
# This script installs and configures the entire ChainLinkPro platform

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
PROJECT_NAME="chainlinkpro"
DOMAIN="chainlinkpro.io"
EMAIL="admin@chainlinkpro.io"
INSTALL_DIR="/opt/chainlinkpro"

# Functions
print_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    ChainLinkPro Platform                     ║"
    echo "║              Decentralized Professional Network              ║"
    echo "║                                                              ║"
    echo "║  🌐 Social Network    🛒 Marketplace    💰 DeFi            ║"
    echo "║  🗳️  DAO Governance   🏆 Reputation     🔗 Blockchain      ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
    fi
}

# Update system packages
update_system() {
    log "Updating system packages..."
    
    apt-get update
    apt-get upgrade -y
    apt-get install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
    
    success "System packages updated"
}

# Install Docker
install_docker() {
    log "Installing Docker..."
    
    # Remove old versions
    apt-get remove -y docker docker-engine docker.io containerd runc
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Add current user to docker group
    usermod -aG docker $SUDO_USER
    
    success "Docker installed successfully"
}

# Install Docker Compose
install_docker_compose() {
    log "Installing Docker Compose..."
    
    # Download Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # Make it executable
    chmod +x /usr/local/bin/docker-compose
    
    # Create symlink
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    success "Docker Compose installed successfully"
}

# Install additional tools
install_tools() {
    log "Installing additional tools..."
    
    # Install Node.js
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # Install Python and pip
    apt-get install -y python3 python3-pip python3-venv
    
    # Install additional utilities
    apt-get install -y htop iotop nethogs tree jq bc mailutils
    
    success "Additional tools installed"
}

# Create project directory
create_project_directory() {
    log "Creating project directory..."
    
    mkdir -p $INSTALL_DIR
    cd $INSTALL_DIR
    
    # Clone repository (if not already present)
    if [ ! -d ".git" ]; then
        git clone https://github.com/chainlinkpro/chainlinkpro.git .
    fi
    
    success "Project directory created"
}

# Configure firewall
configure_firewall() {
    log "Configuring firewall..."
    
    # Install UFW if not present
    apt-get install -y ufw
    
    # Configure firewall rules
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 3000/tcp
    ufw allow 5000/tcp
    ufw allow 9090/tcp
    ufw allow 3001/tcp
    ufw allow 5601/tcp
    
    # Enable firewall
    ufw --force enable
    
    success "Firewall configured"
}

# Create systemd service
create_systemd_service() {
    log "Creating systemd service..."
    
    cat > /etc/systemd/system/chainlinkpro.service << EOF
[Unit]
Description=ChainLinkPro Platform
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd and enable service
    systemctl daemon-reload
    systemctl enable chainlinkpro.service
    
    success "Systemd service created"
}

# Create monitoring cron job
create_monitoring_cron() {
    log "Creating monitoring cron job..."
    
    # Create monitoring script
    cat > /usr/local/bin/chainlinkpro-monitor << 'EOF'
#!/bin/bash
cd /opt/chainlinkpro
./scripts/monitor.sh
EOF

    chmod +x /usr/local/bin/chainlinkpro-monitor
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/chainlinkpro-monitor") | crontab -
    
    success "Monitoring cron job created"
}

# Create backup cron job
create_backup_cron() {
    log "Creating backup cron job..."
    
    # Create backup script
    cat > /usr/local/bin/chainlinkpro-backup << 'EOF'
#!/bin/bash
cd /opt/chainlinkpro
./scripts/backup.sh
EOF

    chmod +x /usr/local/bin/chainlinkpro-backup
    
    # Add to crontab (daily at 2 AM)
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/chainlinkpro-backup") | crontab -
    
    success "Backup cron job created"
}

# Deploy the application
deploy_application() {
    log "Deploying ChainLinkPro application..."
    
    cd $INSTALL_DIR
    
    # Make scripts executable
    chmod +x scripts/*.sh
    
    # Run deployment script
    ./scripts/deploy.sh
    
    success "Application deployed successfully"
}

# Create management script
create_management_script() {
    log "Creating management script..."
    
    cat > /usr/local/bin/chainlinkpro << 'EOF'
#!/bin/bash

# ChainLinkPro Management Script
PROJECT_DIR="/opt/chainlinkpro"

case "$1" in
    start)
        echo "Starting ChainLinkPro..."
        cd $PROJECT_DIR
        docker-compose up -d
        ;;
    stop)
        echo "Stopping ChainLinkPro..."
        cd $PROJECT_DIR
        docker-compose down
        ;;
    restart)
        echo "Restarting ChainLinkPro..."
        cd $PROJECT_DIR
        docker-compose restart
        ;;
    status)
        echo "ChainLinkPro Status:"
        cd $PROJECT_DIR
        docker-compose ps
        ;;
    logs)
        echo "ChainLinkPro Logs:"
        cd $PROJECT_DIR
        docker-compose logs -f
        ;;
    update)
        echo "Updating ChainLinkPro..."
        cd $PROJECT_DIR
        ./scripts/update.sh
        ;;
    backup)
        echo "Creating backup..."
        cd $PROJECT_DIR
        ./scripts/backup.sh
        ;;
    monitor)
        echo "Running health check..."
        cd $PROJECT_DIR
        ./scripts/monitor.sh
        ;;
    *)
        echo "Usage: chainlinkpro {start|stop|restart|status|logs|update|backup|monitor}"
        exit 1
        ;;
esac
EOF

    chmod +x /usr/local/bin/chainlinkpro
    
    success "Management script created"
}

# Main installation function
main() {
    print_banner
    
    log "Starting ChainLinkPro installation..."
    
    check_root
    update_system
    install_docker
    install_docker_compose
    install_tools
    create_project_directory
    configure_firewall
    create_systemd_service
    create_monitoring_cron
    create_backup_cron
    create_management_script
    deploy_application
    
    success "ChainLinkPro installation completed successfully!"
    
    echo ""
    echo "🎉 Installation Complete!"
    echo ""
    echo "📋 Summary:"
    echo "  - Platform: ChainLinkPro"
    echo "  - Installation: $INSTALL_DIR"
    echo "  - Domain: $DOMAIN"
    echo "  - Services: All running"
    echo ""
    echo "🌐 Access URLs:"
    echo "  - Frontend: https://$DOMAIN"
    echo "  - API: https://$DOMAIN/api"
    echo "  - Monitoring: https://$DOMAIN:3001"
    echo "  - Logs: https://$DOMAIN:5601"
    echo ""
    echo "🔧 Management Commands:"
    echo "  - Start: chainlinkpro start"
    echo "  - Stop: chainlinkpro stop"
    echo "  - Status: chainlinkpro status"
    echo "  - Logs: chainlinkpro logs"
    echo "  - Update: chainlinkpro update"
    echo "  - Backup: chainlinkpro backup"
    echo "  - Monitor: chainlinkpro monitor"
    echo ""
    echo "📝 Next Steps:"
    echo "  1. Configure your domain DNS"
    echo "  2. Set up SSL certificates"
    echo "  3. Deploy smart contracts"
    echo "  4. Configure monitoring alerts"
    echo "  5. Launch marketing campaign"
    echo ""
    echo "🚀 ChainLinkPro is ready to revolutionize professional networking!"
}

# Run main function
main "$@"