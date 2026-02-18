"""
Data Visualization Utilities
=============================
Tools for visualizing dataset samples and model predictions.

Critical for QA:
- Verifies transforms work correctly
- Catches labeling errors
- Identifies data quality issues BEFORE training

Author: [Your Name]
Date: February 2026
"""

import torch
import matplotlib.pyplot as plt
import numpy as np
from pathlib import Path
from typing import List, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


def denormalize_image(
    image: torch.Tensor,
    mean: List[float] = [0.485, 0.456, 0.406],
    std: List[float] = [0.229, 0.224, 0.225]
) -> np.ndarray:
    """
    Reverse ImageNet normalization for visualization.
    
    Args:
        image: Normalized tensor of shape (C, H, W)
        mean: RGB mean used in normalization
        std: RGB std used in normalization
        
    Returns:
        Denormalized image as numpy array (H, W, C) in [0, 1]
    """
    # Clone to avoid modifying original
    image = image.clone()
    
    # Denormalize: x_original = (x_normalized * std) + mean
    for channel in range(3):
        image[channel] = image[channel] * std[channel] + mean[channel]
    
    # Clamp to [0, 1]
    image = torch.clamp(image, 0, 1)
    
    # Convert to numpy (H, W, C)
    image = image.permute(1, 2, 0).cpu().numpy()
    
    return image


def visualize_batch(
    dataloader,
    class_names: List[str],
    num_images: int = 16,
    save_path: Optional[str] = None,
    title: str = "Training Batch Samples"
):
    """
    Visualize a batch of images with labels.
    
    Args:
        dataloader: PyTorch DataLoader
        class_names: List of class names (ordered by index)
        num_images: Number of images to display (max 16)
        save_path: Path to save figure (if None, displays only)
        title: Figure title
        
    Example:
        >>> visualize_batch(
        ...     dataloader=train_loader,
        ...     class_names=['akiec', 'bcc', 'bkl', 'df', 'mel', 'nv', 'scc', 'vasc'],
        ...     num_images=16,
        ...     save_path='logs/sanity_check_train.png'
        ... )
    """
    logger.info(f"Creating visualization with {num_images} images...")
    
    # Get one batch
    images, labels = next(iter(dataloader))
    
    # Limit to num_images
    images = images[:num_images]
    labels = labels[:num_images]
    
    # Calculate grid dimensions
    grid_size = int(np.ceil(np.sqrt(num_images)))
    
    # Create figure
    fig, axes = plt.subplots(grid_size, grid_size, figsize=(15, 15))
    axes = axes.flatten()
    
    for idx in range(num_images):
        ax = axes[idx]
        
        # Denormalize image
        image = denormalize_image(images[idx])
        
        # Get label
        label_idx = labels[idx].item()
        label_name = class_names[label_idx]
        
        # Display image
        ax.imshow(image)
        ax.set_title(f"{label_name}", fontsize=10, fontweight='bold')
        ax.axis('off')
    
    # Hide extra subplots
    for idx in range(num_images, len(axes)):
        axes[idx].axis('off')
    
    plt.suptitle(title, fontsize=16, fontweight='bold', y=0.98)
    plt.tight_layout()
    
    # Save or show
    if save_path:
        save_path = Path(save_path)
        save_path.parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        logger.info(f"✓ Visualization saved: {save_path}")
    else:
        plt.show()
    
    plt.close()


