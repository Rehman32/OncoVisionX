import json
import os
import uuid
from datetime import datetime
from pathlib import Path

class AuditLogger:
    """
    Lightweight, append-only JSONL logger for clinical regulatory traceability.
    Contains NO patient-identifying information (PII).
    """
    def __init__(self, log_dir: str = "logs"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        # We rotate logs daily
        self.current_date = datetime.utcnow().strftime("%Y-%m-%d")
        self.log_file = self.log_dir / f"inference_audit_{self.current_date}.jsonl"

    def log_inference(self, meta_dict: dict, output_dict: dict) -> str:
        """
        Appends an anonymised inference record to the daily log.
        Returns the generated Request UUID.
        """
        request_id = str(uuid.uuid4())
        
        # Check if date rolled over
        new_date = datetime.utcnow().strftime("%Y-%m-%d")
        if new_date != self.current_date:
            self.current_date = new_date
            self.log_file = self.log_dir / f"inference_audit_{self.current_date}.jsonl"

        # Sanitize metadata (ensure no accidental PII is logged)
        safe_meta = {
            "age": meta_dict.get("age", "unknown"),
            "sex": meta_dict.get("sex", "unknown"),
            "anatomical_site": meta_dict.get("anatomical_site", "unknown")
        }

        # Do not log the base64 Grad-CAM image to save disk space
        safe_output = {k: v for k, v in output_dict.items() if k != "saliency_map_b64"}

        log_entry = {
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "metadata": safe_meta,
            "inference_result": safe_output
        }

        with open(self.log_file, "a") as f:
            f.write(json.dumps(log_entry) + "\n")
            
        return request_id