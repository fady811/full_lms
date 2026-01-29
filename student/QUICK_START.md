# Quick Start Deployment Guide

## 🚀 Fastest Deployment Method

### For Windows (PowerShell):
```powershell
.\deploy.ps1
```

### For Linux/Mac (Bash):
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 📋 What Gets Created

1. **Dockerfile** - Multi-stage build (React + Nginx)
2. **docker-compose.yml** - Container orchestration
3. **nginx.conf** - Web server configuration for SPA
4. **Deployment Scripts** - Automated deployment

---

## 🔧 Manual Deployment (5 Steps)

### 1. Build Locally
```bash
npm run build
```

### 2. Transfer Files
```bash
tar --exclude='node_modules' --exclude='build' --exclude='.git' -czf app.tar.gz .
sshpass -p "zC.9rmp7tB49B@pN#fO4" scp app.tar.gz root@72.62.232.8:/opt/react_app_prod/
```

### 3. Extract on Server
```bash
ssh root@72.62.232.8
cd /opt/react_app_prod && tar -xzf app.tar.gz && rm app.tar.gz
```

### 4. Deploy
```bash
export REACT_APP_API_URL=$(grep REACT_APP_API_URL .env | cut -d '=' -f2)
REACT_APP_API_URL=$REACT_APP_API_URL docker-compose up -d --build
```

### 5. Verify
```bash
curl http://72.62.232.8/health
```

---

## 🌐 Access Your App

**URL**: http://72.62.232.8

---

## 📝 Common Commands

| Task | Command |
|------|---------|
| View logs | `ssh root@72.62.232.8 'docker logs -f react_app_prod'` |
| Stop app | `ssh root@72.62.232.8 'cd /opt/react_app_prod && docker-compose down'` |
| Restart app | `ssh root@72.62.232.8 'cd /opt/react_app_prod && docker-compose restart'` |
| Rebuild | `ssh root@72.62.232.8 'cd /opt/react_app_prod && docker-compose up -d --build'` |
| Check status | `ssh root@72.62.232.8 'docker ps \| grep react_app_prod'` |

---

## 🔄 Rollback

```bash
ssh root@72.62.232.8 'cd /opt/react_app_prod && docker-compose down'
```

---

## 📚 Full Documentation

- **DEPLOYMENT.md** - Complete deployment guide
- **DEPLOYMENT_COMMANDS.md** - All commands step-by-step

---

## ⚠️ Important Notes

- Container name: `react_app_prod`
- Port: `80`
- Network: `react_app_network` (isolated)
- App directory: `/opt/react_app_prod`
