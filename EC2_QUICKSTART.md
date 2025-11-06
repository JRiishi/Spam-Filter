# 🚀 EC2 Quick Deploy - Copy & Paste

## 1️⃣ SSH into your EC2
```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

## 2️⃣ Copy-Paste This Entire Block

```bash
# Install Docker
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create app directory
mkdir -p ~/spam_filter_app && cd ~/spam_filter_app

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
    networks:
      - spam_filter_network

  frontend:
    image: riishabh/spam_filter:frontend
    container_name: spam_filter_frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - spam_filter_network

networks:
  spam_filter_network:
    driver: bridge
EOF

# Deploy!
sudo docker-compose pull
sudo docker-compose up -d
sudo docker-compose ps
```

## 3️⃣ Configure AWS Security Group

In AWS Console, add these Inbound Rules to your EC2's Security Group:

```
Type: HTTP, Port: 80, Source: 0.0.0.0/0
Type: Custom TCP, Port: 8888, Source: 0.0.0.0/0
```

## 4️⃣ Access Your App

Get your EC2 Public IP from AWS Console:
```
Frontend:  http://YOUR-EC2-IP
Backend:   http://YOUR-EC2-IP:8888
API Docs:  http://YOUR-EC2-IP:8888/docs
```

## ✅ Done!

### Useful Commands:
```bash
# View logs
sudo docker-compose logs -f

# Restart
sudo docker-compose restart

# Stop
sudo docker-compose down

# Update
sudo docker-compose pull && sudo docker-compose up -d
```

---

📚 **Full Guide:** See [AWS_EC2_DEPLOYMENT.md](AWS_EC2_DEPLOYMENT.md)
