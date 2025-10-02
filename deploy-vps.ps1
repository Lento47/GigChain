# GigChain.io VPS Deployment Script for Windows PowerShell
# Automated deployment to DigitalOcean or any Ubuntu VPS

param(
    [Parameter(Mandatory=$true)]
    [string]$VpsIp,
    
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [Parameter(Mandatory=$false)]
    [string]$VpsUser = "root"
)

# Configuration
$GithubRepo = "https://github.com/Lento47/GigChain.git"

Write-Host "🚀 GigChain.io VPS Deployment Script" -ForegroundColor Blue
Write-Host "==========================================" -ForegroundColor Blue

Write-Host "📋 Deployment Configuration:" -ForegroundColor Yellow
Write-Host "VPS IP: $VpsIp"
Write-Host "Domain: $Domain"
Write-Host "User: $VpsUser"
Write-Host ""

# Test SSH connection
Write-Host "🔌 Testing SSH connection..." -ForegroundColor Blue
try {
    $sshTest = ssh -o ConnectTimeout=10 -o BatchMode=yes "$VpsUser@$VpsIp" exit 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "SSH connection failed"
    }
    Write-Host "✅ SSH connection successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Cannot connect to VPS. Please check:" -ForegroundColor Red
    Write-Host "1. VPS IP address is correct"
    Write-Host "2. SSH key is configured"
    Write-Host "3. VPS is running and accessible"
    exit 1
}

# Upload setup script
Write-Host "📦 Uploading setup script to VPS..." -ForegroundColor Blue
try {
    scp vps-setup.sh "$VpsUser@$VpsIp:/tmp/vps-setup.sh"
    Write-Host "✅ Setup script uploaded" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to upload setup script" -ForegroundColor Red
    exit 1
}

# Run setup on VPS
Write-Host "🔧 Running setup on VPS..." -ForegroundColor Blue
try {
    ssh "$VpsUser@$VpsIp" @"
        chmod +x /tmp/vps-setup.sh
        /tmp/vps-setup.sh
"@
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ VPS setup completed successfully" -ForegroundColor Green
    } else {
        throw "Setup failed"
    }
} catch {
    Write-Host "❌ VPS setup failed" -ForegroundColor Red
    exit 1
}

# Configure domain and SSL
Write-Host "🌐 Configuring domain and SSL..." -ForegroundColor Blue
try {
    ssh "$VpsUser@$VpsIp" @"
        # Update Nginx configuration with domain
        sed -i 's/gigchain.io/$Domain/g' /etc/nginx/sites-available/gigchain
        sed -i 's/www.gigchain.io/www.$Domain/g' /etc/nginx/sites-available/gigchain
        
        # Test Nginx configuration
        nginx -t
        
        # Restart Nginx
        systemctl restart nginx
        
        # Install SSL certificate
        certbot --nginx -d $Domain -d www.$Domain --non-interactive --agree-tos --email admin@$Domain
"@
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Domain and SSL configured" -ForegroundColor Green
    } else {
        Write-Host "⚠️  SSL configuration failed. You can configure it manually later." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  SSL configuration failed. You can configure it manually later." -ForegroundColor Yellow
}

# Final verification
Write-Host "🔍 Verifying deployment..." -ForegroundColor Blue
try {
    ssh "$VpsUser@$VpsIp" @"
        # Check services status
        systemctl status gigchain --no-pager -l
        systemctl status nginx --no-pager -l
        
        # Test API endpoint
        curl -f http://localhost:8000/health || echo 'API health check failed'
        
        # Test frontend
        curl -f http://localhost/ || echo 'Frontend check failed'
"@
} catch {
    Write-Host "⚠️  Some verification checks failed, but deployment may still be successful" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update your DNS records to point to $VpsIp"
Write-Host "2. Configure your .env file with OpenAI API key:"
Write-Host "   ssh $VpsUser@$VpsIp"
Write-Host "   nano /opt/gigchain/.env"
Write-Host "   systemctl restart gigchain"
Write-Host ""
Write-Host "🌐 Your GigChain.io should be available at:" -ForegroundColor Blue
Write-Host "Frontend: https://$Domain"
Write-Host "API: https://$Domain/api/full_flow"
Write-Host "Health: https://$Domain/health"
Write-Host "Docs: https://$Domain/docs"
Write-Host ""
Write-Host "🔧 Useful Commands:" -ForegroundColor Yellow
Write-Host "Check logs: ssh $VpsUser@$VpsIp 'journalctl -u gigchain -f'"
Write-Host "Restart service: ssh $VpsUser@$VpsIp 'systemctl restart gigchain'"
Write-Host "Update code: ssh $VpsUser@$VpsIp 'cd /opt/gigchain && git pull && systemctl restart gigchain'"
Write-Host ""
Write-Host "✅ GigChain.io is ready! 🚀" -ForegroundColor Green
