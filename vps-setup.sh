#!/bin/bash
# GigChain.io VPS Setup Script for Ubuntu 22.04
# Run this script on your DigitalOcean VPS

set -e

echo "🚀 Setting up GigChain.io VPS..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install dependencies
echo "🔧 Installing dependencies..."
apt install -y python3-pip python3-venv nginx git curl build-essential

# Install Node.js (LTS version)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
apt install -y nodejs

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
pip install gunicorn fastapi uvicorn python-dotenv

# Clone repository
echo "📁 Cloning GigChain repository..."
if [ ! -d "/opt/gigchain" ]; then
    git clone https://github.com/Lento47/GigChain.git /opt/gigchain
    cd /opt/gigchain
else
    cd /opt/gigchain
    git pull origin main
fi

# Create virtual environment
echo "🔧 Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Build frontend
echo "🎨 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Create systemd service
echo "⚙️ Creating systemd service..."
cat > /etc/systemd/system/gigchain.service << EOF
[Unit]
Description=GigChain FastAPI Service
After=network.target

[Service]
User=root
WorkingDirectory=/opt/gigchain
Environment=PATH=/opt/gigchain/venv/bin
ExecStart=/opt/gigchain/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable gigchain
systemctl start gigchain

# Configure Nginx
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/gigchain << EOF
server {
    listen 80;
    server_name gigchain.io www.gigchain.io;

    # Frontend static files
    location / {
        root /opt/gigchain/frontend/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Health check
    location /health {
        proxy_pass http://localhost:8000/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
EOF

# Enable site and restart Nginx
ln -sf /etc/nginx/sites-available/gigchain /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# Install Certbot for SSL
echo "🔒 Installing SSL certificates..."
apt install -y certbot python3-certbot-nginx

echo "✅ VPS setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your .env file with OpenAI API key:"
echo "   nano /opt/gigchain/.env"
echo ""
echo "2. Restart the service:"
echo "   systemctl restart gigchain"
echo ""
echo "3. Configure SSL (replace with your domain):"
echo "   certbot --nginx -d gigchain.io -d www.gigchain.io"
echo ""
echo "4. Check service status:"
echo "   systemctl status gigchain"
echo "   systemctl status nginx"
echo ""
echo "🌐 Your GigChain.io API should now be running!"
echo "Frontend: http://your-vps-ip"
echo "API: http://your-vps-ip/api/full_flow"
echo "Health: http://your-vps-ip/health"
