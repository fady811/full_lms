# React App Docker Deployment Guide

This document provides step-by-step instructions for deploying the React application to a remote server in an isolated Docker container.

## Server Information

- **Server IP**: 72.62.232.8
- **SSH User**: root
- **SSH Password**: zC.9rmp7tB49B@pN#fO4
- **Application Port**: 80
- **Container Name**: react_app_prod

## Prerequisites

### Local Machine
- Node.js and npm installed
- SSH access to the server
- `sshpass` installed (for automated SSH with password)

### Server
- Docker and Docker Compose will be installed automatically by the deployment script

## Deployment Methods

### Method 1: Automated Deployment Script (Recommended)

1. **Make the script executable** (Linux/Mac):
   ```bash
   chmod +x deploy.sh
   ```

2. **Run the deployment script**:
   ```bash
   ./deploy.sh
   ```

   For Windows (using Git Bash or WSL):
   ```bash
   bash deploy.sh
   ```

The script will:
- Test the local build
- Connect to the server
- Install Docker and Docker Compose if needed
- Transfer the application files
- Build and start the Docker container
- Verify the deployment

### Method 2: Manual Deployment

Follow these steps if you prefer manual deployment:

#### Step 1: Test Local Build

```bash
npm install
npm run build
```

Ensure the build completes without errors before proceeding.

#### Step 2: Connect to Server and Install Dependencies

```bash
ssh root@72.62.232.8
```

Once connected, run:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl start docker
systemctl enable docker
rm get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version
```

#### Step 3: Create Application Directory

```bash
mkdir -p /opt/react_app_prod
cd /opt/react_app_prod
```

#### Step 4: Transfer Application Files

From your local machine, create a tarball and transfer:

```bash
# Create archive (excluding node_modules and build)
tar --exclude='node_modules' \
    --exclude='build' \
    --exclude='.git' \
    --exclude='.DS_Store' \
    -czf react_app_deploy.tar.gz .

# Transfer to server (using sshpass for password)
sshpass -p "zC.9rmp7tB49B@pN#fO4" scp react_app_deploy.tar.gz root@72.62.232.8:/opt/react_app_prod/

# Or use SCP with password prompt
scp react_app_deploy.tar.gz root@72.62.232.8:/opt/react_app_prod/
```

On the server, extract:

```bash
cd /opt/react_app_prod
tar -xzf react_app_deploy.tar.gz
rm react_app_deploy.tar.gz
```

#### Step 5: Stop Existing Container (if any)

```bash
cd /opt/react_app_prod
docker-compose down
docker stop react_app_prod 2>/dev/null || true
docker rm react_app_prod 2>/dev/null || true
```

#### Step 6: Build and Start Container

```bash
cd /opt/react_app_prod

# Load environment variable from .env file
export REACT_APP_API_URL=$(grep REACT_APP_API_URL .env | cut -d '=' -f2)

# Build and start
REACT_APP_API_URL=$REACT_APP_API_URL docker-compose up -d --build
```

#### Step 7: Verify Deployment

```bash
# Check container status
docker ps --filter "name=react_app_prod"

# Check logs
docker logs react_app_prod

# Test health endpoint
curl http://localhost/health

# Test main application
curl http://localhost/
```

## Accessing the Application

Once deployed, access the application at:

**http://72.62.232.8**

## Container Management Commands

### View Logs
```bash
ssh root@72.62.232.8 'docker logs -f react_app_prod'
```

### Stop Container
```bash
ssh root@72.62.232.8 'cd /opt/react_app_prod && docker-compose down'
```

### Start Container
```bash
ssh root@72.62.232.8 'cd /opt/react_app_prod && docker-compose up -d'
```

### Restart Container
```bash
ssh root@72.62.232.8 'cd /opt/react_app_prod && docker-compose restart'
```

### Rebuild Container (after code changes)
```bash
ssh root@72.62.232.8 'cd /opt/react_app_prod && docker-compose up -d --build'
```

### Check Container Status
```bash
ssh root@72.62.232.8 'docker ps --filter "name=react_app_prod"'
```

### View Container Resource Usage
```bash
ssh root@72.62.232.8 'docker stats react_app_prod'
```

## Rollback Instructions

If the deployment fails or you need to rollback:

### Option 1: Stop and Remove Container

```bash
ssh root@72.62.232.8 << 'ENDSSH'
    cd /opt/react_app_prod
    docker-compose down
    docker stop react_app_prod 2>/dev/null || true
    docker rm react_app_prod 2>/dev/null || true
    echo "Container stopped and removed"