def visualize_class_distribution(
    datasets: dict,
    class_names: List[str],
    save_path: Optional[str] = None
):
    """
    Create bar plot comparing class distribution across splits.
    
    Args:
        datasets: Dictionary with 'train', 'val', 'test' datasets
        class_names: List of class names
        save_path: Path to save figure
    """
    logger.info("Creating class distribution plot...")
    
    # Collect distributions
    distributions = {}
    for split_name, dataset in datasets.items():
        dist = dataset.get_class_distribution()
        distributions[split_name] = [dist.get(cls, 0) for cls in class_names]
    
    # Create plot
    fig, ax = plt.subplots(figsize=(12, 6))
    
    x = np.arange(len(class_names))
    width = 0.25
    
    ax.bar(x - width, distributions['train'], width, label='Train', color='steelblue')
    ax.bar(x, distributions['val'], width, label='Val', color='orange')
    ax.bar(x + width, distributions['test'], width, label='Test', color='green')
    
    ax.set_xlabel('Diagnosis Class', fontsize=12, fontweight='bold')
    ax.set_ylabel('Number of Samples', fontsize=12, fontweight='bold')
    ax.set_title('Class Distribution Across Splits', fontsize=14, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels(class_names)
    ax.legend()
    ax.grid(axis='y', alpha=0.3)
    
    plt.tight_layout()
    
    if save_path:
        save_path = Path(save_path)
        save_path.parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        logger.info(f"✓ Distribution plot saved: {save_path}")
    else:
        plt.show()
    
    plt.close()


def visualize_augmentations(
    dataset,
    image_idx: int = 0,
    num_augmentations: int = 9,
    save_path: Optional[str] = None
):
    """
    Show effect of augmentations on a single image.
    
    Args:
        dataset: SkinLesionDataset with training transforms
        image_idx: Index of image to augment
        num_augmentations: Number of augmented versions to show
        save_path: Path to save figure
    """
    logger.info(f"Visualizing augmentations for image {image_idx}...")
    
    # Create grid
    grid_size = int(np.ceil(np.sqrt(num_augmentations)))
    fig, axes = plt.subplots(grid_size, grid_size, figsize=(12, 12))
    axes = axes.flatten()
    
    # Get multiple augmented versions of same image
    for idx in range(num_augmentations):
        ax = axes[idx]
        
        # Load image (will be augmented differently each time)
        image, label = dataset[image_idx]
        
        # Denormalize
        image = denormalize_image(image)
        
        # Display
        ax.imshow(image)
        ax.set_title(f"Augmentation {idx+1}", fontsize=10)
        ax.axis('off')
    
    # Hide extra subplots
    for idx in range(num_augmentations, len(axes)):
        axes[idx].axis('off')
    
    plt.suptitle(f"Data Augmentation Examples (Image #{image_idx})", 
                 fontsize=14, fontweight='bold')
    plt.tight_layout()
    
    if save_path:
        save_path = Path(save_path)
        save_path.parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        logger.info(f"✓ Augmentation viz saved: {save_path}")
    else:
        plt.show()
    
    plt.close()


# Example usage
if __name__ == "__main__":
    from src.utils.config import load_config
    from src.datasets.dataloader import create_dataloaders_from_config
    
    print("="*60)
    print("VISUALIZATION MODULE TEST")
    print("="*60)
    
    # Load config
    config = load_config()
    
    try:
        # Create dataloaders
        print("\n[1/3] Creating dataloaders...")
        dataloaders, datasets = create_dataloaders_from_config(config)
        
        # Visualize training batch
        print("\n[2/3] Visualizing training batch...")
        visualize_batch(
            dataloader=dataloaders['train'],
            class_names=config.dataset.class_names,
            num_images=16,
            save_path="logs/sanity_check_train.png",
            title="Training Batch (with Augmentations)"
        )
        
        # Visualize class distribution
        print("\n[3/3] Creating class distribution plot...")
        visualize_class_distribution(
            datasets=datasets,
            class_names=config.dataset.class_names,
            save_path="logs/class_distribution.png"
        )
        
        # Visualize augmentations
        print("\n[BONUS] Visualizing augmentation effects...")
        visualize_augmentations(
            dataset=datasets['train'],
            image_idx=0,
            num_augmentations=9,
            save_path="logs/augmentation_examples.png"
        )
        
        print("\n" + "="*60)
        print("VISUALIZATION COMPLETE")
        print("="*60)
        print("\nGenerated files:")
        print("  - logs/sanity_check_train.png")
        print("  - logs/class_distribution.png")
        print("  - logs/augmentation_examples.png")
        
    except Exception as e:
        print(f"\n❌ Visualization test failed: {e}")
        logger.exception("Full traceback:")
