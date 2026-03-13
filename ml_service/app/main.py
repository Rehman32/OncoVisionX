from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pathlib import Path
import logging

# Dynamically importing from the ml_core package we installed
from src.pipeline.skin_triage_pipeline import SkinTriagePipeline
from app.api.routes import router as predict_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Absolute paths resolving to ml_service/checkpoints
BASE_DIR = Path(__file__).resolve().parent.parent
CHECKPOINTS_DIR = BASE_DIR / "checkpoints"

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application Lifespan.
    Bootstraps the Multimodal Neural Network and FAISS index into RAM exactly once.
    """
    model_path = CHECKPOINTS_DIR / "multimodal_convnext_tiny_best.pth"
    faiss_path = CHECKPOINTS_DIR / "visual_ood_index.faiss"
    calib_path = CHECKPOINTS_DIR / "calibration.json"
    
    # Pre-flight Check
    if not all(p.exists() for p in [model_path, faiss_path, calib_path]):
        missing = [p.name for p in [model_path, faiss_path, calib_path] if not p.exists()]
        logger.error(f"CRITICAL: Missing ML artifacts: {missing}")
        raise RuntimeError("Failed to locate required model checkpoints in ml_service/checkpoints/")

    logger.info("Initializing SkinTriagePipeline into memory (CPU)...")
    try:
        app.state.pipeline = SkinTriagePipeline(
            model_path=str(model_path),
            faiss_path=str(faiss_path),
            calib_path=str(calib_path),
            device="cpu"
        )
        logger.info("✅ SkinTriagePipeline successfully mounted to app.state.")
    except Exception as e:
        logger.error(f"❌ Failed to load ML pipeline: {e}")
        raise e
        
    yield  # Application handles requests while yielding here
    
    # Graceful Teardown
    logger.info("Shutting down ML resources...")
    app.state.pipeline = None

# Factory Initialization
app = FastAPI(
    title="OncoVisionX Inference API",
    description="Internal microservice for multimodal skin cancer triage",
    version="3.0.0",
    lifespan=lifespan
)

# Register endpoints
app.include_router(predict_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    if getattr(app.state, "pipeline", None) is None:
        raise HTTPException(status_code=503, detail="ML Pipeline not initialized")
    return {"status": "healthy", "pipeline_loaded": True}