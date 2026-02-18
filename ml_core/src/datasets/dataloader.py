"""
DataLoader Factory & Class Weight Calculator
=============================================
Creates PyTorch DataLoaders with class imbalance handling.

Features:
- Automated class weight calculation
- Configurable batch size and workers
- GPU memory optimization
- Optional weighted sampling for severe imbalance

Author: [Your Name]
Date: February 2026
"""

import torch
from torch.utils.data import DataLoader, WeightedRandomSampler
import pandas as pd
import numpy as np
from typing import Dict, Optional, Tuple
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


def compute_class_weights(
    csv_path: str,
    class_to_idx: Dict[str, int],
    method: str = 'inverse_frequency'
) -> torch.Tensor:
    """
    Calculate class weights for imbalanced dataset.
    
    Formula (Inverse Frequency):
        weight[i] = total_samples / (num_classes * count[i])
    
    This ensures rare classes get higher loss weights.
    
    Args:
        csv_path: Path to train.csv
        class_to_idx: Diagnosis to index mapping
        method: Weighting method ('inverse_frequency' or 'effective_number')
        
    Returns:
        Tensor of shape (num_classes,) with class weights
        
    Example:
        >>> weights = compute_class_weights('data/processed/train.csv', class_to_idx)
        >>> print(weights)
        tensor([3.45, 1.12, 2.34, 8.91, 1.67, 0.82, 5.23, 9.45])
        #       akiec  bcc   bkl    df    mel   nv    scc   vasc
        #       ↑ Higher weight for rare classes
    """
    logger.info(f"Computing class weights from {csv_path}")
    
    # Load data
    df = pd.read_csv(csv_path)
    total_samples = len(df)
    num_classes = len(class_to_idx)
    
    # Count samples per class
    class_counts = df['dx'].value_counts().to_dict()
    
    # Initialize weights array (ordered by class index)
    weights = np.zeros(num_classes)
    
    for diagnosis, idx in class_to_idx.items():
        count = class_counts.get(diagnosis, 0)
        
        if count == 0:
            logger.warning(f"Class '{diagnosis}' has 0 samples!")
            weights[idx] = 1.0
        else:
            if method == 'inverse_frequency':
                # Standard inverse frequency weighting
                weights[idx] = total_samples / (num_classes * count)
            
            elif method == 'effective_number':
                # Effective number of samples (Cui et al., 2019)
                # Reduces weight for extremely imbalanced classes
                beta = 0.9999
                effective_num = 1.0 - np.power(beta, count)
                weights[idx] = (1.0 - beta) / effective_num
            
            else:
                raise ValueError(f"Unknown weighting method: {method}")
    
    # Convert to tensor
    weights_tensor = torch.FloatTensor(weights)
    
    # Log statistics
    logger.info("Class weights computed:")
    for diagnosis, idx in sorted(class_to_idx.items(), key=lambda x: x[1]):
        count = class_counts.get(diagnosis, 0)
        weight = weights[idx]
        logger.info(f"  {diagnosis:6s}: count={count:5,}, weight={weight:.3f}")
    
    return weights_tensor


def create_weighted_sampler(
    csv_path: str,
    class_to_idx: Dict[str, int]
) -> WeightedRandomSampler:
    """
    Create weighted sampler for oversampling minority classes.
    
    Strategy:
    - Each sample gets a weight inversely proportional to its class frequency
    - Rare classes are sampled more frequently during training
    - Ensures model sees balanced distribution per epoch
    
    Args:
        csv_path: Path to train.csv
        class_to_idx: Diagnosis to index mapping
        
    Returns:
        WeightedRandomSampler object
        
    Note:
        Use this OR class weights in loss, not both (double-counting imbalance)
    """
    logger.info("Creating weighted sampler for oversampling")
    
    # Load data
    df = pd.read_csv(csv_path)
    
    # Get class counts
    class_counts = df['dx'].value_counts().to_dict()
    
    # Compute sample weights (inverse of class frequency)
    sample_weights = []
    for diagnosis in df['dx']:
        count = class_counts[diagnosis]
        weight = 1.0 / count
        sample_weights.append(weight)
    
    sample_weights = torch.DoubleTensor(sample_weights)
    
    # Create sampler
    sampler = WeightedRandomSampler(
        weights=sample_weights,
        num_samples=len(sample_weights),
        replacement=True  # Allow same sample multiple times per epoch
    )
    
    logger.info(f"✓ Weighted sampler created ({len(sample_weights):,} samples)")
    
    return sampler


