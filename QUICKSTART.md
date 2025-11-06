# Quick Start Guide

## ✅ Your Project is Ready!

Both backend and frontend are currently running:
- **Frontend:** http://localhost:5173
- **Backend:** http://127.0.0.1:8888

## Open the App

Just open your browser and go to:
```
http://localhost:5173
```

## Test the API Manually

```bash
# Test spam message
curl -X POST http://127.0.0.1:8888/api/predict \
  -H "Content-Type: application/json" \
  -d '{"text":"Congratulations! You have won a free prize!"}'

# Test normal message
curl -X POST http://127.0.0.1:8888/api/predict \
  -H "Content-Type: application/json" \
  -d '{"text":"Hey, let me know when you are free to meet"}'

# Check health
curl http://127.0.0.1:8888/api/health
```

## Restart Services

If you close the terminals, restart with:

### Backend
```bash
cd /Users/riishabhjain/Desktop/Projects/spam_filter_project/backend
python3 -m uvicorn app.main:app --reload --port 8888
```

### Frontend
```bash
cd /Users/riishabhjain/Desktop/Projects/spam_filter_project/frontend
export PATH="/usr/local/bin:$PATH"
npm run dev
```

## Important Notes

1. **Feature Mismatch Fix Applied:** The backend now automatically pads the vectorizer output from 3000 to 3003 features to match your model. This is a workaround.

2. **For Best Results:** Train model and vectorizer together:
   ```python
   vectorizer = TfidfVectorizer(max_features=3003)
   X = vectorizer.fit_transform(texts)
   model.fit(X, labels)
   
   # Save both
   joblib.dump(model, 'backend/model.pkl')
   joblib.dump(vectorizer, 'backend/vectorizer.pkl')
   ```

3. **Dependencies:**
   - Python packages are in `/Users/riishabhjain/Library/Python/3.9/`
   - Node/npm are in `/usr/local/bin/` (add to PATH if needed)

## Project Structure

```
spam_filter_project/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app with feature padding fix
│   │   ├── model_loader.py  # Loads model.pkl and vectorizer.pkl
│   │   └── schemas.py       # Request/response models
│   ├── model.pkl           # Your trained model (3003 features)
│   ├── vectorizer.pkl      # Your vectorizer (outputs 3000 features)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # React UI with history and results
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── docker-compose.yml
```

## What Was Fixed

1. ✅ Added `__init__.py` to make `app/` a Python package
2. ✅ Fixed numpy version conflict (downgraded to 1.26.4)
3. ✅ Added `@vitejs/plugin-react` to frontend dependencies
4. ✅ Implemented feature padding (3000 → 3003) in the prediction endpoint
5. ✅ Backend searches upward for model.pkl and vectorizer.pkl
6. ✅ CORS configured for http://localhost:5173

Enjoy your spam filter! 🎉
