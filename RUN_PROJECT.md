# Run the Project on a Server — Step-by-step Guide

## Table of Contents
- [Overview](#overview)
- [Quick checklist before you start](#quick-checklist-before-you-start)
- [Fixing Nginx SSL problems](#fixing-nginx-ssl-problems)
  - [Option A — Provide paid SSL certificates (recommended)](#option-a---provide-paid-ssl-certificates-recommended)
  - [Option B — Generate self-signed certificates (for testing)](#option-b---generate-self-signed-certificates-for-testing)
  - [Option C — Configure Nginx to run HTTP-only (temporarily)](#option-c---configure-nginx-to-run-http-only-temporarily)
- [Build and rebuild containers](#build-and-rebuild-containers)
  - [Build specific service (PowerShell / Linux)](#build-specific-service-powershell--linux)
  - [Rebuild all services](#rebuild-all-services)
- [Start the stack properly](#start-the-stack-properly)
- [Verify services are running](#verify-services-are-running)
- [Common troubleshooting & logs](#common-troubleshooting--logs)
- [Django migrations & superuser (run inside backend)](#django-migrations--superuser-run-inside-backend)
- [Helpful commands reference](#helpful-commands-reference)
- [Notes & best practices](#notes--best-practices)

## Overview

This project is run with Docker Compose and includes:
- `postgres` — PostgreSQL database
- `backend` — Django + Gunicorn
- `react-admin` and `react-student` — React frontends (built and served by nginx inside each image)
- `nginx` — reverse proxy that terminates TLS and proxies `/api/` to the backend and frontends

All orchestration is defined in `docker-compose.yml` at the project root.

## Quick checklist before you start

1. Install Docker and Docker Compose on the server.
2. Open a terminal and change to the project directory:

```bash
cd /home/user/projects
```

3. Copy `.env.example` to `.env` and edit secrets:

PowerShell:
```powershell
copy .env.example .env
notepad .env
```

Linux/macOS:
```bash
cp .env.example .env
nano .env
```

4. Decide how to handle SSL (paid certs, self-signed for testing, or HTTP-only temporarily).

## Fixing Nginx SSL problems

When `nginx` fails to start, the usual cause is missing certificate files. Choose one of the options below.

### Option A — Provide paid SSL certificates (recommended)

1. Obtain `.crt` and `.key` from your certificate vendor.
2. Place files into `./nginx/certs/` with names matching `nginx/conf.d/app.conf`.
   - Example filenames used by this repo: `admin.crt`, `admin.key`, `student.crt`, `student.key`.
3. Set permissions (Linux):

```bash
chmod 600 ./nginx/certs/*.key
```

4. Validate nginx configuration (mounting conf and certs into a temporary container):

Linux:
```bash
docker run --rm -v $(pwd)/nginx/conf.d:/etc/nginx/conf.d:ro -v $(pwd)/nginx/certs:/etc/ssl/certs:ro nginx:alpine nginx -t
```

PowerShell:
```powershell
docker run --rm -v ${PWD}/nginx/conf.d:/etc/nginx/conf.d:ro -v ${PWD}/nginx/certs:/etc/ssl/certs:ro nginx:alpine nginx -t
```

If the test passes, start the stack.

### Option B — Generate self-signed certificates (for testing)

Linux / macOS:
```bash
mkdir -p nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/admin.key -out nginx/certs/admin.crt \
  -subj "/CN=admin.example.com"
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/student.key -out nginx/certs/student.crt \
  -subj "/CN=student.example.com"
```

PowerShell (Windows with OpenSSL available):
```powershell
mkdir nginx\certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout nginx\certs\admin.key -out nginx\certs\admin.crt -subj "/CN=admin.example.com"
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout nginx\certs\student.key -out nginx\certs\student.crt -subj "/CN=student.example.com"
```

Note: Browsers will warn about self-signed certificates. Use only for testing.

### Option C — Configure Nginx to run HTTP-only (temporarily)

Edit `nginx/conf.d/app.conf` and replace SSL server blocks with simple HTTP server blocks listening on port 80. Example:

```nginx
server {
  listen 80;
  server_name admin.example.com;

  location / {
    proxy_pass http://react-admin:80;
  }

  location /api/ {
    proxy_pass http://backend:8000/;
  }
}
```

Save and restart the `nginx` container (see restart command below). Running without TLS is insecure — use temporarily only.

## Build and rebuild containers

### Build specific service (PowerShell / Linux)

Linux / macOS:
```bash
# Build backend only
docker-compose build backend

# Build React admin only
docker-compose build react-admin
```

PowerShell:
```powershell
docker-compose build backend
docker-compose build react-admin
```

### Rebuild all services

Use this when you changed dependencies or Dockerfiles:

```bash
docker-compose build --no-cache
```

## Start the stack properly

Start everything in detached mode:

```bash
docker-compose up -d
```

Start only a subset (e.g., postgres, backend, nginx):

```bash
docker-compose up -d postgres backend nginx
```

Restart nginx after editing config or certs:

```bash
docker-compose restart nginx
```

If `nginx` service repeatedly fails, check its logs and apply the SSL fixes above.

## Verify services are running

1. Show running containers and ports:

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
```

Look for `postgres`, `backend`, `react-admin`, `react-student`, and `nginx` in the list.

2. Check service logs (example):

```bash
docker-compose logs -f nginx
docker-compose logs -f backend
docker-compose logs -f postgres
```

3. Test HTTP(S) endpoints:

If nginx is available on host ports:

```bash
curl -v https://admin.example.com/    # or http:// if HTTP-only
curl -v https://admin.example.com/api/health/  # Example backend endpoint
```

If backend port is not published, use `docker-compose exec` to run curl inside the nginx or backend containers.

## Common troubleshooting & logs

- Follow full logs:

```bash
docker-compose logs -f
```

- Inspect a single container's logs:

```bash
docker logs -f nginx
docker logs -f backend
```

- See exited containers and their exit codes:

```bash
docker ps -a
```

Common issues and fixes:

- Nginx fails on start with SSL errors:
  - Ensure certificate files exist in `./nginx/certs` and match the filenames used in the config.
  - Use self-signed certs for testing, or switch to HTTP-only while you're preparing proper certs.

- Backend fails to install dependencies (pip errors):
  - Confirm `backend/Dockerfile` Python version matches project requirements (Django 6 requires Python >= 3.12).
  - Update the Dockerfile or requirements accordingly and rebuild the backend image.

- Frontend build errors (npm):
  - If `npm ci` fails due to missing `package-lock.json`, `npm install` is used in the Dockerfiles to be tolerant.

- Backend cannot connect to Postgres:
  - Confirm DB credentials in `.env` match the `postgres` service environment variables.
  - Check `docker-compose logs postgres` for startup errors.

## Django migrations & superuser (run inside backend)

After `postgres` and `backend` are up and healthy, run:

```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py collectstatic --noinput
docker-compose exec backend python manage.py createsuperuser
```

If the backend container is not running, start it first:

```bash
docker-compose up -d backend
```

## Helpful commands reference

- Validate docker-compose file:
```bash
docker-compose config
```
- Build a single service:
```bash
docker-compose build backend
```
- Build all services (no cache):
```bash
docker-compose build --no-cache
```
- Start stack in background:
```bash
docker-compose up -d
```
- Follow logs:
```bash
docker-compose logs -f
```
- Stop and remove containers (keep volumes):
```bash
docker-compose down
```
- Stop and remove containers + volumes:
```bash
docker-compose down --volumes --remove-orphans
```

## Notes & best practices

- Do not commit SSL private keys to git — keep them out of source control.
- Use `restart: unless-stopped` so containers restart after server reboots.
- Use strong secrets for `DJANGO_SECRET_KEY` and database credentials.
- Automate certificate management in production (Let's Encrypt + automation or your CA's tooling).

---

If you want, I can add helper scripts (`run.sh` and `run.ps1`) that: validate `.env`, build images, run migrations, and start the stack. Tell me which helper you'd like and whether you want HTTP-only or self-signed certificates created automatically.
