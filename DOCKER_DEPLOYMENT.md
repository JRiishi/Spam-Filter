# 🐳 Docker Hub Deployment Guide

## Prerequisites

1. **Docker Hub Account**: Create a free account at [hub.docker.com](https://hub.docker.com)
2. **Docker Desktop**: Install and run Docker Desktop
3. **Model Files**: Ensure `model.pkl` and `vectorizer.pkl` are in the `backend/` directory

## Quick Start: Deploy to Docker Hub

### Step 1: Make the script executable
```bash
chmod +x docker-build-push.sh
```

### Step 2: Run the deployment script
```bash
./docker-build-push.sh <your-dockerhub-username>
```

**Example:**
```bash
./docker-build-push.sh johndoe
```

This will:
- ✅ Login to Docker Hub (you'll be prompted for credentials)
- ✅ Build backend and frontend images
- ✅ Tag images with your username
- ✅ Push images to Docker Hub
- ✅ Tag with both `latest` and custom version

### Step 3: Deploy with a specific version (optional)
```bash
./docker-build-push.sh <username> <version>
```

**Example:**
```bash
./docker-build-push.sh johndoe v1.0.0
```

---

## Manual Deployment Steps

If you prefer manual control:

### 1. Login to Docker Hub
```bash
docker login
```

### 2. Build Images
```bash
# Build backend
docker build -t yourusername/spam-filter-backend:latest ./backend

# Build frontend
docker build -t yourusername/spam-filter-frontend:latest ./frontend
```

### 3. Push to Docker Hub
```bash
# Push backend
docker push yourusername/spam-filter-backend:latest

# Push frontend
docker push yourusername/spam-filter-frontend:latest
```

---

## Running from Docker Hub (On Any Machine)

Once deployed, anyone can run your application:

### Option 1: Using docker-compose (Recommended)
```bash
# Set your Docker Hub username
export DOCKERHUB_USERNAME=yourusername

# Pull and run
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Using docker run
```bash
# Run backend
docker run -d \
  --name spam-filter-backend \
  -p 8888:8888 \
  -v $(pwd)/backend/model.pkl:/app/model.pkl:ro \
  -v $(pwd)/backend/vectorizer.pkl:/app/vectorizer.pkl:ro \
  yourusername/spam-filter-backend:latest

# Run frontend
docker run -d \
  --name spam-filter-frontend \
  -p 80:80 \
  --link spam-filter-backend:backend \
  yourusername/spam-filter-frontend:latest
```

### Access the Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8888
- **API Docs**: http://localhost:8888/docs

---

## Image Information

### Backend Image
- **Base**: Python 3.11-slim
- **Exposed Port**: 8888
- **Required Volumes**: 
  - `/app/model.pkl` - ML model file
  - `/app/vectorizer.pkl` - Text vectorizer file
- **Health Check**: GET `/api/health`

### Frontend Image
- **Build**: Node 18 (multi-stage build)
- **Runtime**: Nginx Alpine
- **Exposed Port**: 80
- **Features**: 
  - Optimized production build
  - Gzip compression
  - API proxy to backend
  - Static asset caching

---

## Image Sizes

Approximate sizes:
- **Backend**: ~200-300 MB (Python + dependencies)
- **Frontend**: ~50-80 MB (Nginx + built assets)

---

## Troubleshooting

### "Model files not found" error
Ensure your model files are in the correct location:
```bash
ls -lh backend/model.pkl backend/vectorizer.pkl
```

### "Docker is not running"
Start Docker Desktop before running the script.

### Authentication failed
Login to Docker Hub:
```bash
docker login
```

### Check deployed images
View your images on Docker Hub:
```
https://hub.docker.com/r/<your-username>/spam-filter-backend
https://hub.docker.com/r/<your-username>/spam-filter-frontend
```

### Check running containers
```bash
docker ps
docker-compose logs -f
```

### Remove old images
```bash
docker image prune -a
```

---

## Environment Variables

### Backend
- `PYTHONUNBUFFERED=1` - Real-time logging

### Frontend (Build Time)
- `VITE_API_URL` - Override API URL (default: `/api/predict`)

---

## Security Notes

⚠️ **Important**: The model files (`model.pkl`, `vectorizer.pkl`) are baked into the backend Docker image. If your model contains sensitive data:

1. **Use Private Repository**:
   ```bash
   # On Docker Hub, make repository private
   # Settings → Make Private
   ```

2. **Or use volume mounts** instead of COPY in Dockerfile:
   - Don't include model files in the image
   - Mount them at runtime via docker-compose volumes

3. **Use .dockerignore**:
   - Already configured to exclude unnecessary files
   - Reduces image size and build time

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy to Docker Hub

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Build and Push
        run: |
          chmod +x docker-build-push.sh
          ./docker-build-push.sh ${{ secrets.DOCKERHUB_USERNAME }} ${{ github.sha }}
```

---

## Useful Commands

```bash
# View image details
docker images | grep spam-filter

# Check image history
docker history yourusername/spam-filter-backend:latest

# Pull latest images
docker pull yourusername/spam-filter-backend:latest
docker pull yourusername/spam-filter-frontend:latest

# Stop and remove all containers
docker-compose -f docker-compose.prod.yml down

# View logs
docker logs spam_filter_backend
docker logs spam_filter_frontend
```

---

## Next Steps

1. ✅ Deploy to Docker Hub using the script
2. 🌐 Deploy to cloud (AWS ECS, Google Cloud Run, Azure Container Instances)
3. 🔒 Set up HTTPS with Let's Encrypt
4. 📊 Add monitoring (Prometheus, Grafana)
5. 🚀 Set up CI/CD pipeline

---

**Need Help?** Check the main [README.md](README.md) for more information.
