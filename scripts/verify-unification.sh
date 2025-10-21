#!/bin/bash

# GigChain Project Verification Script
# This script verifies that all components are properly unified

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
    echo "║                  GigChain Verification                       ║"
    echo "║              Project Unification Check                      ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check for old references
check_old_references() {
    log "Checking for old ChainLinkPro references..."
    
    local chainlink_refs=$(grep -r "ChainLinkPro" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build --exclude-dir=cache --exclude-dir=artifacts --exclude="scripts/unify-project.sh" --exclude="scripts/verify-unification.sh" 2>/dev/null | wc -l)
    
    if [ "$chainlink_refs" -gt 0 ]; then
        error "Found $chainlink_refs ChainLinkPro references:"
        grep -r "ChainLinkPro" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build --exclude-dir=cache --exclude-dir=artifacts 2>/dev/null
        return 1
    else
        success "No ChainLinkPro references found"
        return 0
    fi
}

# Check for old CLP references
check_old_clp_references() {
    log "Checking for old CLP references..."
    
    local clp_refs=$(grep -r "CLP" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build --exclude-dir=cache --exclude-dir=artifacts --exclude="scripts/unify-project.sh" --exclude="scripts/verify-unification.sh" 2>/dev/null | grep -v "GCH" | wc -l)
    
    if [ "$clp_refs" -gt 0 ]; then
        warning "Found $clp_refs CLP references (excluding GCH):"
        grep -r "CLP" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build --exclude-dir=cache --exclude-dir=artifacts 2>/dev/null | grep -v "GCH"
        return 1
    else
        success "No CLP references found"
        return 0
    fi
}

# Check for old chainlinkpro references
check_old_lowercase_references() {
    log "Checking for old chainlinkpro references..."
    
    local lowercase_refs=$(grep -r "chainlinkpro" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build --exclude-dir=cache --exclude-dir=artifacts --exclude="scripts/unify-project.sh" --exclude="scripts/verify-unification.sh" 2>/dev/null | wc -l)
    
    if [ "$lowercase_refs" -gt 0 ]; then
        error "Found $lowercase_refs chainlinkpro references:"
        grep -r "chainlinkpro" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build --exclude-dir=cache --exclude-dir=artifacts 2>/dev/null
        return 1
    else
        success "No chainlinkpro references found"
        return 0
    fi
}

# Check contract files
check_contract_files() {
    log "Checking contract files..."
    
    local contract_files=(
        "contracts/GigChainToken.sol"
        "contracts/GigChainSocial.sol"
        "contracts/GigChainDAO.sol"
        "contracts/GigChainMarketplace.sol"
        "contracts/GigChainDeFi.sol"
        "contracts/GigChainBounties.sol"
        "contracts/GigChainFeed.sol"
        "contracts/GigChainConnections.sol"
        "contracts/GigChainProfile.sol"
    )
    
    local missing_files=()
    
    for file in "${contract_files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        error "Missing contract files:"
        printf '%s\n' "${missing_files[@]}"
        return 1
    else
        success "All contract files present"
        return 0
    fi
}

# Check frontend files
check_frontend_files() {
    log "Checking frontend files..."
    
    local frontend_files=(
        "frontend/package.json"
        "frontend/src/App.tsx"
        "frontend/src/components/Layout/Layout.tsx"
        "frontend/src/components/Layout/Header.tsx"
        "frontend/src/components/Layout/Sidebar.tsx"
        "frontend/src/pages/Home/Home.tsx"
        "frontend/src/pages/Feed/Feed.tsx"
        "frontend/src/pages/Profile/Profile.tsx"
        "frontend/src/pages/Connections/Connections.tsx"
        "frontend/src/pages/Marketplace/Marketplace.tsx"
        "frontend/src/pages/DAO/DAO.tsx"
        "frontend/src/pages/Staking/Staking.tsx"
    )
    
    local missing_files=()
    
    for file in "${frontend_files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        error "Missing frontend files:"
        printf '%s\n' "${missing_files[@]}"
        return 1
    else
        success "All frontend files present"
        return 0
    fi
}

# Check infrastructure files
check_infrastructure_files() {
    log "Checking infrastructure files..."
    
    local infra_files=(
        "docker-compose.yml"
        "Dockerfile.backend"
        "frontend/Dockerfile"
        "nginx/nginx.conf"
        "scripts/deploy.sh"
        "scripts/monitor.sh"
        "scripts/update.sh"
        "install.sh"
        "INFRASTRUCTURE.md"
    )
    
    local missing_files=()
    
    for file in "${infra_files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        error "Missing infrastructure files:"
        printf '%s\n' "${missing_files[@]}"
        return 1
    else
        success "All infrastructure files present"
        return 0
    fi
}

# Check package.json consistency
check_package_consistency() {
    log "Checking package.json consistency..."
    
    local package_files=(
        "frontend/package.json"
        "contracts/package.json"
    )
    
    for file in "${package_files[@]}"; do
        if [ -f "$file" ]; then
            if grep -q "ChainLinkPro" "$file"; then
                error "Found ChainLinkPro reference in $file"
                return 1
            fi
            if grep -q "chainlinkpro" "$file"; then
                error "Found chainlinkpro reference in $file"
                return 1
            fi
        fi
    done
    
    success "Package files are consistent"
    return 0
}

# Check Docker configuration
check_docker_config() {
    log "Checking Docker configuration..."
    
    if [ -f "docker-compose.yml" ]; then
        if grep -q "chainlinkpro" "docker-compose.yml"; then
            error "Found chainlinkpro reference in docker-compose.yml"
            return 1
        fi
        if grep -q "ChainLinkPro" "docker-compose.yml"; then
            error "Found ChainLinkPro reference in docker-compose.yml"
            return 1
        fi
    fi
    
    success "Docker configuration is consistent"
    return 0
}

# Check environment files
check_env_files() {
    log "Checking environment files..."
    
    local env_files=(
        ".env.example"
        "frontend/.env.example"
    )
    
    for file in "${env_files[@]}"; do
        if [ -f "$file" ]; then
            if grep -q "ChainLinkPro" "$file"; then
                error "Found ChainLinkPro reference in $file"
                return 1
            fi
            if grep -q "chainlinkpro" "$file"; then
                error "Found chainlinkpro reference in $file"
                return 1
            fi
        fi
    done
    
    success "Environment files are consistent"
    return 0
}

# Main verification function
main() {
    print_banner
    
    local exit_code=0
    
    log "Starting GigChain project verification..."
    
    # Run all checks
    check_old_references || exit_code=1
    check_old_clp_references || exit_code=1
    check_old_lowercase_references || exit_code=1
    check_contract_files || exit_code=1
    check_frontend_files || exit_code=1
    check_infrastructure_files || exit_code=1
    check_package_consistency || exit_code=1
    check_docker_config || exit_code=1
    check_env_files || exit_code=1
    
    if [ $exit_code -eq 0 ]; then
        success "All verification checks passed! GigChain project is properly unified."
        echo -e "\n${GREEN}Project Status:${NC}"
        echo "✅ All references updated to GigChain"
        echo "✅ All files renamed consistently"
        echo "✅ All configurations updated"
        echo "✅ Project is ready for deployment"
    else
        error "Some verification checks failed. Please review the errors above."
        echo -e "\n${RED}Project Status:${NC}"
        echo "❌ Some references need to be updated"
        echo "❌ Some files may be missing or misconfigured"
        echo "❌ Project needs attention before deployment"
    fi
    
    exit $exit_code
}

# Run main function
main "$@"