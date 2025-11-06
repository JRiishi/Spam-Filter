import os
import pickle
import joblib
from typing import Any, Optional

MODEL: Optional[Any] = None
VECTORIZER: Optional[Any] = None


def _load_pickle(path: str):
    if not os.path.exists(path):
        raise FileNotFoundError(f"File not found: {path}")
    # prefer joblib for sklearn objects, but try both
    try:
        return joblib.load(path)
    except Exception:
        with open(path, "rb") as f:
            return pickle.load(f)


def load_model_and_vectorizer(model_path: str, vectorizer_path: str):
    """Load model and vectorizer, set global MODEL and VECTORIZER.

    Raises FileNotFoundError if either does not exist. Returns a tuple (model, vectorizer).
    """
    global MODEL, VECTORIZER
    MODEL = _load_pickle(model_path)
    VECTORIZER = _load_pickle(vectorizer_path)
    return MODEL, VECTORIZER


def get_model():
    return MODEL


def get_vectorizer():
    return VECTORIZER
