# Step-by-Step Deployment Commands

This document provides all commands needed to deploy the React application manually, step by step.

## Server Information
- **IP**: 72.62.232.8
- **User**: root
- **Password**: zC.9rmp7tB49B@pN#fO4
- **Port**: 80

---

## Step 1: Test Local Build

**On your local machine:**

```bash
npm install
npm run build
```

**Expected output**: Build should complete without errors, creating a `build/` directory.

---

## Step 2: Connect to Server and Install Docker

**Connect to server:**

```bash
ssh root@72.62.232.8
# Enter password when prompted: zC.9rmp7tB49B@pN#fO4
```

**Once connected, install Docker:**

```bash
# Update system packages (if needed)
yum update -y
# or for Debian/Ubuntu:
# apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl start docker
systemctl enable docker
rm get-docker.sh

# Verify Docker installation
docker --version
```

**Install Docker Compose:**

```bash
# Download Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make it executable
chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

**Exit SSH session:**

```bash
exit
```

---

## Step 3: Create Application Directory on Server

**Connect to server:**

```bash
ssh root@72.62.232.8
```

**Create directory:**

```bash
mkdir -p /opt/react_app_prod
cd /opt/react_app_prod
```

**Exit SSH:**

```bash
exit
```

---

## Step 4: Transfer Application Files

**On your local machine, create a compressed archive:**

```bash
# Exclude node_modules, build, and git files
tar --exclude='node_modules' \
    --exclude='build' \
    --exclude='.git' \
    --exclude='.DS_Store' \
    -czf react_app_deploy.tar.gz .
```

**Transfer to server using SCP:**

**Option A: Using sshpass (if installed):**
```bash
sshpass -p "zC.9rmp7tB49B@pN#fO4" scp react_app_deploy.tar.gz root@72.62.232.8:/opt/react_app_prod/
```

**Option B: Using SCP (will prompt for password):**
```bash
scp react_app_deploy.tar.gz root@72.62.232.8:/opt/react_app_prod/
# Enter password: zC.9rmp7tB49B@pN#fO4
```

**Extract files on server:**

```bash
ssh root@72.62.232.8
cd /opt/react_app_prod
tar -xzf react_app_deploy.tar.gz
rm react_app_deploy.tar.gz
ls -la  # Verify files are present
```

---

## Step 5: Stop Existing Container (if any)

**On the server:**

```bash
cd /opt/react_app_prod

# Stop and remove existing container if it exists
docker stop react_app_prod 2>/dev/null || true
docker rm react_app_prod 2>/dev/null || true

# Stop docker-compose services
docker-compose down 2>/dev/null || true
```

---

## Step 6: Build and Start Docker Container

**On the server:**

```bash
cd /opt/react_app_prod

# Load environment variable from .env file
export REACT_APP_API_URL=$(grep REACT_APP_API_URL .env | cut -d '=' -f2)

# Verify the environment variable
echo "REACT_APP_API_URL=$REACT_APP_API_URL"

# Build and start the container
REACT_APP_API_URL=$REACT_APP_API_URL docker-compose up -d --build
```

**Expected output:**
- Docker build process will start
- React app will be built inside the container
- Nginx container will start
- Container will be running on port 80

---

## Step 7: Verify Deployment

**Check container status:**

```bash
docker ps --filter "name=react_app_prod"
```

**Expected output:**
```
CONTAINER ID   IMAGE                STATUS         PORTS                NAMES
xxxxxxxxxxxxx  react_app_prod:latest   Up X minutes   0.0.0.0:80->80/tcp   react_app_prod
```

**Check container logs:**

```bash
docker logs react_app_prod
```

**Test health endpoint:**

```bash
curl http://localhost/health
```

**Expected output:**
```
healthy
```

**Test main application:**

```bash
curl http://localhost/
```

**Expected output:** HTML content of the React app

**Test from your local machine:**

Open browser and navigate to:
```
http://72.62.232.8
```

---

## Container Management Commands

### View Real-time Logs
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

### Enter Container Shell (for debugging)
```bash
ssh root@72.62.232.8 'docker exec -it react_app_prod sh'
```

### View Nginx Configuration Inside Container
```bash
ssh root@72.62.232.8 'docker exec react_app_prod cat /etc/nginx/conf.d/default.conf'
```

---

## Rollback Commands

### Quick Rollback (Stop Container)

```bash
ssh root@72.62.232.8 << 'ENDSSH'
    cd /opt/react_app_prod
    docker-compose down
    docker stop react_app_prod 2>/dev/null || true
    docker rm react_app_prod 2>/dev/null || true
    echo "Container stopped and removed"
