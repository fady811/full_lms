#!/bin/bash

# React App Docker Deployment Script
# Server: 72.62.232.8
# This script deploys the React app to a remote server in an isolated Docker container

set -e  # Exit on any error

# Configuration
SERVER_IP="72.62.232.8"
SSH_USER="root"
SSH_PASSWORD="zC.9rmp7tB49B@pN#fO4"
APP_DIR="/opt/react_app_prod"
CONTAINER_NAME="react_app_prod"

echo "=========================================="
echo "React App Docker Deployment"
echo "=========================================="

# Step 1: Test local build first
echo ""
echo "Step 1: Testing local production build..."
if npm run build; then
    echo "✓ Local build successful"
else
    echo "✗ Local build failed. Aborting deployment."
    exit 1
fi

# Step 2: Connect to server and install dependencies
echo ""
echo "Step 2: Connecting to server and installing dependencies..."
sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" << 'ENDSSH'
    echo "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        echo "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl start docker
        systemctl enable docker
        rm get-docker.sh
    else
        echo "✓ Docker is already installed"
    fi

    echo "Checking Docker Compose installation..."
    if ! command -v docker-compose &> /dev/null; then
        echo "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    else
        echo "✓ Docker Compose is already installed"
    fi

    # Install sshpass if not available (for file transfer)
    if ! command -v sshpass &> /dev/null; then
        if command -v yum &> /dev/null; then
            yum install -y sshpass
        elif command -v apt-get &> /dev/null; then
            apt-get update && apt-get install -y sshpass
        fi
    fi
ENDSSH

# Step 3: Create application directory on server
echo ""
echo "Step 3: Creating application directory on server..."
sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "mkdir -p $APP_DIR"

# Step 4: Transfer files to server
echo ""
echo "Step 4: Transferring application files to server..."
# Create a temporary archive excluding node_modules and build
tar --exclude='node_modules' \
    --exclude='build' \
    --exclude='.git' \
    --exclude='.DS_Store' \
    -czf /tmp/react_app_deploy.tar.gz .

# Transfer the archive
sshpass -p "$SSH_PASSWORD" scp -o StrictHostKeyChecking=no /tmp/react_app_deploy.tar.gz "$SSH_USER@$SERVER_IP:$APP_DIR/"

# Extract on server
sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "cd $APP_DIR && tar -xzf react_app_deploy.tar.gz && rm react_app_deploy.tar.gz"

# Clean up local archive
rm /tmp/react_app_deploy.tar.gz

# Step 5: Stop and remove existing container if it exists
echo ""
echo "Step 5: Stopping existing container if it exists..."
sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" << ENDSSH
    cd $APP_DIR
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}\$"; then
        echo "Stopping and removing existing container..."
        docker stop $CONTAINER_NAME 2>/dev/null || true
        docker rm $CONTAINER_NAME 2>/dev/null || true
    else
        echo "No existing container found"
    fi
ENDSSH

# Step 6: Build and run Docker container
echo ""
echo "Step 6: Building and starting Docker container..."
sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" << ENDSSH
    cd $APP_DIR
    
    # Load environment variables
    export REACT_APP_API_URL=\$(grep REACT_APP_API_URL .env | cut -d '=' -f2 || echo "http://72.62.232.8/")
    
    # Build and start with docker-compose
    docker-compose down 2>/dev/null || true
    REACT_APP_API_URL=\$REACT_APP_API_URL docker-compose up -d --build
    
    # Wait for container to be healthy
    echo "Waiting for container to be ready..."
    sleep 5
    
    # Check container status
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}\$"; then
        echo "✓ Container is running"
        docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    else
        echo "✗ Container failed to start"
        docker logs $CONTAINER_NAME
        exit 1
    fi
ENDSSH

# Step 7: Verify deployment
echo ""
echo "Step 7: Verifying deployment..."
sleep 3
if curl -f -s "http://$SERVER_IP/health" > /dev/null; then
    echo "✓ Application is accessible at http://$SERVER_IP"
else
    echo "⚠ Warning: Health check failed, but container may still be starting"
    echo "Check logs with: ssh $SSH_USER@$SERVER_IP 'docker logs $CONTAINER_NAME'"
fi

echo ""
echo "=========================================="
echo "Deployment completed!"
echo "=========================================="
echo "Application URL: http://$SERVER_IP"
echo ""
echo "Useful commands:"
echo "  View logs: ssh $SSH_USER@$SERVER_IP 'docker logs -f $CONTAINER_NAME'"
echo "  Stop app: ssh $SSH_USER@$SERVER_IP 'cd $APP_DIR && docker-compose down'"
echo "  Restart app: ssh $SSH_USER@$SERVER_IP 'cd $APP_DIR && docker-compose restart'"
