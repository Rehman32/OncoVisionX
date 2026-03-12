import cv2
import json
import time
import torch
import torch.nn.functional as F
import numpy as np
import faiss
from PIL import Image
from pathlib import Path

from src.models.classifier import MultimodalSkinClassifier
from src.preprocessing.dataset import get_transforms
from src.explainability.gradcam import ConvNeXtGradCAM
from src.utils.audit import AuditLogger

class SkinTriagePipeline:
    """
    Enterprise ML Orchestration Pipeline.
    Strictly follows: Quality Gate -> OOD Check -> TTA Forward Pass -> Conformal Risk Control.
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
        # CALIBRATED: ISIC images score ~0.63, adversarial images score ~0.14
        self.ood_threshold = 0.45  
        
        # 3. Load Model
        self.model = MultimodalSkinClassifier(pretrained=False).to(self.device)
        checkpoint = torch.load(model_path, map_location=self.device, weights_only=False)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.model.eval()
        
        # 4. Load Base Transforms
        self.transform = get_transforms('test')

        # 5. Initialize Explainability & Logging
        self.gradcam = ConvNeXtGradCAM(self.model)
        self.logger = AuditLogger(log_dir=str(Path(__file__).resolve().parents[2] / "logs"))

    def _quality_gate(self, image_np: np.ndarray, blur_threshold: float = 10.0) -> dict:
        """Calculates Laplacian variance for blur detection. Tuned for macro dermoscopy."""
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

    def _parse_metadata(self, meta_dict: dict) -> torch.Tensor:
        """Parses clinical dict into the 19-D tensor expected by the MLP."""
        sex_cats = ['male', 'female', 'unknown']
        loc_cats = ['abdomen', 'acral', 'back', 'chest', 'ear', 'face', 'foot', 'genital', 'hand', 'lower extremity', 'neck', 'scalp', 'trunk', 'unknown', 'upper extremity']
        
        age = float(meta_dict.get('age', 50.0)) / 100.0
        
        sex = str(meta_dict.get('sex', 'unknown')).lower()
        if sex not in sex_cats: sex = 'unknown'
        sex_onehot = [1.0 if sex == cat else 0.0 for cat in sex_cats]
        
        loc = str(meta_dict.get('anatomical_site', 'unknown')).lower()
        if loc not in loc_cats: loc = 'unknown'
        loc_onehot = [1.0 if loc == cat else 0.0 for cat in loc_cats]
        
        meta_vector = [age] + sex_onehot + loc_onehot
        return torch.tensor([meta_vector], dtype=torch.float32).to(self.device)

    def _apply_tta_and_infer(self, image_np: np.ndarray, meta_tensor: torch.Tensor) -> tuple:
        """Applies 3-pass Test-Time Augmentation to stabilize predictions."""
        # 1. Base Image
        t1 = self.transform(image=image_np)['image'].unsqueeze(0).to(self.device)
        # 2. Horizontal Flip
        t2 = self.transform(image=cv2.flip(image_np, 1))['image'].unsqueeze(0).to(self.device)
        # 3. Vertical Flip
        t3 = self.transform(image=cv2.flip(image_np, 0))['image'].unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            l1 = self.model(t1, meta_tensor)
            l2 = self.model(t2, meta_tensor)
            l3 = self.model(t3, meta_tensor)
            
        avg_logits = (l1 + l2 + l3) / 3.0
        return avg_logits, t1

    def _conformal_predict(self, logits: torch.Tensor) -> tuple:
        """Applies Temperature Scaling and constructs guaranteed Prediction Set."""
        calibrated_logits = logits / self.temperature
        probs = torch.softmax(calibrated_logits, dim=1).squeeze().cpu().numpy()
        
        prediction_set = []
        for i, p in enumerate(probs):
            if 1.0 - p <= self.q_hat:
                prediction_set.append(self.classes[i])
                
        return prediction_set, probs

    def predict(self, image_path: str, meta_dict: dict) -> dict:
        """Main Public Interface for FastAPI to call."""
        start_time = time.time()
        
        # 1. Load Image
        image = Image.open(image_path).convert('RGB')
        image_np = np.array(image)
        
        # 2. Quality Gate
        q_result = self._quality_gate(image_np)
        if not q_result["passed"]:
            output = {"decision": "REJECT_QUALITY", "blur_variance": q_result["variance"]}
            self.logger.log_inference(meta_dict, output)
            return output
            
        # 3. Base Transform for OOD
        base_tensor = self.transform(image=image_np)['image'].unsqueeze(0).to(self.device)
        
        # 4. OOD Detection (Visual Only)
        ood_sim = self._check_ood(base_tensor)
        if ood_sim < self.ood_threshold:
            output = {"decision": "REJECT_OOD", "ood_similarity": ood_sim}
            self.logger.log_inference(meta_dict, output)
            return output
            
        # 5. Metadata Processing
        meta_tensor = self._parse_metadata(meta_dict)
        
        # 6. TTA & Inference
        logits, inference_tensor = self._apply_tta_and_infer(image_np, meta_tensor)
        
        # 7. Conformal Risk Control
        pred_set, probs = self._conformal_predict(logits)
        
        # 8. Decision Logic & Explainability
        gradcam_b64 = None
        if len(pred_set) == 1:
            decision = "ACCEPT"
            pred_class = pred_set[0]
            # Generate visual explanation only for accepted predictions
            gradcam_b64 = self.gradcam.generate(inference_tensor, int(np.argmax(probs)), image_np)
        else:
            decision = "DEFER_TO_DOCTOR"
            pred_class = "UNCERTAIN"
            
        # 9. Compute classic entropy
        entropy_val = float(-np.sum(probs * np.log(probs + 1e-9)))
        
        output = {
            "decision": decision,
            "prediction_set": pred_set,
            "predicted_class": pred_class,
            "confidence": float(np.max(probs)),
            "entropy": entropy_val,
            "ood_similarity": ood_sim,
            "coverage_guarantee": 0.90,
            "blur_variance": q_result["variance"],
            "saliency_map_b64": gradcam_b64,
            "inference_time_ms": (time.time() - start_time) * 1000
        }
        
        request_id = self.logger.log_inference(meta_dict, output)
        output["request_id"] = request_id
        
        return output