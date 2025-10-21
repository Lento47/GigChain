#!/bin/bash

# GigChain Project Unification Script
# This script unifies all project components and ensures consistency

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
print_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    GigChain Unification                      ║"
    echo "║              Decentralized Professional Network              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check if running from project root
check_project_root() {
    if [ ! -f "docker-compose.yml" ] || [ ! -d "contracts" ] || [ ! -d "frontend" ]; then
        error "Please run this script from the project root directory"
        exit 1
    fi
}

# Update all file references
update_references() {
    log "Updating all file references..."
    
    # Update contract references
    find contracts/ -name "*.sol" -exec sed -i 's/ChainLinkPro/GigChain/g' {} \;
    find contracts/ -name "*.sol" -exec sed -i 's/CLP/GCH/g' {} \;
    
    # Update frontend references
    find frontend/ -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.json" | xargs sed -i 's/ChainLinkPro/GigChain/g'
    find frontend/ -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.json" | xargs sed -i 's/CLP/GCH/g'
    
    # Update backend references
    find . -name "*.py" -o -name "*.txt" -o -name "*.env*" | xargs sed -i 's/ChainLinkPro/GigChain/g'
    find . -name "*.py" -o -name "*.txt" -o -name "*.env*" | xargs sed -i 's/CLP/GCH/g'
    
    # Update infrastructure references
    find . -name "*.yml" -o -name "*.yaml" -o -name "*.sh" -o -name "*.md" -o -name "*.conf" | xargs sed -i 's/ChainLinkPro/GigChain/g'
    find . -name "*.yml" -o -name "*.yaml" -o -name "*.sh" -o -name "*.md" -o -name "*.conf" | xargs sed -i 's/CLP/GCH/g'
    find . -name "*.yml" -o -name "*.yaml" -o -name "*.sh" -o -name "*.md" -o -name "*.conf" | xargs sed -i 's/chainlinkpro/gigchain/g'
    
    success "All references updated successfully"
}

# Rename files
rename_files() {
    log "Renaming files to match new naming convention..."
    
    # Rename contract files
    find contracts/ -name "ChainLinkPro*.sol" -exec sh -c 'mv "$1" "$(echo "$1" | sed "s/ChainLinkPro/GigChain/g")"' _ {} \;
    
    # Rename script files
    find contracts/scripts/ -name "*chainlinkpro*" -exec sh -c 'mv "$1" "$(echo "$1" | sed "s/chainlinkpro/gigchain/g")"' _ {} \;
    
    success "Files renamed successfully"
}

# Update package.json files
update_package_files() {
    log "Updating package.json files..."
    
    # Frontend package.json
    if [ -f "frontend/package.json" ]; then
        sed -i 's/chainlinkpro-frontend/gigchain-frontend/g' frontend/package.json
        sed -i 's/ChainLinkPro/GigChain/g' frontend/package.json
    fi
    
    # Contracts package.json
    if [ -f "contracts/package.json" ]; then
        sed -i 's/chainlinkpro/gigchain/g' contracts/package.json
        sed -i 's/ChainLinkPro/GigChain/g' contracts/package.json
    fi
    
    success "Package files updated"
}

# Update Docker configurations
update_docker_configs() {
    log "Updating Docker configurations..."
    
    # Update docker-compose.yml
    if [ -f "docker-compose.yml" ]; then
        sed -i 's/chainlinkpro-network/gigchain-network/g' docker-compose.yml
        sed -i 's/chainlinkpro/gigchain/g' docker-compose.yml
    fi
    
    # Update Dockerfiles
    find . -name "Dockerfile*" -exec sed -i 's/chainlinkpro/gigchain/g' {} \;
    
    success "Docker configurations updated"
}

# Update environment files
update_env_files() {
    log "Updating environment files..."
    
    # Update .env.example
    if [ -f ".env.example" ]; then
        sed -i 's/chainlinkpro/gigchain/g' .env.example
        sed -i 's/CLP/GCH/g' .env.example
    fi
    
    # Update all .env files
    find . -name ".env*" -exec sed -i 's/chainlinkpro/gigchain/g' {} \;
    find . -name ".env*" -exec sed -i 's/CLP/GCH/g' {} \;
    
    success "Environment files updated"
}

# Update documentation
update_documentation() {
    log "Updating documentation..."
    
    # Update README files
    find . -name "README.md" -exec sed -i 's/ChainLinkPro/GigChain/g' {} \;
    find . -name "README.md" -exec sed -i 's/CLP/GCH/g' {} \;
    find . -name "README.md" -exec sed -i 's/chainlinkpro/gigchain/g' {} \;
    
    # Update other markdown files
    find . -name "*.md" -exec sed -i 's/ChainLinkPro/GigChain/g' {} \;
    find . -name "*.md" -exec sed -i 's/CLP/GCH/g' {} \;
    find . -name "*.md" -exec sed -i 's/chainlinkpro/gigchain/g' {} \;
    
    success "Documentation updated"
}

# Verify changes
verify_changes() {
    log "Verifying changes..."
    
    # Check for remaining ChainLinkPro references
    local remaining_refs=$(grep -r "ChainLinkPro" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build | wc -l)
    
    if [ "$remaining_refs" -gt 0 ]; then
        warning "Found $remaining_refs remaining ChainLinkPro references:"
        grep -r "ChainLinkPro" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build
    else
        success "No remaining ChainLinkPro references found"
    fi
    
    # Check for remaining CLP references
    local remaining_clp=$(grep -r "CLP" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build | grep -v "GCH" | wc -l)
    
    if [ "$remaining_clp" -gt 0 ]; then
        warning "Found $remaining_clp remaining CLP references (excluding GCH):"
        grep -r "CLP" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build | grep -v "GCH"
    else
        success "No remaining CLP references found"
    fi
}

# Clean up temporary files
cleanup() {
    log "Cleaning up temporary files..."
    
    # Remove any backup files created by sed
    find . -name "*.bak" -delete
    find . -name "*~" -delete
    
    success "Cleanup completed"
}

# Main function
main() {
    print_banner
    
    log "Starting GigChain project unification..."
    
    check_project_root
    update_references
    rename_files
    update_package_files
    update_docker_configs
    update_env_files
    update_documentation
    verify_changes
    cleanup
    
    success "GigChain project unification completed successfully!"
    
    echo -e "\n${GREEN}Next steps:${NC}"
    echo "1. Review the changes made"
    echo "2. Test the application: docker-compose up -d"
    echo "3. Deploy contracts: cd contracts && npx hardhat run scripts/deploy-complete-platform.ts --network mumbai"
    echo "4. Start development: cd frontend && npm start"
    
    echo -e "\n${BLUE}Project is now unified under GigChain branding!${NC}"
}

# Run main function
main "$@"