ENDSSH
```

### Option 2: Restore Previous Version

If you have a backup of the previous working version:

```bash
ssh root@72.62.232.8 << 'ENDSSH'
    cd /opt/react_app_prod
    # Stop current container
    docker-compose down
    
    # Restore previous files (if you have a backup)
    # tar -xzf backup.tar.gz
    
    # Rebuild with previous version
    docker-compose up -d --build
ENDSSH
```

### Option 3: Quick Rollback Script

Create a rollback script on the server:

```bash
ssh root@72.62.232.8 << 'ENDSSH'
    cat > /opt/react_app_prod/rollback.sh << 'EOF'
#!/bin/bash
cd /opt/react_app_prod
docker-compose down
echo "Rollback complete. Container stopped."
EOF
    chmod +x /opt/react_app_prod/rollback.sh
ENDSSH
```

Then run:
```bash
ssh root@72.62.232.8 '/opt/react_app_prod/rollback.sh'
```

## Troubleshooting

### Container Won't Start

1. **Check logs**:
   ```bash
   ssh root@72.62.232.8 'docker logs react_app_prod'
   ```

2. **Check if port 80 is already in use**:
   ```bash
   ssh root@72.62.232.8 'netstat -tulpn | grep :80'
   ```

3. **Check Docker daemon**:
   ```bash
   ssh root@72.62.232.8 'systemctl status docker'
   ```

### Build Fails

1. **Check build logs**:
   ```bash
   ssh root@72.62.232.8 'cd /opt/react_app_prod && docker-compose build --no-cache'
   ```

2. **Verify environment variables**:
   ```bash
   ssh root@72.62.232.8 'cd /opt/react_app_prod && cat .env'
   ```

### Application Not Accessible

1. **Check firewall**:
   ```bash
   ssh root@72.62.232.8 'iptables -L -n | grep 80'
   ```

2. **Check container is running**:
   ```bash
   ssh root@72.62.232.8 'docker ps | grep react_app_prod'
   ```

3. **Test from server**:
   ```bash
   ssh root@72.62.232.8 'curl http://localhost/health'
   ```

## Security Notes

⚠️ **Important Security Considerations**:

1. **Change SSH Password**: The password is hardcoded in scripts. Change it after deployment.
2. **Use SSH Keys**: Consider setting up SSH key authentication instead of passwords.
3. **Firewall**: Ensure only necessary ports are open.
4. **Environment Variables**: Keep `.env` file secure and don't commit sensitive data.
5. **Regular Updates**: Keep Docker and the base images updated.

## File Structure

```
/opt/react_app_prod/
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── .env
├── package.json
├── public/
├── src/
└── ... (other React app files)
```

## Network Isolation

The container runs in its own Docker network (`react_app_network`) to ensure complete isolation from other services on the server. The container only exposes port 80 and doesn't interfere with other applications.

## Production Checklist

- [ ] Local build succeeds (`npm run build`)
- [ ] Docker and Docker Compose installed on server
- [ ] Application files transferred to server
- [ ] Container builds successfully
- [ ] Container starts and runs
- [ ] Application accessible at http://72.62.232.8
- [ ] Health check endpoint responds
- [ ] All routes work correctly (SPA routing)
- [ ] Environment variables configured correctly
- [ ] Logs show no errors

## Support

For issues or questions:
1. Check container logs: `docker logs react_app_prod`
2. Check Docker Compose logs: `docker-compose logs`
3. Verify file permissions and ownership
4. Ensure all required files are present
