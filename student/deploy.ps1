# React App Docker Deployment Script for Windows PowerShell
# Server: 72.62.232.8
# This script deploys the React app to a remote server in an isolated Docker container

$ErrorActionPreference = "Stop"

# Configuration
$SERVER_IP = "72.62.232.8"
$SSH_USER = "root"
$SSH_PASSWORD = "zC.9rmp7tB49B@pN#fO4"
$APP_DIR = "/opt/react_app_prod"
$CONTAINER_NAME = "react_app_prod"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "React App Docker Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Step 1: Test local build first
Write-Host ""
Write-Host "Step 1: Testing local production build..." -ForegroundColor Yellow
try {
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Local build successful" -ForegroundColor Green
    } else {
        Write-Host "✗ Local build failed. Aborting deployment." -ForegroundColor Red
        Write-Host $buildResult
        exit 1
    }
} catch {
    Write-Host "✗ Build error: $_" -ForegroundColor Red
    exit 1
}

# Check if plink (PuTTY) or ssh is available
$hasSSH = Get-Command ssh -ErrorAction SilentlyContinue
$hasPlink = Get-Command plink -ErrorAction SilentlyContinue

if (-not $hasSSH -and -not $hasPlink) {
    Write-Host "Error: SSH client not found. Please install OpenSSH or PuTTY." -ForegroundColor Red
    exit 1
}

# Function to execute SSH command with proper escaping
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [string]$Password = $SSH_PASSWORD
    )
    
    if ($hasSSH) {
        # Using OpenSSH (Windows 10+)
        if (Get-Command sshpass -ErrorAction SilentlyContinue) {
            # Escape the command for bash
            $escapedCommand = $Command -replace '`', '\`' -replace '\$', '\$' -replace '"', '\"'
            bash -c "sshpass -p '$Password' ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SERVER_IP} `"$escapedCommand`""
        } else {
            Write-Host "Note: sshpass not found. You may need to enter password manually." -ForegroundColor Yellow
            Write-Host "You can install sshpass via: choco install sshpass (if Chocolatey is installed)" -ForegroundColor Yellow
            Write-Host "Or use SSH keys for passwordless authentication." -ForegroundColor Yellow
            $escapedCommand = $Command -replace '`', '\`' -replace '\$', '\$' -replace '"', '\"'
            ssh -o StrictHostKeyChecking=no "${SSH_USER}@${SERVER_IP}" $escapedCommand
        }
    } else {
        # Using PuTTY plink
        $plinkCommand = "plink -ssh -pw $Password ${SSH_USER}@${SERVER_IP} `"$Command`""
        Invoke-Expression $plinkCommand
    }
}

# Step 2: Connect to server and install dependencies
Write-Host ""
Write-Host "Step 2: Connecting to server and installing dependencies..." -ForegroundColor Yellow

# Build the install script - use single quotes to prevent PowerShell parsing
$installScript = @'
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
'@

Invoke-SSHCommand -Command $installScript

# Step 3: Create application directory
Write-Host ""
Write-Host "Step 3: Creating application directory on server..." -ForegroundColor Yellow
Invoke-SSHCommand -Command "mkdir -p $APP_DIR"

# Step 4: Transfer files to server
Write-Host ""
Write-Host "Step 4: Transferring application files to server..." -ForegroundColor Yellow

# Create temporary archive
$tempArchive = "$env:TEMP\react_app_deploy.tar.gz"
Write-Host "Creating archive..." -ForegroundColor Gray

# Use 7-Zip or tar if available
if (Get-Command tar -ErrorAction SilentlyContinue) {
    # Windows 10+ has tar
    tar --exclude='node_modules' --exclude='build' --exclude='.git' --exclude='.DS_Store' -czf $tempArchive .
} elseif (Get-Command 7z -ErrorAction SilentlyContinue) {
    # Use 7-Zip
    $tarFile = "$env:TEMP\react_app_deploy.tar"
    7z a -ttar $tarFile * -xr!node_modules -xr!build -xr!.git
    7z a -tgzip $tempArchive $tarFile
    Remove-Item $tarFile -ErrorAction SilentlyContinue
} else {
    Write-Host "Error: tar or 7-Zip not found. Please install one of them." -ForegroundColor Red
    exit 1
}

