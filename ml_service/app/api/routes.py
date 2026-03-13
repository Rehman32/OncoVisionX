import json
import tempfile
import os
from fastapi import APIRouter, Request, UploadFile, File, Form, HTTPException
from app.schemas.prediction_schema import InferenceResponse

router = APIRouter()

@router.post("/predict", response_model=InferenceResponse)
async def predict_lesion(
    request: Request,
    image: UploadFile = File(..., description="Dermoscopic or clinical image"),
    metadata: str = Form(..., description="JSON string containing age, sex, and anatomical_site")
):
    """
    Core Inference Endpoint.
    Validates the multipart input, securely buffers the image, and triggers the Pipeline.
    """
    # 1. Parse and Validate Metadata
    try:
        meta_dict = json.loads(metadata)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in metadata field.")
    
    required_keys = {"age", "sex", "anatomical_site"}
    if not required_keys.issubset(meta_dict.keys()):
        raise HTTPException(status_code=400, detail=f"Metadata must contain: {required_keys}")

    # 2. Extract Pipeline from Application State
    pipeline = request.app.state.pipeline
    if not pipeline:
        raise HTTPException(status_code=503, detail="ML Pipeline is not initialized.")

    tmp_path = None
    try:
        # 3. Secure File I/O
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp_file:
            content = await image.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name

        # 4. Execute ML Orchestration (Calling into the installed ml_core package)
        result = pipeline.predict(image_path=tmp_path, meta_dict=meta_dict)
        
        return InferenceResponse(**result)

    except Exception as e:
        # In a strict production environment, we wouldn't return the raw exception string,
        # but for this stage, it is necessary for debugging.
        raise HTTPException(status_code=500, detail=f"Inference Engine Error: {str(e)}")
    
    finally:
        # Guarantee local memory/disk cleanup regardless of ML failure
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)