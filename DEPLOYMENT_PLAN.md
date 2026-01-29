# Deployment Plan — VPS (Ubuntu) with Free HTTPS (Let's Encrypt)

This step-by-step manual deployment plan installs and runs the full web application (frontend + backend) on a fresh VPS running Ubuntu (tested with Ubuntu 22.04+). It uses Docker and Docker Compose to run services, and obtains free HTTPS certificates from Let's Encrypt. Replace example domain names, environment values, and secrets with your real values.

Overview:

- Assumes project repository is the one in this workspace (contains `docker-compose.yml`, `backend/`, `nginx/`, `admin/`, `student/`).
- We'll transfer files to the VPS, install Docker and Certbot, build/start containers (without `nginx` at first), obtain certificates using Certbot in standalone mode, then enable `nginx` to proxy TLS and the apps.

Important: Do not run commands as-is until you replace domain placeholders (e.g., `admin.example.com`, `student.example.com`) with your real domain names and set secure secrets in `.env`.

Supported target OS: Ubuntu 22.04 (LTS) or later. Commands use `sudo` where required.

---

## Quick variables to set (replace before running)

- VPS_USER: your ubuntu user (e.g., `ubuntu`)
- VPS_IP: your VPS public IP (e.g., `203.0.113.12`)
- PROJECT_DIR: path on VPS (e.g., `/opt/myproject`)
- DOMAINS: the domains for the frontends (example below)
  - ADMIN_HOST=admin.example.com
  - STUDENT_HOST=student.example.com

---

## Step 0 — Prerequisites (local)

- Make sure your domain DNS A/AAAA records point to the VPS IP for each hostname you will use (e.g., `admin.example.com` and `student.example.com`). Let DNS propagate before requesting certs.
- Install `rsync`, `ssh` on your local machine (most systems have them).

---

## Step 1 — Transfer project files to VPS

Option A — Use `git clone` on the VPS (recommended when repo hosted remotely):

1. SSH into VPS and clone:

```bash
ssh VPS_USER@VPS_IP
sudo mkdir -p /opt
sudo chown $USER:$USER /opt
cd /opt
git clone https://github.com/yourorg/yourrepo.git myproject
cd myproject
```

Option B — Upload from local using `rsync` (keeps permissions, faster for large trees):

From local machine (run from repo root):

```bash
# replace values
rsync -avP --exclude='.git' --exclude='node_modules' ./ VPS_USER@VPS_IP:/opt/myproject/
ssh VPS_USER@VPS_IP
cd /opt/myproject
```

Option C — Use `scp` to copy a tarball:

```bash
# on local
tar czf project.tar.gz --exclude=node_modules .
scp project.tar.gz VPS_USER@VPS_IP:/tmp/
# on VPS
ssh VPS_USER@VPS_IP
sudo mkdir -p /opt/myproject
sudo tar xzf /tmp/project.tar.gz -C /opt/myproject --strip-components=0
cd /opt/myproject
```

After the files are on the VPS, confirm you see `docker-compose.yml`, `backend/`, `nginx/`, `admin/`, `student/`.

---

## Step 2 — Prepare VPS: update, user, firewall

1. Update packages and install basic tools:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg lsb-release software-properties-common apt-transport-https
```

2. Create a dedicated user (optional) and enable sudo:

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
# Optional: copy your SSH key
sudo mkdir -p /home/deploy/.ssh
sudo chown deploy:deploy /home/deploy/.ssh
# then upload authorized_keys for convenience
```

3. (Optional) Configure UFW firewall to allow SSH, HTTP, HTTPS:

```bash
sudo apt install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## Step 3 — Install dependencies (Docker, Docker Compose plugin, Certbot)

We recommend using Docker Compose (Compose V2 plugin). Install Docker Engine and Certbot on the host.

1. Install Docker Engine:

```bash
# Add Docker repo
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
# Enable and start daemon
sudo systemctl enable --now docker
# Add your deploy user to docker group (log out/in to apply)
sudo usermod -aG docker $USER
```

2. Install Certbot (we'll use the OS package or snap):

Ubuntu (snap recommended):

```bash
sudo apt install -y snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

Alternatively, you can use the official Certbot Docker image — instructions below will include a docker-based approach in case you prefer it.

---

## Step 4 — Prepare project configuration and build artifacts

1. Set up `.env` on the VPS. Copy `.env.example` to `.env` and update values (particularly `POSTGRES_*`, `ADMIN_HOST`, `STUDENT_HOST`, `DJANGO_SECRET_KEY`, etc.). Example:

```bash
cd /opt/myproject
cp .env.example .env
# Edit .env with your editor (vim, nano) and set ADMIN_HOST, STUDENT_HOST, POSTGRES_PASSWORD, DJANGO_SECRET_KEY, DJANGO_DEBUG=False for production
nano .env
```

2. Choose deployment mode:

- Preferred: use Docker Compose (project already contains `docker-compose.yml`).
- Alternative: run services natively (Node and Python). This plan focuses on Docker Compose.

3. Build the Docker images (do NOT start `nginx` yet because we must obtain certs while port 80 is free):

```bash
# Build images defined by docker-compose
docker compose build
# or: sudo docker compose build
```

Note: If you are on older docker-compose binary, use `docker-compose build`.

---

## Step 5 — Start required services except the `nginx` reverse-proxy

We will start the database, backend, and frontends so the app is available internally, but keep the `nginx` service down so Certbot can use port 80 to complete the HTTP-01 challenge.

1. Start the necessary services (exclude `nginx`):

```bash
# This starts postgres, backend, react-admin, react-student but not nginx
docker compose up -d postgres backend react-admin react-student
```

2. Confirm containers are healthy:

```bash
docker compose ps
docker compose logs -f postgres
```

If any container fails, inspect logs and fix issues before requesting certificates.

---

## Step 6 — Obtain free HTTPS certificates (Let's Encrypt)

Two recommended approaches:

A) Use Certbot on the host (standalone mode) — requires port 80 available.

1. Stop any process binding port 80 on the host. Since `nginx` is not started as a container, ensure no host `nginx` runs.
2. Run Certbot for your domains (replace `admin.example.com` and `student.example.com`):

```bash
# Example: obtain certs and save them under /etc/letsencrypt/live
sudo certbot certonly --standalone --agree-tos --email you@yourdomain.com -d admin.example.com -d student.example.com
```

This will create live certs under `/etc/letsencrypt/live/<domain>/` and fullchain and privkey files.

3. Create a directory in the project for nginx to read certificates (if not existing):

```bash
cd /opt/myproject
mkdir -p nginx/certs
sudo chown -R $USER:$USER nginx/certs
```

4. Copy or symlink the obtained certs into the project `nginx/certs` directory and use the names expected by the repo (`ADMIN_CRT`, `ADMIN_KEY`, `STUDENT_CRT`, `STUDENT_KEY`). Example:

```bash
# adjust names as required by nginx config (shown in .env.example)
sudo cp /etc/letsencrypt/live/admin.example.com/fullchain.pem nginx/certs/admin.crt
sudo cp /etc/letsencrypt/live/admin.example.com/privkey.pem nginx/certs/admin.key
sudo cp /etc/letsencrypt/live/student.example.com/fullchain.pem nginx/certs/student.crt
sudo cp /etc/letsencrypt/live/student.example.com/privkey.pem nginx/certs/student.key
sudo chown $USER:$USER nginx/certs/*
sudo chmod 644 nginx/certs/*.crt
sudo chmod 600 nginx/certs/*.key
```

Important: The repo's `RUN_PROJECT.md` and `nginx/conf.d/app.conf` expect certain filenames. Edit `.env` to match the chosen filenames if necessary.

B) Alternative: Use Certbot Docker image (standalone) — useful if you don't want to install snap Certbot.

```bash
# run from project root
docker run --rm -it -p 80:80 \
  -v /etc/letsencrypt:/etc/letsencrypt \
  certbot/certbot certonly --standalone --agree-tos --email you@yourdomain.com -d admin.example.com -d student.example.com
```

Then copy the cert files from `/etc/letsencrypt` into `nginx/certs` as shown above.

Notes on challenges and port 80:

- If your DNS points to the VPS and you have port 80 open, the standalone method works.
- If you cannot open port 80 or want zero downtime, use DNS-01 challenge via your DNS provider and Certbot DNS plugin (not covered in detail here).

---

## Step 7 — Configure `nginx` and start the full stack

1. Verify `nginx/conf.d/app.conf` uses the certificate filenames placed into `nginx/certs`. Edit if necessary.
2. Update `.env` in the project root so values `ADMIN_HOST`, `STUDENT_HOST`, `ADMIN_CRT`, `ADMIN_KEY`, `STUDENT_CRT`, `STUDENT_KEY` match real domains and file names.
3. Start `nginx` container now that certificates are in place:

```bash
docker compose up -d nginx
```

4. Confirm `nginx` is running and listening on ports 80/443:

```bash
docker compose ps
sudo ss -tulpen | grep -E ':80|:443'
docker compose logs -f nginx
```