# Transfer using SCP
Write-Host "Transferring archive to server..." -ForegroundColor Gray
if (Get-Command scp -ErrorAction SilentlyContinue) {
    if (Get-Command sshpass -ErrorAction SilentlyContinue) {
        bash -c "sshpass -p '$SSH_PASSWORD' scp -o StrictHostKeyChecking=no $tempArchive ${SSH_USER}@${SERVER_IP}:${APP_DIR}/"
    } else {
        Write-Host "Please enter password when prompted:" -ForegroundColor Yellow
        scp -o StrictHostKeyChecking=no $tempArchive "${SSH_USER}@${SERVER_IP}:${APP_DIR}/"
    }
} else {
    Write-Host "Error: SCP not found. Please install OpenSSH." -ForegroundColor Red
    exit 1
}

# Extract on server
Write-Host "Extracting files on server..." -ForegroundColor Gray
$extractCommand = "cd $APP_DIR; tar -xzf react_app_deploy.tar.gz; rm react_app_deploy.tar.gz"
Invoke-SSHCommand -Command $extractCommand

# Clean up local archive
Remove-Item $tempArchive -ErrorAction SilentlyContinue

# Step 5: Stop existing container
Write-Host ""
Write-Host "Step 5: Stopping existing container if it exists..." -ForegroundColor Yellow
# Use single quotes and replace variables manually
$stopScript = @'
cd /opt/react_app_prod
if docker ps -a --format '{{.Names}}' | grep -q '^react_app_prod$'; then
    echo "Stopping and removing existing container..."
    docker stop react_app_prod 2>/dev/null || true
    docker rm react_app_prod 2>/dev/null || true
else
    echo "No existing container found"
fi
'@
Invoke-SSHCommand -Command $stopScript

# Step 6: Build and run Docker container
Write-Host ""
Write-Host "Step 6: Building and starting Docker container..." -ForegroundColor Yellow
# Use single quotes and replace variables manually
$deployScript = @'
cd /opt/react_app_prod
export REACT_APP_API_URL=$(grep REACT_APP_API_URL .env | cut -d '=' -f2 || echo "http://72.62.232.8/")
docker-compose down 2>/dev/null || true
REACT_APP_API_URL=$REACT_APP_API_URL docker-compose up -d --build
echo "Waiting for container to be ready..."
sleep 5
if docker ps --format '{{.Names}}' | grep -q '^react_app_prod$'; then
    echo "✓ Container is running"
    docker ps --filter "name=react_app_prod" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo "✗ Container failed to start"
    docker logs react_app_prod
    exit 1
fi
'@
Invoke-SSHCommand -Command $deployScript

# Step 7: Verify deployment
Write-Host ""
Write-Host "Step 7: Verifying deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
try {
    $response = Invoke-WebRequest -Uri "http://$SERVER_IP/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Application is accessible at http://$SERVER_IP" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ Warning: Health check failed, but container may still be starting" -ForegroundColor Yellow
    Write-Host "Check logs with: ssh $SSH_USER@$SERVER_IP 'docker logs $CONTAINER_NAME'" -ForegroundColor Gray
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Application URL: http://$SERVER_IP" -ForegroundColor Cyan
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  View logs: ssh $SSH_USER@$SERVER_IP 'docker logs -f $CONTAINER_NAME'" -ForegroundColor Gray
Write-Host "  Stop app: ssh $SSH_USER@$SERVER_IP 'cd $APP_DIR; docker-compose down'" -ForegroundColor Gray
Write-Host "  Restart app: ssh $SSH_USER@$SERVER_IP 'cd $APP_DIR; docker-compose restart'" -ForegroundColor Gray
