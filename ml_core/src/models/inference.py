import cv2
import json
import time
import torch
import torch.nn.functional as F
import numpy as np
import faiss
import base64
from pathlib import Path
from PIL import Image

from src.models.classifier import MultimodalSkinClassifier
from src.preprocessing.dataset import get_transforms

class SkinTriagePipeline:
    """
    Enterprise ML Orchestration Pipeline.
    Strictly follows: Quality Gate -> OOD Check -> Forward Pass -> Conformal Risk Control.
    """
    def __init__(self, model_path: str, faiss_path: str, calib_path: str, device: str = 'cpu'):
        self.device = torch.device(device)
        self.classes = ['akiec', 'bcc', 'bkl', 'df', 'mel', 'nv', 'scc', 'vasc']
        
        # 1. Load Calibration Params
        with open(calib_path, 'r') as f:
            calib = json.load(f)
            self.temperature = calib['temperature']
            self.q_hat = calib['conformal_quantile_90']
        
        # 2. Load FAISS (Visual Only)
        self.ood_index = faiss.read_index(faiss_path)
        self.ood_threshold = 0.80  # Configurable minimum cosine similarity
        
        # 3. Load Model
        self.model = MultimodalSkinClassifier(pretrained=False).to(self.device)
        checkpoint = torch.load(model_path, map_location=self.device, weights_only=False)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.model.eval()
        
        # 4. Load Base Transforms
        self.transform = get_transforms('test')

    def _quality_gate(self, image_np: np.ndarray, blur_threshold: float = 100.0) -> dict:
        """Calculates Laplacian variance for blur detection."""
        gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        if variance < blur_threshold:
            return {"passed": False, "variance": variance, "reason": "High Blur Detected"}
        return {"passed": True, "variance": variance}

    def _check_ood(self, image_tensor: torch.Tensor) -> float:
        """Extracts 768-D visual feature and checks FAISS Cosine Similarity."""
        with torch.no_grad():
            v_features = self.model.backbone(image_tensor)
            v_features = F.normalize(v_features, p=2, dim=1)
            query = v_features.cpu().numpy().astype('float32')
            
        distances, _ = self.ood_index.search(query, k=1)
        return float(distances[0][0])

    def _apply_infer(self, image_np: np.ndarray, meta_tensor: torch.Tensor) -> torch.Tensor:
        """Runs the image and metadata through the multimodal network."""
        image_tensor = self.transform(image=image_np)['image'].unsqueeze(0).to(self.device)
        with torch.no_grad():
            logits = self.model(image_tensor, meta_tensor)
        return logits

    def _conformal_predict(self, logits: torch.Tensor) -> tuple:
        """Applies Temperature Scaling and constructs guaranteed Prediction Set."""
        calibrated_logits = logits / self.temperature
        probs = torch.softmax(calibrated_logits, dim=1).squeeze().cpu().numpy()
        
        # Prediction Set: Include all classes where 1 - prob <= q_hat
        prediction_set = []
        for i, p in enumerate(probs):
            if 1.0 - p <= self.q_hat:
                prediction_set.append(self.classes[i])
                
        return prediction_set, probs

    def predict(self, image_path: str, meta_tensor: torch.Tensor) -> dict:
        """Main Public Interface for FastAPI to call."""
        start_time = time.time()
        
        # 1. Load Image
        image = Image.open(image_path).convert('RGB')
        image_np = np.array(image)
        
        # 2. Quality Gate
        q_result = self._quality_gate(image_np)
        if not q_result["passed"]:
            return {"decision": "REJECT_QUALITY", "blur_variance": q_result["variance"]}
            
        # 3. Base Transform for OOD
        base_tensor = self.transform(image=image_np)['image'].unsqueeze(0).to(self.device)
        
        # 4. OOD Detection (Visual Only)
        ood_sim = self._check_ood(base_tensor)
        if ood_sim < self.ood_threshold:
            return {"decision": "REJECT_OOD", "ood_similarity": ood_sim}
            
        # 5. Inference
        logits = self._apply_infer(image_np, meta_tensor)
        
        # 6. Conformal Risk Control
        pred_set, probs = self._conformal_predict(logits)
        
        # 7. Decision Logic
        if len(pred_set) == 1:
            decision = "ACCEPT"
            pred_class = pred_set[0]
            # TODO: Generate Grad-CAM here
        else:
            decision = "DEFER_TO_DOCTOR"
            pred_class = "UNCERTAIN"
            
        # 8. Compute classic entropy
        entropy_val = float(-np.sum(probs * np.log(probs + 1e-9)))
        
        return {
            "decision": decision,
            "prediction_set": pred_set,
            "predicted_class": pred_class,
            "confidence": float(np.max(probs)),
            "entropy": entropy_val,
            "ood_similarity": ood_sim,
            "coverage_guarantee": 0.90,
            "blur_variance": q_result["variance"],
            "inference_time_ms": (time.time() - start_time) * 1000
        }