import sys
import json
from pathlib import Path
from pprint import pprint

# Ensure the local src package is discoverable
sys.path.insert(0, str(Path(__file__).parent))

from src.models.inference import SkinTriagePipeline

def main():
    base_dir = Path(__file__).parent
    
    # 1. Define Artifact Paths
    checkpoints_dir = base_dir / "checkpoints"
    model_path = checkpoints_dir / "multimodal_convnext_tiny_best.pth"
    faiss_path = checkpoints_dir / "visual_ood_index.faiss"
    calib_path = checkpoints_dir / "calibration.json"

    # Strict path validation
    for p in [model_path, faiss_path, calib_path]:
        if not p.exists():
            print(f"❌ ERROR: Missing critical artifact at {p}")
            sys.exit(1)

    # 2. Initialize the Orchestration Pipeline
    print("⏳ Initializing SkinTriagePipeline (Loading weights into CPU RAM)...")
    try:
        pipeline = SkinTriagePipeline(
            model_path=str(model_path),
            faiss_path=str(faiss_path),
            calib_path=str(calib_path),
            device="cpu"  # Enforce CPU execution for local testing
        )
        print("✅ Pipeline Initialized Successfully!")
    except Exception as e:
        print(f"❌ ERROR initializing pipeline: {str(e)}")
        sys.exit(1)

    # 3. Define Test Inputs
    # IMPORTANT: You must place any random JPEG image here for the test
    test_image = base_dir / "test_image.jpg" 
    
    if not test_image.exists():
        print(f"\n⚠️ Action Required: Please place a dummy image named 'test_image.jpg' in the root directory: {base_dir}")
        print("Then run this script again.")
        sys.exit(1)

    test_metadata = {
        "age": 55.0,
        "sex": "male",
        "anatomical_site": "back"
    }

    # 4. Execute Full Pipeline
    print(f"\n🚀 Running Inference on {test_image.name}...")
    try:
        result = pipeline.predict(str(test_image), test_metadata)
        
        # Truncate the massive base64 string for clean terminal output
        if "saliency_map_b64" in result and result["saliency_map_b64"]:
            result["saliency_map_b64"] = result["saliency_map_b64"][:40] + "... [TRUNCATED]"

        print("\n" + "="*60)
        print("🏆 INFERENCE PIPELINE OUTPUT 🏆")
        print("="*60)
        pprint(result, sort_dicts=False)
        print("="*60)
        
        print("\n✅ Check your 'logs' folder. An audit JSONL file should have been generated.")
        
    except Exception as e:
        print(f"❌ ERROR during prediction: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()