#!/bin/bash

# ChainLinkPro Deployment Script
# This script deploys the complete ChainLinkPro platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="chainlinkpro"
DOMAIN="chainlinkpro.io"
EMAIL="admin@chainlinkpro.io"
BACKUP_DIR="./backups"
LOG_DIR="./logs"

# Functions
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
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
    fi
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check available disk space (at least 10GB)
    available_space=$(df / | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 10485760 ]; then
        error "Insufficient disk space. At least 10GB required."
    fi
    
    # Check available memory (at least 4GB)
    available_memory=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [ "$available_memory" -lt 4096 ]; then
        warning "Low available memory. At least 4GB recommended."
    fi
    
    success "System requirements check passed"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    mkdir -p $BACKUP_DIR
    mkdir -p $LOG_DIR
    mkdir -p ./ssl
    mkdir -p ./monitoring/grafana/dashboards
    mkdir -p ./monitoring/grafana/datasources
    mkdir -p ./monitoring/logstash/pipeline
    mkdir -p ./uploads
    mkdir -p ./database
    
    success "Directories created"
}

# Generate SSL certificates
generate_ssl() {
    log "Generating SSL certificates..."
    
    if [ ! -f "./ssl/chainlinkpro.crt" ] || [ ! -f "./ssl/chainlinkpro.key" ]; then
        # Generate self-signed certificate for development
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ./ssl/chainlinkpro.key \
            -out ./ssl/chainlinkpro.crt \
            -subj "/C=US/ST=State/L=City/O=ChainLinkPro/CN=$DOMAIN"
        
        success "SSL certificates generated"
    else
        success "SSL certificates already exist"
    fi
}

# Create environment file
create_env() {
    log "Creating environment configuration..."
    
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# Database
DB_PASSWORD=$(openssl rand -base64 32)

# JWT Secret
JWT_SECRET=$(openssl rand -base64 64)

# Encryption Key
ENCRYPTION_KEY=$(openssl rand -base64 32)

# OpenAI API Key (set your own)
OPENAI_API_KEY=your_openai_api_key_here

# Private Key for blockchain transactions (set your own)
PRIVATE_KEY=your_private_key_here

# Grafana Password
GRAFANA_PASSWORD=$(openssl rand -base64 16)

# Contract Addresses (will be updated after deployment)
CONTRACT_ADDRESSES={}

# Domain
DOMAIN=$DOMAIN
EMAIL=$EMAIL
EOF
        success "Environment file created"
    else
        success "Environment file already exists"
    fi
}

# Create database initialization script
create_db_init() {
    log "Creating database initialization script..."
    
    cat > ./database/init.sql << 'EOF'
-- ChainLinkPro Database Initialization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    profile_nft_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    bio TEXT,
    location VARCHAR(255),
    email VARCHAR(255),
    website VARCHAR(255),
    skills TEXT[],
    social_links TEXT[],
    experience_years INTEGER DEFAULT 0,
    hourly_rate DECIMAL(10,2),
    total_earned DECIMAL(20,2) DEFAULT 0,
    reputation_score INTEGER DEFAULT 0,
    engagement_score INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connections table
CREATE TABLE IF NOT EXISTS connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    connected_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    connection_type VARCHAR(50) DEFAULT 'professional',
    status VARCHAR(20) DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, connected_user_id)
);

-- Content table
CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    content TEXT NOT NULL,
    media_url VARCHAR(500),
    tags TEXT[],
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    tip_amount DECIMAL(20,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    required_skills TEXT[],
    price DECIMAL(20,2) NOT NULL,
    duration_days INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    total_bookings INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(20,2) NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending',
    client_message TEXT,
    provider_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staking positions table
CREATE TABLE IF NOT EXISTS staking_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pool_id INTEGER NOT NULL,
    amount DECIMAL(20,2) NOT NULL,
    reward_debt DECIMAL(20,2) DEFAULT 0,
    staked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unlock_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- DAO proposals table
CREATE TABLE IF NOT EXISTS dao_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    requested_amount DECIMAL(20,2),
    beneficiary_address VARCHAR(42),
    status VARCHAR(20) DEFAULT 'pending',
    votes_for INTEGER DEFAULT 0,
    votes_against INTEGER DEFAULT 0,
    votes_abstain INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    voting_start TIMESTAMP WITH TIME ZONE,
    voting_end TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_connected_user_id ON connections(connected_user_id);
CREATE INDEX IF NOT EXISTS idx_content_author_id ON content(author_id);
CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at);
CREATE INDEX IF NOT EXISTS idx_services_provider_id ON services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_staking_positions_user_id ON staking_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_proposer_id ON dao_proposals(proposer_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EOF
    
    success "Database initialization script created"
}

# Deploy the application
deploy() {
    log "Deploying ChainLinkPro platform..."
    
    # Pull latest images
    docker-compose pull
    
    # Build and start services
    docker-compose up -d --build
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        success "Services are running"
    else
        error "Some services failed to start"
    fi
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create Prometheus configuration
    cat > ./monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:8080']

  - job_name: 'backend'
    static_configs:
      - targets: ['backend:5000']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
EOF

    # Create Grafana datasource
    mkdir -p ./monitoring/grafana/datasources
    cat > ./monitoring/grafana/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

    success "Monitoring configured"
}

# Create backup script
create_backup_script() {
    log "Creating backup script..."
    
    cat > ./scripts/backup.sh << 'EOF'
#!/bin/bash

# ChainLinkPro Backup Script
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T postgres pg_dump -U chainlinkpro chainlinkpro > $BACKUP_DIR/db_backup_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz ./uploads

# Backup configuration
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz .env ./nginx ./monitoring

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

    chmod +x ./scripts/backup.sh
    success "Backup script created"
}

# Main deployment function
main() {
    log "Starting ChainLinkPro deployment..."
    
    check_root
    check_requirements
    create_directories
    generate_ssl
    create_env
    create_db_init
    setup_monitoring
    create_backup_script
    deploy
    
    success "ChainLinkPro platform deployed successfully!"
    
    echo ""
    echo "🌐 Access URLs:"
    echo "  Frontend: https://$DOMAIN"
    echo "  API: https://$DOMAIN/api"
    echo "  Monitoring: https://$DOMAIN:3001 (Grafana)"
    echo "  Logs: https://$DOMAIN:5601 (Kibana)"
    echo ""
    echo "📊 Default Credentials:"
    echo "  Grafana: admin / $(grep GRAFANA_PASSWORD .env | cut -d '=' -f2)"
    echo ""
    echo "🔧 Management Commands:"
    echo "  View logs: docker-compose logs -f"
    echo "  Restart: docker-compose restart"
    echo "  Stop: docker-compose down"
    echo "  Backup: ./scripts/backup.sh"
    echo ""
    echo "📝 Next Steps:"
    echo "  1. Update DNS records to point to this server"
    echo "  2. Configure your domain SSL certificates"
    echo "  3. Set up monitoring alerts"
    echo "  4. Deploy smart contracts to mainnet"
    echo "  5. Launch marketing campaign"
}

# Run main function
main "$@"