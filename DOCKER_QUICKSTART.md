# 🚀 Quick Deploy to Docker Hub

## Step 1: Login to Docker Hub
Create account at https://hub.docker.com if you don't have one.

## Step 2: Run Deploy Script
```bash
./docker-build-push.sh <your-dockerhub-username>
```

**Example:**
```bash
./docker-build-push.sh riishabhjain
```

## What It Does
✅ Builds backend Docker image  
✅ Builds frontend Docker image  
✅ Pushes both to Docker Hub  
✅ Tags with `latest` and custom version  

## After Deployment

Your images will be available at:
- `<username>/spam-filter-backend:latest`
- `<username>/spam-filter-frontend:latest`

## Run From Docker Hub (Any Machine)

```bash
# Create a docker-compose.prod.yml or use the provided one
export DOCKERHUB_USERNAME=<your-username>
docker-compose -f docker-compose.prod.yml up -d
```

Make sure you have:
- `backend/model.pkl`
- `backend/vectorizer.pkl`

## Verify Deployment

Visit Docker Hub to see your images:
```
https://hub.docker.com/r/<username>/spam-filter-backend
https://hub.docker.com/r/<username>/spam-filter-frontend
```

## Troubleshooting

**"Docker not running"**
→ Start Docker Desktop

**"Model files not found"**
→ Ensure `backend/model.pkl` and `backend/vectorizer.pkl` exist

**"Authentication failed"**
→ Run `docker login` first

---

📖 **Full Guide:** [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)
