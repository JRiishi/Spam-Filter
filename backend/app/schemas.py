from pydantic import BaseModel, Field
from typing import Literal, Optional


class PredictionRequest(BaseModel):
    text: str = Field(..., title="Text to classify", min_length=1)


class PredictionResponse(BaseModel):
    label: Literal["spam", "not_spam"]
    probability: float
    raw_score: float


class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None


class HealthResponse(BaseModel):
    status: str = "ok"
