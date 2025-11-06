# 🚀 AWS EC2 Deployment Guide

## Quick Deployment (Copy-Paste Method)

### Step 1: Connect to your EC2 instance
```bash
ssh -i your-key.pem ec2-user@your-ec2-public-ip
```

### Step 2: Run these commands on EC2

```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create project directory
mkdir -p ~/spam_filter_app
cd ~/spam_filter_app

# Create docker-compose.yml
cat > docker-compose.yml <<'EOF'
version: '3.8'

services:
  backend:
    image: riishabh/spam_filter:backend
    container_name: spam_filter_backend
    ports:
      - "8888:8888"
    environment:
      - PYTHONUNBUFFERED=1
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8888/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - spam_filter_network

  frontend:
    image: riishabh/spam_filter:frontend
    container_name: spam_filter_frontend
    ports:
      - "80:80"
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    networks:
      - spam_filter_network

networks:
  spam_filter_network:
    driver: bridge
EOF

# Pull and start containers
sudo docker-compose pull
sudo docker-compose up -d

# Check status
sudo docker-compose ps

# View logs
sudo docker-compose logs -f
```

### Step 3: Configure Security Group

Go to AWS Console → EC2 → Security Groups → Your Instance Security Group

Add these **Inbound Rules**:

| Type | Protocol | Port Range | Source    | Description          |
|------|----------|------------|-----------|----------------------|
| HTTP | TCP      | 80         | 0.0.0.0/0 | Frontend access      |
| Custom TCP | TCP | 8888    | 0.0.0.0/0 | Backend API access   |
| SSH  | TCP      | 22         | Your IP   | SSH access           |

### Step 4: Access Your Application

Get your EC2 public IP from AWS Console, then visit:
- **Frontend**: `http://YOUR-EC2-PUBLIC-IP`
- **Backend API**: `http://YOUR-EC2-PUBLIC-IP:8888`
- **API Docs**: `http://YOUR-EC2-PUBLIC-IP:8888/docs`

---

## Alternative: Using the Deployment Script

### Method 1: Upload and run the script

```bash
# On your local machine, copy the script to EC2
scp -i your-key.pem deploy-ec2.sh ec2-user@your-ec2-ip:~

# SSH into EC2
ssh -i your-key.pem ec2-user@your-ec2-ip

# Make it executable and run
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

### Method 2: Download from GitHub (if you push the repo)

```bash
# On EC2
wget https://raw.githubusercontent.com/yourusername/yourrepo/main/deploy-ec2.sh
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

---

## Ubuntu EC2 Instance

If using Ubuntu instead of Amazon Linux:

```bash
# Update system
sudo apt-get update

# Install Docker
sudo apt-get install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Then continue with the same docker-compose.yml steps above
```

---

## Useful Commands on EC2

```bash
# View running containers
sudo docker ps

# View all containers
sudo docker ps -a

# View logs (all services)
sudo docker-compose logs -f

# View logs (specific service)
sudo docker-compose logs -f backend
sudo docker-compose logs -f frontend

# Restart services
sudo docker-compose restart

# Stop services
sudo docker-compose down

# Update to latest images
sudo docker-compose pull
sudo docker-compose up -d

# Remove all containers and start fresh
sudo docker-compose down
sudo docker system prune -a
sudo docker-compose up -d

# Check resource usage
sudo docker stats
```

---

## Troubleshooting

### 1. "Permission denied" errors
```bash
# Add your user to docker group and logout/login
sudo usermod -a -G docker $USER
exit
# SSH back in
```

### 2. Port 80 already in use
```bash
# Check what's using port 80
sudo netlink -tlnp | grep :80

# If it's Apache/Nginx, stop it
sudo systemctl stop httpd  # Amazon Linux
sudo systemctl stop nginx  # Ubuntu
```

### 3. Can't access from browser
- Check EC2 Security Group inbound rules
- Verify containers are running: `sudo docker ps`
- Check logs: `sudo docker-compose logs`

### 4. Backend health check failing
```bash
# Check backend logs
sudo docker-compose logs backend

# Test locally on EC2
curl http://localhost:8888/api/health
```

### 5. Out of disk space
```bash
# Clean up Docker
sudo docker system prune -a
```

---

## Setting up HTTPS (Optional)

### Using Let's Encrypt + Nginx Proxy

```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx  # Amazon Linux
# OR
sudo apt-get install -y certbot python3-certbot-nginx  # Ubuntu

# Get SSL certificate (requires domain name)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Auto-start on Reboot

The containers are configured with `restart: unless-stopped`, so they will auto-start when EC2 reboots.

To verify:
```bash
# Reboot EC2
sudo reboot

# After reboot, check containers
sudo docker ps
```

---

## Monitoring

### View real-time logs
```bash
sudo docker-compose logs -f
```

### Check container health
```bash
sudo docker inspect spam_filter_backend | grep -A 10 Health
sudo docker inspect spam_filter_frontend | grep -A 10 Health
```

### Resource monitoring
```bash
# Install htop for system monitoring
sudo yum install -y htop  # Amazon Linux
sudo apt-get install -y htop  # Ubuntu

# Run htop
htop

# Docker stats
sudo docker stats
```

---

## Cost Optimization

1. **Use t2.micro** (free tier eligible) - Sufficient for testing
2. **Use t3.small** - Better for production (2 vCPU, 2GB RAM)
3. **Stop instance when not in use** - You're only charged when running
4. **Use Elastic IP** - Prevents IP change on stop/start (small charge when instance is stopped)

---

## Next Steps

1. ✅ Deploy to EC2
2. 🌐 Point a domain name to your EC2 IP
3. 🔒 Set up HTTPS with Let's Encrypt
4. 📊 Add CloudWatch monitoring
5. 🔄 Set up CI/CD with GitHub Actions
6. 📈 Use Application Load Balancer for scaling
7. 🗄️ Move to ECS/Fargate for managed containers

---

## Need Help?

Check the main [README.md](README.md) or [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for more information.