ENDSSH
```

### Complete Rollback (Remove Everything)

```bash
ssh root@72.62.232.8 << 'ENDSSH'
    cd /opt/react_app_prod
    docker-compose down
    docker stop react_app_prod 2>/dev/null || true
    docker rm react_app_prod 2>/dev/null || true
    docker rmi react_app_prod:latest 2>/dev/null || true
    docker network rm react_app_network 2>/dev/null || true
    echo "Complete rollback finished"
ENDSSH
```

---

## Troubleshooting Commands

### Check if Port 80 is Available
```bash
ssh root@72.62.232.8 'netstat -tulpn | grep :80'
```

### Check Docker Service Status
```bash
ssh root@72.62.232.8 'systemctl status docker'
```

### Restart Docker Service
```bash
ssh root@72.62.232.8 'systemctl restart docker'
```

### Check Firewall Rules
```bash
ssh root@72.62.232.8 'iptables -L -n | grep 80'
# or for firewalld
ssh root@72.62.232.8 'firewall-cmd --list-all'
```

### View Build Logs (if build failed)
```bash
ssh root@72.62.232.8 'cd /opt/react_app_prod && docker-compose build --no-cache'
```

### Check Container Health
```bash
ssh root@72.62.232.8 'docker inspect react_app_prod | grep -A 10 Health'
```

### View All Docker Containers
```bash
ssh root@72.62.232.8 'docker ps -a'
```

### View Docker Images
```bash
ssh root@72.62.232.8 'docker images'
```

### Clean Up Unused Docker Resources
```bash
ssh root@72.62.232.8 'docker system prune -a'
```

---

## Complete Deployment in One Go (Copy-Paste Ready)

**On your local machine:**

```bash
# Step 1: Build locally
npm install && npm run build

# Step 2: Create archive
tar --exclude='node_modules' --exclude='build' --exclude='.git' --exclude='.DS_Store' -czf react_app_deploy.tar.gz .

# Step 3: Transfer to server
sshpass -p "zC.9rmp7tB49B@pN#fO4" scp react_app_deploy.tar.gz root@72.62.232.8:/opt/react_app_prod/

# Step 4: Deploy on server
sshpass -p "zC.9rmp7tB49B@pN#fO4" ssh root@72.62.232.8 << 'ENDSSH'
    cd /opt/react_app_prod
    tar -xzf react_app_deploy.tar.gz
    rm react_app_deploy.tar.gz
    docker-compose down 2>/dev/null || true
    export REACT_APP_API_URL=$(grep REACT_APP_API_URL .env | cut -d '=' -f2)
    REACT_APP_API_URL=$REACT_APP_API_URL docker-compose up -d --build
    sleep 5
    docker ps --filter "name=react_app_prod"
ENDSSH

# Step 5: Clean up local archive
rm react_app_deploy.tar.gz

# Step 6: Verify
curl http://72.62.232.8/health
```

---

## Verification Checklist

After deployment, verify:

- [ ] Container is running: `docker ps | grep react_app_prod`
- [ ] Health endpoint responds: `curl http://72.62.232.8/health`
- [ ] Main page loads: Open `http://72.62.232.8` in browser
- [ ] No errors in logs: `docker logs react_app_prod`
- [ ] Port 80 is listening: `netstat -tulpn | grep :80`
- [ ] Container is isolated: `docker network inspect react_app_network`

---

## Notes

1. **Isolation**: The container runs in its own Docker network (`react_app_network`) ensuring complete isolation.

2. **Port Mapping**: Container port 80 is mapped to host port 80. If you need a different port, modify `docker-compose.yml`.

3. **Environment Variables**: The `REACT_APP_API_URL` is read from `.env` file during build.

4. **Persistence**: Application files are stored in `/opt/react_app_prod` on the server.

5. **Updates**: To update the app, repeat the deployment process with new code.
