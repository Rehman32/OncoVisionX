"""
End-to-End Data Pipeline Test
==============================
Validates entire preprocessing + loading pipeline before training.

Run this BEFORE starting model training to catch issues early.

Usage:
    python test_pipeline.py
    
Expected runtime: 30-60 seconds

"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from utils.config import load_config
from datasets.dataloader import create_dataloaders_from_config, compute_class_weights
from utils.visualize import visualize_batch, visualize_class_distribution, visualize_augmentations
import torch
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    print("\n" + "="*70)
    print("ONCOVISIONX - DATA PIPELINE VALIDATION")
    print("="*70)
    
    try:
        # Step 1: Load configuration
        print("\n[1/7] Loading configuration...")
        config = load_config("config/config.yaml")
        print(f"✓ Config loaded: {config.project.name} v{config.project.version}")
        
        # Step 2: Validate paths
        print("\n[2/7] Validating file paths...")
        config.validate_paths(Path.cwd())
        print("✓ All critical files exist")
        
        # Step 3: Compute class weights
        print("\n[3/7] Computing class weights...")
        class_weights = compute_class_weights(
            csv_path=config.paths.train_csv,
            class_to_idx=config.dataset.class_to_idx
        )
        print(f"✓ Class weights computed (ratio: {class_weights.max()/class_weights.min():.2f}:1)")
        
        # Step 4: Create dataloaders
        print("\n[4/7] Creating dataloaders (this may take 10-20 seconds)...")
        dataloaders, datasets = create_dataloaders_from_config(config)
        
        print("✓ Dataloaders created:")
        for split, loader in dataloaders.items():
            print(f"    {split:5s}: {len(loader):4d} batches ({len(datasets[split]):6,} images)")
        
        # Step 5: Test batch loading
        print("\n[5/7] Testing batch loading from each split...")
        for split, loader in dataloaders.items():
            images, labels = next(iter(loader))
            print(f"  {split:5s}: images {images.shape}, labels {labels.shape}")
            assert images.shape[1:] == (3, config.dataset.image_size, config.dataset.image_size), \
                f"Image shape mismatch for {split}"
        print("✓ All splits loading correctly")
        
        # Step 6: Create visualizations
        print("\n[6/7] Generating sanity check visualizations...")
        
        # Training batch
        visualize_batch(
            dataloader=dataloaders['train'],
            class_names=config.dataset.class_names,
            num_images=16,
            save_path="logs/sanity_check_train.png",
            title="Training Batch (with Augmentations)"
        )
        
        # Validation batch
        visualize_batch(
            dataloader=dataloaders['val'],
            class_names=config.dataset.class_names,
            num_images=16,
            save_path="logs/sanity_check_val.png",
            title="Validation Batch (no Augmentations)"
        )
        
        # Class distribution
        visualize_class_distribution(
            datasets=datasets,
            class_names=config.dataset.class_names,
            save_path="logs/class_distribution.png"
        )
        
        # Augmentation examples
        visualize_augmentations(
            dataset=datasets['train'],
            image_idx=0,
            num_augmentations=9,
            save_path="logs/augmentation_examples.png"
        )
        
        print("✓ Visualizations saved to logs/")
        
        # Step 7: Final summary
        print("\n[7/7] Pipeline validation summary...")
        print("\n" + "="*70)
        print("✅ DATA PIPELINE VALIDATION COMPLETE")
        print("="*70)
        
        print("\n📊 Dataset Statistics:")
        print(f"  Total images: {len(datasets['train']) + len(datasets['val']) + len(datasets['test']):,}")
        print(f"  Train: {len(datasets['train']):,} ({len(datasets['train'])/(len(datasets['train'])+len(datasets['val'])+len(datasets['test']))*100:.1f}%)")
        print(f"  Val:   {len(datasets['val']):,} ({len(datasets['val'])/(len(datasets['train'])+len(datasets['val'])+len(datasets['test']))*100:.1f}%)")
        print(f"  Test:  {len(datasets['test']):,} ({len(datasets['test'])/(len(datasets['train'])+len(datasets['val'])+len(datasets['test']))*100:.1f}%)")
        
        print("\n🎯 Next Steps:")
        print("  1. Review visualizations in logs/ directory")
        print("  2. Verify labels match images (sanity_check_*.png)")
        print("  3. Confirm augmentations look reasonable (augmentation_examples.png)")
        print("  4. If all looks good → Proceed to Phase 2 (Model Training)")
        
        print("\n💾 Generated Files:")
        print("  - logs/sanity_check_train.png")
        print("  - logs/sanity_check_val.png")
        print("  - logs/class_distribution.png")
        print("  - logs/augmentation_examples.png")
        
        return True
        
    except Exception as e:
        print(f"\n❌ PIPELINE VALIDATION FAILED")
        print(f"Error: {e}")
        logger.exception("Full traceback:")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
