#!/bin/bash

# ITEDA Solutions Platform Deployment Script
# Usage: ./scripts/deploy.sh [environment]
# Environments: development, staging, production

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="iteda-solutions-platform"
DOMAIN="smartdryers.itedasolutions.com"

echo "🚀 Deploying ITEDA Solutions Platform to $ENVIRONMENT environment..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "All dependencies are installed."
}

# Setup environment variables
setup_environment() {
    print_status "Setting up environment for $ENVIRONMENT..."
    
    if [ ! -f ".env.$ENVIRONMENT" ]; then
        print_error "Environment file .env.$ENVIRONMENT not found!"
        exit 1
    fi
    
    # Copy environment file
    cp ".env.$ENVIRONMENT" ".env"
    print_success "Environment variables loaded from .env.$ENVIRONMENT"
}

# Build the application
build_application() {
    print_status "Building the application..."
    
    # Install dependencies
    npm ci
    
    # Build the Next.js application
    npm run build
    
    print_success "Application built successfully."
}

# Setup SSL certificates
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        # Check if certificates already exist
        if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
            print_status "Generating SSL certificates with Let's Encrypt..."
            
            # Install certbot if not present
            if ! command -v certbot &> /dev/null; then
                print_status "Installing Certbot..."
                sudo apt update
                sudo apt install -y certbot python3-certbot-nginx
            fi
            
            # Generate certificates
            sudo certbot certonly --standalone \
                -d $DOMAIN \
                -d api.$DOMAIN \
                --email admin@itedasolutions.com \
                --agree-tos \
                --non-interactive
                
            print_success "SSL certificates generated successfully."
        else
            print_success "SSL certificates already exist."
        fi
    elif [ "$ENVIRONMENT" = "development" ]; then
        # Setup local SSL with mkcert
        if ! command -v mkcert &> /dev/null; then
            print_warning "mkcert not found. Installing..."
            
            # Install mkcert based on OS
            if [[ "$OSTYPE" == "darwin"* ]]; then
                brew install mkcert
            elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
                wget -O mkcert https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
                chmod +x mkcert
                sudo mv mkcert /usr/local/bin/
            fi
        fi
        
        # Create local CA and certificates
        mkcert -install
        mkcert "*.itedasolutions.local" "itedasolutions.local"
        
        print_success "Local SSL certificates generated."
    fi
}

# Deploy with Docker
deploy_docker() {
    print_status "Deploying with Docker..."
    
    # Stop existing containers
    docker-compose down --remove-orphans
    
    # Build and start containers
    docker-compose up --build -d
    
    # Wait for services to be ready
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_success "Services are running successfully."
    else
        print_error "Some services failed to start. Check logs with: docker-compose logs"
        exit 1
    fi
}

# Setup Nginx (for non-Docker deployment)
setup_nginx() {
    if [ "$ENVIRONMENT" = "production" ] && [ ! -f "/.dockerenv" ]; then
        print_status "Setting up Nginx configuration..."
        
        # Create Nginx configuration
        sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null << EOF
# Main application
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}

# API subdomain
server {
    listen 80;
    server_name api.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:3000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

        # Enable the site
        sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
        
        # Test Nginx configuration
        sudo nginx -t
        
        # Reload Nginx
        sudo systemctl reload nginx
        
        print_success "Nginx configured successfully."
    fi
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Wait for database to be ready
    sleep 10
    
    # Run migrations
    npm run db:push
    
    # Seed database if needed
    if [ "$ENVIRONMENT" != "production" ]; then
        npm run db:seed-all
    fi
    
    print_success "Database migrations completed."
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "http://localhost:3000/api/health" > /dev/null; then
            print_success "Health check passed!"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts - waiting for service..."
        sleep 5
        ((attempt++))
    done
    
    print_error "Health check failed after $max_attempts attempts."
    return 1
}

# Main deployment function
main() {
    print_status "Starting deployment of ITEDA Solutions Platform..."
    print_status "Environment: $ENVIRONMENT"
    print_status "Domain: $DOMAIN"
    
    check_dependencies
    setup_environment
    build_application
    
    if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "development" ]; then
        setup_ssl
    fi
    
    if [ -f "docker-compose.yml" ]; then
        deploy_docker
    else
        setup_nginx
        
        # Start the application
        print_status "Starting the application..."
        npm run start:custom &
        
        # Save PID for later use
        echo $! > app.pid
    fi
    
    run_migrations
    
    if health_check; then
        print_success "🎉 Deployment completed successfully!"
        print_success "Application is running at:"
        
        if [ "$ENVIRONMENT" = "development" ]; then
            print_success "  Main: https://smartdryers.itedasolutions.local:3000"
            print_success "  API:  https://api.smartdryers.itedasolutions.local:3000"
        else
            print_success "  Main: https://$DOMAIN"
            print_success "  API:  https://api.$DOMAIN"
        fi
    else
        print_error "Deployment failed during health check."
        exit 1
    fi
}

# Run main function
main "$@"
