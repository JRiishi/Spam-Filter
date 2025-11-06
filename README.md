# Spam Filter Example Project

Full-stack example: FastAPI backend + React (Vite) frontend + TailwindCSS. The backend expects two files to be present (the server will search upward from `backend/app/`):

- `backend/model.pkl` or `backend/app/model.pkl`
- `backend/vectorizer.pkl` or `backend/app/vectorizer.pkl`

**CRITICAL:** The `model.pkl` and `vectorizer.pkl` must be trained together and match exactly. If you get a feature mismatch error like "X has 3000 features, but MultinomialNB is expecting 3003", it means:
- The vectorizer was not the one used to train the model, OR
- The model and vectorizer were saved at different times with different settings

**Solution:** Retrain your model and vectorizer together, and save them both from the same training session:
```python
# Train together
vectorizer = TfidfVectorizer(max_features=3000)  # or whatever params you need
X_train = vectorizer.fit_transform(texts)
model = MultinomialNB()
model.fit(X_train, labels)

# Save both
import joblib
joblib.dump(model, 'backend/model.pkl')
joblib.dump(vectorizer, 'backend/vectorizer.pkl')
```

If those files are missing or mismatched, the server will start but return 503 from `/api/health` and 500 from `/api/predict`.

Quick start (local, recommended):

1. Backend

   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
  # Ensure model.pkl and vectorizer.pkl are placed in backend/ (or set MODEL_PATH/VECTORIZER_PATH)
   uvicorn app.main:app --reload

   The backend listens on http://localhost:8000

2. Frontend

   cd frontend
   npm install
   npm run dev

   Frontend runs on http://localhost:5173 and will call the backend at http://localhost:8000/api/predict

## 🐳 Docker Deployment

### Local Docker (Development)
```bash
# Build and run locally
docker-compose up --build

# Or use the startup script
./start-docker.sh
```
Access at: http://localhost (frontend) and http://localhost:8888 (backend)

### Docker Hub (Production)

**Deploy to Docker Hub:**
```bash
# One-command deployment
./docker-build-push.sh <your-dockerhub-username>

# Example:
./docker-build-push.sh johndoe
```

This will build, tag, and push both images to Docker Hub.

**Run from Docker Hub (on any machine):**
```bash
# Set your username
export DOCKERHUB_USERNAME=yourusername

# Pull and run
docker-compose -f docker-compose.prod.yml up -d
```

📚 **Full Docker Hub deployment guide:** See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)

---

## Example curl:

  curl -X POST http://localhost:8000/api/predict \
    -H "Content-Type: application/json" \
    -d '{"text":"Congratulations! You have won a prize"}'

Notes:

- If your model uses different class labels, the server uses heuristics: it looks for a class named 'spam', then `1`, otherwise assumes the last column of `predict_proba` is spam.
- If `predict_proba` is not available the server falls back to `decision_function` and applies a sigmoid to map to probability.
- The frontend stores the last 10 predictions in localStorage.

Project structure (important files):

- backend/app/main.py - FastAPI app
- backend/app/model_loader.py - loads model & vectorizer
- backend/app/schemas.py - request/response schemas
- frontend/src/App.jsx - React UI
