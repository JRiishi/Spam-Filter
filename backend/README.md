# Spam Filter Backend

This FastAPI service loads a pre-trained spam classification model and vectorizer and exposes a prediction endpoint.

Placement:
- Put your `model.pkl` and `vectorizer.pkl` in the `backend/` directory (e.g. `backend/model.pkl`), or set `MODEL_PATH`/`VECTORIZER_PATH` environment variables. The server will also search upward from `backend/app/` for these files.

Run locally:

1. Create a virtualenv and install:

   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt

2. Start the server:

   uvicorn app.main:app --reload

Default server: http://localhost:8000

Endpoints:
- GET /api/health — returns 200 OK when model & vectorizer are loaded
- POST /api/predict — JSON {"text":"..."} returns {"label","probability","raw_score"}

- Environment variables:
- MODEL_PATH — path to model file (if not set the server will search upward for `model.pkl` starting from `backend/app/`)
- VECTORIZER_PATH — path to vectorizer file (same search behavior applies)
- FRONTEND_ORIGINS — comma-separated list of origins allowed for CORS (defaults to http://localhost:5173)
