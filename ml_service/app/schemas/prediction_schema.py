from pydantic import BaseModel, Field
from typing import List, Optional

class InferenceResponse(BaseModel):
    """
    Strict API contract for the frontend/Node backend.
    Enforces the exact data types and fields expected from the ML orchestrator.
    """
    request_id: str = Field(..., description="Unique UUID for audit logging")
    decision: str = Field(..., description="ACCEPT, DEFER_TO_DOCTOR, REJECT_QUALITY, or REJECT_OOD")
    prediction_set: Optional[List[str]] = Field(None, description="Conformal prediction set of classes")
    predicted_class: Optional[str] = Field(None, description="Final predicted class if accepted")
    confidence: Optional[float] = Field(None, description="Max softmax probability after temperature scaling")
    entropy: Optional[float] = Field(None, description="Shannon entropy of the distribution")
    ood_similarity: Optional[float] = Field(None, description="Cosine similarity in FAISS visual index")
    coverage_guarantee: Optional[float] = Field(None, description="Target conformal coverage (e.g., 0.90)")
    blur_variance: Optional[float] = Field(None, description="Laplacian variance score")
    saliency_map_b64: Optional[str] = Field(None, description="Base64 PNG of Grad-CAM++ overlay")
    inference_time_ms: float = Field(..., description="Total execution time in milliseconds")