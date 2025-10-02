#!/bin/bash
# GigChain.io VPS Deployment Script
# Automated deployment to DigitalOcean or any Ubuntu VPS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPS_IP=""
VPS_USER="root"
DOMAIN=""
GITHUB_REPO="https://github.com/Lento47/GigChain.git"

echo -e "${BLUE}🚀 GigChain.io VPS Deployment Script${NC}"
echo "=========================================="

# Check if required parameters are provided
if [ $# -lt 2 ]; then
    echo -e "${RED}❌ Usage: $0 <VPS_IP> <DOMAIN> [VPS_USER]${NC}"
    echo "Example: $0 192.168.1.100 gigchain.io"
    echo "Example: $0 192.168.1.100 gigchain.io ubuntu"
    exit 1
fi

VPS_IP=$1
DOMAIN=$2
VPS_USER=${3:-root}

echo -e "${YELLOW}📋 Deployment Configuration:${NC}"
echo "VPS IP: $VPS_IP"
echo "Domain: $DOMAIN"
echo "User: $VPS_USER"
echo ""

# Test SSH connection
echo -e "${BLUE}🔌 Testing SSH connection...${NC}"
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $VPS_USER@$VPS_IP exit 2>/dev/null; then
    echo -e "${RED}❌ Cannot connect to VPS. Please check:${NC}"
    echo "1. VPS IP address is correct"
    echo "2. SSH key is configured"
    echo "3. VPS is running and accessible"
    exit 1
fi
echo -e "${GREEN}✅ SSH connection successful${NC}"

# Upload and run setup script
echo -e "${BLUE}📦 Uploading setup script to VPS...${NC}"
scp vps-setup.sh $VPS_USER@$VPS_IP:/tmp/vps-setup.sh
echo -e "${GREEN}✅ Setup script uploaded${NC}"

# Run setup on VPS
echo -e "${BLUE}🔧 Running setup on VPS...${NC}"
ssh $VPS_USER@$VPS_IP << EOF
    chmod +x /tmp/vps-setup.sh
    /tmp/vps-setup.sh
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ VPS setup completed successfully${NC}"
else
    echo -e "${RED}❌ VPS setup failed${NC}"
    exit 1
fi

# Configure domain and SSL
echo -e "${BLUE}🌐 Configuring domain and SSL...${NC}"
ssh $VPS_USER@$VPS_IP << EOF
    # Update Nginx configuration with domain
    sed -i "s/gigchain.io/$DOMAIN/g" /etc/nginx/sites-available/gigchain
    sed -i "s/www.gigchain.io/www.$DOMAIN/g" /etc/nginx/sites-available/gigchain
    
    # Test Nginx configuration
    nginx -t
    
    # Restart Nginx
    systemctl restart nginx
    
    # Install SSL certificate
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Domain and SSL configured${NC}"
else
    echo -e "${YELLOW}⚠️  SSL configuration failed. You can configure it manually later.${NC}"
fi

# Final verification
echo -e "${BLUE}🔍 Verifying deployment...${NC}"
ssh $VPS_USER@$VPS_IP << EOF
    # Check services status
    systemctl status gigchain --no-pager -l
    systemctl status nginx --no-pager -l
    
    # Test API endpoint
    curl -f http://localhost:8000/health || echo "API health check failed"
    
    # Test frontend
    curl -f http://localhost/ || echo "Frontend check failed"
EOF

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Update your DNS records to point to $VPS_IP"
echo "2. Configure your .env file with OpenAI API key:"
echo "   ssh $VPS_USER@$VPS_IP"
echo "   nano /opt/gigchain/.env"
echo "   systemctl restart gigchain"
echo ""
echo -e "${BLUE}🌐 Your GigChain.io should be available at:${NC}"
echo "Frontend: https://$DOMAIN"
echo "API: https://$DOMAIN/api/full_flow"
echo "Health: https://$DOMAIN/health"
echo "Docs: https://$DOMAIN/docs"
echo ""
echo -e "${YELLOW}🔧 Useful Commands:${NC}"
echo "Check logs: ssh $VPS_USER@$VPS_IP 'journalctl -u gigchain -f'"
echo "Restart service: ssh $VPS_USER@$VPS_IP 'systemctl restart gigchain'"
echo "Update code: ssh $VPS_USER@$VPS_IP 'cd /opt/gigchain && git pull && systemctl restart gigchain'"
echo ""
echo -e "${GREEN}✅ GigChain.io is ready! 🚀${NC}"