If `nginx` fails on start, check logs and file permissions for certs. Common errors: cert file not found, permission denied, or config syntax error. You can validate the config by running an nginx test inside a temporary container mounting the conf and certs (see `RUN_PROJECT.md`).

---

## Step 8 — Set up automatic certificate renewal

1. If using OS Certbot (snap), a systemd timer is typically installed. Test renewal dry-run:

```bash
sudo certbot renew --dry-run
```

2. Renewal hooks: After renewal, copy the new cert files into the project `nginx/certs` and reload the nginx container. Create a small script `/usr/local/bin/copy-and-reload-certs.sh`:

```bash
sudo tee /usr/local/bin/copy-and-reload-certs.sh > /dev/null <<'EOF'
#!/usr/bin/env bash
set -e
PROJECT_DIR=/opt/myproject
# copy certs for admin
cp /etc/letsencrypt/live/admin.example.com/fullchain.pem "$PROJECT_DIR/nginx/certs/admin.crt"
cp /etc/letsencrypt/live/admin.example.com/privkey.pem "$PROJECT_DIR/nginx/certs/admin.key"
# copy certs for student
cp /etc/letsencrypt/live/student.example.com/fullchain.pem "$PROJECT_DIR/nginx/certs/student.crt"
cp /etc/letsencrypt/live/student.example.com/privkey.pem "$PROJECT_DIR/nginx/certs/student.key"
# reload nginx container
cd $PROJECT_DIR
docker compose exec -T nginx nginx -s reload || docker compose restart nginx
EOF
sudo chmod +x /usr/local/bin/copy-and-reload-certs.sh
```

3. Configure Certbot to call this script on renewal by adding `--deploy-hook` or adding a hook file. For snap Certbot, create `/etc/letsencrypt/renewal-hooks/deploy/` and place the script or symlink.

Example cron entry (if you prefer cron):

```bash
# run daily renewal and call hook
0 3 * * * /usr/bin/certbot renew --quiet --deploy-hook "/usr/local/bin/copy-and-reload-certs.sh" >> /var/log/certbot-renew.log 2>&1
```

---

## Step 9 — Post-deployment verification (smoke tests)

1. Verify HTTPS responds and certificate is valid:

```bash
curl -I https://admin.example.com/ --resolve admin.example.com:443:VPS_IP
curl -I https://student.example.com/ --resolve student.example.com:443:VPS_IP
# or simply
curl -I https://admin.example.com/
```

2. Verify backend API is reachable via nginx proxy (replace path with your API health endpoint):

```bash
curl -I https://admin.example.com/api/health/
```

3. Test full flows in a browser for both frontends. Log in to the admin UI (create a superuser if necessary in Django):

```bash
# create superuser inside backend container
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py collectstatic --noinput
docker compose exec backend python manage.py createsuperuser
```

4. Check container and application logs for errors:

```bash
docker compose logs -f backend
docker compose logs -f react-admin
docker compose logs -f react-student
docker compose logs -f nginx
```

---

## Step 10 — Optional: process supervision, backups, monitoring, and hardening

- Use `watchtower` or CI/CD to automatically update images, or manually `docker compose pull && docker compose up -d`.
- Back up Postgres data: ensure `postgres_data` volume is periodically dumped (`pg_dump`) or replicate to managed DB.
- Set up log rotation for both host and container logs.
- Monitor services with tools like Prometheus + Grafana, or a hosted service.
- Keep OS and Docker up to date.

---

## Troubleshooting tips

- If Certbot fails due to ports in use: ensure no process is listening on 80/443, stop it, run certbot, then restart nginx container.
- If `nginx` can't read certs: check file ownership and permissions. Container user may need read access.
- For local testing without public DNS: use self-signed certs (not recommended for production). See `RUN_PROJECT.md` for self-signed commands.

---

## Summary checklist (copy this and tick off while deploying)

- [ ]  DNS A records for admin and student point to VPS
- [ ]  Files transferred to VPS at `/opt/myproject`
- [ ]  `.env` created and configured
- [ ]  Docker Engine and Certbot installed
- [ ]  Images built: `docker compose build`
- [ ]  Services started (except nginx) for certificate issuance
- [ ]  Certificates obtained and copied to `nginx/certs`
- [ ]  `nginx` started and serving HTTPS
- [ ]  Certbot renewal configured and tested
- [ ]  Smoke tests passed

---

If you'd like, I can also:

- produce a sample `systemd` unit or a cron job for automatic docker-compose start at boot,
- generate example `nginx` server blocks tuned to your `ADMIN_HOST` and `STUDENT_HOST`, or
- create a minimal CI/CD script for building and pushing images to a private registry.

File created: DEPLOYMENT_PLAN.md