def create_dataloader(
    dataset,
    batch_size: int = 32,
    shuffle: bool = True,
    num_workers: int = 4,
    pin_memory: bool = True,
    sampler: Optional[WeightedRandomSampler] = None
) -> DataLoader:
    """
    Create PyTorch DataLoader with optimized settings.
    
    Args:
        dataset: SkinLesionDataset object
        batch_size: Number of samples per batch
        shuffle: Whether to shuffle data (ignored if sampler provided)
        num_workers: Number of parallel data loading processes
        pin_memory: Pin memory for faster GPU transfer (set True if using GPU)
        sampler: Optional weighted sampler for imbalance handling
        
    Returns:
        DataLoader object
        
    Example:
        >>> train_loader = create_dataloader(
        ...     dataset=train_dataset,
        ...     batch_size=32,
        ...     shuffle=True,
        ...     num_workers=4
        ... )
        >>> for images, labels in train_loader:
        ...     # images: torch.Size([32, 3, 224, 224])
        ...     # labels: torch.Size([32])
        ...     pass
    """
    # If sampler provided, disable shuffle
    if sampler is not None:
        shuffle = False
        logger.info("Using weighted sampler (shuffle disabled)")
    
    dataloader = DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=shuffle,
        num_workers=num_workers,
        pin_memory=pin_memory,
        drop_last=False,  # Keep last incomplete batch
        sampler=sampler,
        prefetch_factor=2 if num_workers > 0 else None,
        persistent_workers=True if num_workers > 0 else False
    )
    
    logger.info(f"✓ DataLoader created:")
    logger.info(f"  Batch size: {batch_size}")
    logger.info(f"  Num workers: {num_workers}")
    logger.info(f"  Total batches: {len(dataloader)}")
    
    return dataloader


def create_dataloaders_from_config(config) -> Dict[str, DataLoader]:
    """
    Create train/val/test dataloaders from configuration.
    
    Args:
        config: Configuration object from config.yaml
        
    Returns:
        Dictionary with 'train', 'val', 'test' DataLoaders
        
    Example:
        >>> from src.utils.config import load_config
        >>> config = load_config()
        >>> dataloaders = create_dataloaders_from_config(config)
        >>> train_loader = dataloaders['train']
    """
    from src.datasets.skin_lesion_dataset import SkinLesionDataset
    from src.datasets.transforms import TransformFactory
    
    project_root = Path.cwd()
    
    # Create transforms
    factory = TransformFactory(
        image_size=config.dataset.image_size,
        mean=config.dataset.mean,
        std=config.dataset.std
    )
    
    transforms_dict = {
        'train': factory.get_train_transforms(),
        'val': factory.get_val_transforms(),
        'test': factory.get_val_transforms()
    }
    
    # Create datasets
    datasets = {}
    for split in ['train', 'val', 'test']:
        csv_path = getattr(config.paths, f"{split}_csv")
        
        datasets[split] = SkinLesionDataset(
            csv_path=str(project_root / csv_path),
            ham_dir=str(project_root / config.paths.ham_images),
            isic_dir=str(project_root / config.paths.isic_images),
            transform=transforms_dict[split],
            class_to_idx=config.dataset.class_to_idx
        )
    
    # Create dataloaders
    dataloaders = {}
    
    # Training dataloader (with optional weighted sampling)
    sampler = None
    if config.training.weighted_sampling:
        sampler = create_weighted_sampler(
            str(project_root / config.paths.train_csv),
            config.dataset.class_to_idx
        )
    
    dataloaders['train'] = create_dataloader(
        dataset=datasets['train'],
        batch_size=config.training.batch_size,
        shuffle=(sampler is None),  # Disable shuffle if using sampler
        num_workers=config.training.num_workers,
        pin_memory=config.training.pin_memory,
        sampler=sampler
    )
    
    # Validation/test dataloaders (no augmentation, no sampling)
    for split in ['val', 'test']:
        dataloaders[split] = create_dataloader(
            dataset=datasets[split],
            batch_size=config.training.batch_size,
            shuffle=False,  # Never shuffle val/test
            num_workers=config.training.num_workers,
            pin_memory=config.training.pin_memory
        )
    
    return dataloaders, datasets


# Example usage
if __name__ == "__main__":
    from src.utils.config import load_config
    
    print("="*60)
    print("DATALOADER MODULE TEST")
    print("="*60)
    
    # Load config
    config = load_config()
    project_root = Path.cwd()
    
    # Test class weight computation
    print("\n[1/3] Computing class weights...")
    try:
        class_weights = compute_class_weights(
            csv_path=str(project_root / config.paths.train_csv),
            class_to_idx=config.dataset.class_to_idx
        )
        print(f"✓ Class weights shape: {class_weights.shape}")
        print(f"  Min weight: {class_weights.min():.3f}")
        print(f"  Max weight: {class_weights.max():.3f}")
        print(f"  Ratio (max/min): {(class_weights.max() / class_weights.min()):.2f}x")
    except FileNotFoundError:
        print("⚠ train.csv not found, skipping weight computation")
    
    # Test dataloader creation
    print("\n[2/3] Creating dataloaders...")
    try:
        dataloaders, datasets = create_dataloaders_from_config(config)
        
        print(f"✓ Dataloaders created:")
        for split, loader in dataloaders.items():
            print(f"  {split:5s}: {len(loader)} batches ({len(datasets[split]):,} images)")
        
        # Test batch loading
        print("\n[3/3] Testing batch loading...")
        train_loader = dataloaders['train']
        images, labels = next(iter(train_loader))
        
        print(f"✓ Batch loaded successfully")
        print(f"  Images shape: {images.shape}")
        print(f"  Labels shape: {labels.shape}")
        print(f"  Batch size: {images.shape[0]}")
        print(f"  Unique labels in batch: {labels.unique().tolist()}")
        
    except FileNotFoundError as e:
        print(f"⚠ Dataloader test failed: {e}")
        print("  Ensure datasets are in correct directories")
    
    print("\n" + "="*60)
    print("DATALOADER MODULE TEST COMPLETE")
    print("="*60)
