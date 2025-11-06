import os
import math
import traceback
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
# Support both package-style imports (when run via `uvicorn app.main:app`) and
# direct script execution (python main.py) which can cause relative import errors.
try:
    from . import model_loader
    from .schemas import PredictionRequest, PredictionResponse, ErrorResponse, HealthResponse
except Exception:
    # fallback: add this directory to sys.path and import by module name
    import sys
    import importlib

    pkg_dir = os.path.dirname(__file__)
    if pkg_dir not in sys.path:
        sys.path.insert(0, pkg_dir)

    model_loader = importlib.import_module('model_loader')
    schemas_mod = importlib.import_module('schemas')
    PredictionRequest = getattr(schemas_mod, 'PredictionRequest')
    PredictionResponse = getattr(schemas_mod, 'PredictionResponse')
    ErrorResponse = getattr(schemas_mod, 'ErrorResponse')
    HealthResponse = getattr(schemas_mod, 'HealthResponse')
from typing import List


def sigmoid(x: float) -> float:
    try:
        return 1.0 / (1.0 + math.exp(-x))
    except OverflowError:
        return 0.0 if x < 0 else 1.0


app = FastAPI(title="Spam Filter API", version="1.0")

# Configure CORS - allow local frontend origins by default
FRONTEND_ORIGINS = os.environ.get("FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
allowed_origins = [o.strip() for o in FRONTEND_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    # Allow overriding via env vars; otherwise search upward for model/vectorizer
    def find_upwards(filename, start_dir, max_levels=3):
        cur = os.path.abspath(start_dir)
        for _ in range(max_levels + 1):
            candidate = os.path.join(cur, filename)
            if os.path.exists(candidate):
                return candidate
            parent = os.path.dirname(cur)
            if parent == cur:
                break
            cur = parent
        return None

    base_dir = os.path.dirname(__file__)
    env_model = os.environ.get("MODEL_PATH")
    env_vector = os.environ.get("VECTORIZER_PATH")

    if env_model:
        model_path = env_model
    else:
        # try app/model.pkl, then parent (backend/model.pkl), then two levels up
        model_path = find_upwards('model.pkl', base_dir, max_levels=3)

    if env_vector:
        vectorizer_path = env_vector
    else:
        vectorizer_path = find_upwards('vectorizer.pkl', base_dir, max_levels=3)

    looked_at = [p for p in (env_model, env_vector, model_path, vectorizer_path) if p]
    try:
        if model_path is None or vectorizer_path is None:
            raise FileNotFoundError(f"Could not find model/vectorizer. Searched locations: {looked_at}")

        model_loader.load_model_and_vectorizer(model_path, vectorizer_path)
        print(f"Loaded model from {model_path} and vectorizer from {vectorizer_path}")
    except Exception as e:
        # Do not crash — log error, endpoints will report helpful message
        print("WARNING: Failed to load model/vectorizer at startup:", e)
        print("Searched locations:", looked_at)
        traceback.print_exc()


@app.get("/api/health", response_model=HealthResponse)
def health():
    model = model_loader.get_model()
    vec = model_loader.get_vectorizer()
    if model is None or vec is None:
        return JSONResponse(status_code=503, content={"status": "unavailable"})
    return {"status": "ok"}


@app.post("/api/predict", response_model=PredictionResponse, responses={400: {"model": ErrorResponse}, 503: {"model": ErrorResponse}})
async def predict(req: PredictionRequest):
    text = req.text.strip() if isinstance(req.text, str) else ""
    if not text:
        raise HTTPException(status_code=400, detail="text must be a non-empty string")

    model = model_loader.get_model()
    vectorizer = model_loader.get_vectorizer()
    if model is None or vectorizer is None:
        raise HTTPException(status_code=503, detail="Model or vectorizer not loaded on server")

    try:
        X = vectorizer.transform([text])
        
        # Feature size mismatch workaround: pad or truncate to match model's expected features
        if hasattr(model, 'n_features_in_'):
            expected_features = model.n_features_in_
            actual_features = X.shape[1]
            
            if actual_features != expected_features:
                import scipy.sparse as sp
                if actual_features < expected_features:
                    # Pad with zeros
                    padding = sp.csr_matrix((X.shape[0], expected_features - actual_features))
                    X = sp.hstack([X, padding], format='csr')
                else:
                    # Truncate
                    X = X[:, :expected_features]
                    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to vectorize input: {e}")

    # Default values
    probability = 0.0
    raw_score = 0.0
    label = "not_spam"

    try:
        # Prefer predict_proba
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(X)
            # Determine spam class index
            spam_idx = None
            if hasattr(model, "classes_"):
                try:
                    # Try to find 'spam' label if classifier used strings
                    classes = list(model.classes_)
                    if "spam" in classes:
                        spam_idx = classes.index("spam")
                    elif 1 in classes:
                        spam_idx = classes.index(1)
                    else:
                        spam_idx = -1
                except Exception:
                    spam_idx = -1
            else:
                spam_idx = -1

            # If index negative, use last column as spam probability assumption
            idx = spam_idx if spam_idx is not None and spam_idx >= 0 else (probs.shape[1] - 1)
            probability = float(probs[0, idx])
            raw_score = float(probability)
            label = "spam" if probability >= 0.5 else "not_spam"

        elif hasattr(model, "decision_function"):
            df = model.decision_function(X)
            # df may be scalar or array
            raw = float(df[0]) if hasattr(df, "__len__") else float(df)
            raw_score = raw
            probability = float(sigmoid(raw))
            label = "spam" if probability >= 0.5 else "not_spam"

        else:
            # Fallback: use predict
            pred = model.predict(X)
            is_spam = False
            if hasattr(model, "classes_"):
                classes = list(model.classes_)
                # If predicted label equals 'spam' or 1
                try:
                    is_spam = (pred[0] == "spam") or (pred[0] == 1)
                except Exception:
                    is_spam = bool(pred[0])
            else:
                is_spam = bool(pred[0])
            probability = 1.0 if is_spam else 0.0
            raw_score = float(probability)
            label = "spam" if is_spam else "not_spam"

        return {"label": label, "probability": round(float(probability), 6), "raw_score": float(raw_score)}

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")


@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})
