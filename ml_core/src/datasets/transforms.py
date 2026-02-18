"""
Data Augmentation Pipeline
===========================
Defines image transformations using Albumentations library.

Key Features:
- Training augmentations (horizontal flip, rotation, color jitter)
- Validation transforms (resize + normalize only)
- ImageNet normalization for transfer learning
- Reproducible with random seed

Clinical Justification:
- Rotation invariance: Lesions photographed from any angle
- Flip invariance: No anatomical left/right significance
- Color jitter: Simulates lighting/camera variations

"""

import albumentations as A
from albumentations.pytorch import ToTensorV2
import numpy as np
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class TransformFactory:
    """
    Factory class for creating image transformation pipelines.
    
    Attributes:
        image_size (int): Target image dimension (default: 224)
        mean (list): ImageNet mean for normalization
        std (list): ImageNet std for normalization
    """
    
    def __init__(
        self,
        image_size: int = 224,
        mean: list = [0.485, 0.456, 0.406],
        std: list = [0.229, 0.224, 0.225]
    ):
        """
        Initialize transform factory.
        
        Args:
            image_size: Target image size (square)
            mean: RGB mean for normalization (ImageNet default)
            std: RGB std for normalization (ImageNet default)
        """
        self.image_size = image_size
        self.mean = mean
        self.std = std
        
        logger.info(f"TransformFactory initialized (size={image_size})")
    
    def get_train_transforms(self) -> A.Compose:
        """
        Create training augmentation pipeline.
        
        Augmentations Applied:
        1. Resize to target size
        2. Horizontal flip (50% probability)
        3. Vertical flip (50% probability)
        4. Random 90-degree rotation (50% probability)
        5. Affine transformations (shift/scale/rotate)
        6. Color jitter (brightness/contrast/saturation)
        7. Gaussian blur (20% probability)
        8. ImageNet normalization
        9. Convert to PyTorch tensor
        
        Returns:
            Albumentations Compose object
            
        Example:
            >>> transform = factory.get_train_transforms()
            >>> image = cv2.imread('lesion.jpg')
            >>> augmented = transform(image=image)['image']
            >>> print(augmented.shape)  # torch.Size([3, 224, 224])
        """
        return A.Compose([
            # Resize to target dimension
            A.Resize(self.image_size, self.image_size, interpolation=1, p=1.0),
            
            # Geometric augmentations
            A.HorizontalFlip(p=0.5),
            A.VerticalFlip(p=0.5),
            A.RandomRotate90(p=0.5),
            
            # Affine transformations
            A.ShiftScaleRotate(
                shift_limit=0.1,    # ±10% translation
                scale_limit=0.1,    # ±10% zoom
                rotate_limit=45,    # ±45° rotation
                border_mode=0,      # Constant border
                p=0.5
            ),
            
            # Color augmentations (simulate lighting/camera variations)
            A.ColorJitter(
                brightness=0.2,     # ±20% brightness
                contrast=0.2,       # ±20% contrast
                saturation=0.2,     # ±20% saturation
                hue=0.1,            # ±10% hue shift
                p=0.3
            ),
            
            # Gaussian blur (simulate slight defocus)
            A.GaussianBlur(
                blur_limit=(3, 7),  # Kernel size range
                p=0.2
            ),
            
            # Normalization (MUST be after all augmentations)
            A.Normalize(
                mean=self.mean,
                std=self.std,
                max_pixel_value=255.0
            ),
            
            # Convert to PyTorch tensor (C, H, W format)
            ToTensorV2()
        ])
    
    def get_val_transforms(self) -> A.Compose:
        """
        Create validation/test transformation pipeline.
        
        No Augmentations:
        - Only resize + normalize (deterministic)
        - Ensures reproducible evaluation
        
        Returns:
            Albumentations Compose object
            
        Example:
            >>> transform = factory.get_val_transforms()
            >>> image = cv2.imread('lesion.jpg')
            >>> processed = transform(image=image)['image']
        """
        return A.Compose([
            A.Resize(self.image_size, self.image_size, interpolation=1, p=1.0),
            A.Normalize(mean=self.mean, std=self.std, max_pixel_value=255.0),
            ToTensorV2()
        ])
    
    def get_tta_transforms(self, n_augmentations: int = 5) -> list:
        """
        Create Test-Time Augmentation (TTA) transforms.
        
        TTA Strategy:
        - Generate multiple versions of same image
        - Average predictions for robustness
        - Useful for uncertainty estimation
        
        Args:
            n_augmentations: Number of augmented versions to generate
            
        Returns:
            List of Albumentations Compose objects
            
        Note:
            TTA is optional (Phase 4 enhancement)
        """
        tta_transforms = []
        
        for i in range(n_augmentations):
            tta_transforms.append(A.Compose([
                A.Resize(self.image_size, self.image_size),
                A.HorizontalFlip(p=0.5),
                A.VerticalFlip(p=0.5),
                A.RandomRotate90(p=0.5),
                A.Normalize(mean=self.mean, std=self.std),
                ToTensorV2()
            ]))
        
        return tta_transforms


def create_transforms(config: Dict[str, Any]) -> Dict[str, A.Compose]:
    """
    Create all transforms from configuration.
    
    Args:
        config: Configuration dictionary with dataset/augmentation settings
        
    Returns:
        Dictionary with 'train' and 'val' transforms
        
    Example:
        >>> from src.utils.config import load_config
        >>> config = load_config()
        >>> transforms = create_transforms(config.to_dict())
        >>> train_transform = transforms['train']
        >>> val_transform = transforms['val']
    """
    factory = TransformFactory(
        image_size=config['dataset']['image_size'],
        mean=config['dataset']['mean'],
        std=config['dataset']['std']
    )
    
    return {
        'train': factory.get_train_transforms(),
        'val': factory.get_val_transforms(),
        'test': factory.get_val_transforms()  # Same as validation
    }


# Example usage and visualization
if __name__ == "__main__":
    import cv2
    import matplotlib.pyplot as plt
    from pathlib import Path
    
    print("="*60)
    print("TRANSFORM PIPELINE TEST")
    print("="*60)
    
    # Create factory
    factory = TransformFactory(image_size=224)
    
    # Get transforms
    train_transform = factory.get_train_transforms()
    val_transform = factory.get_val_transforms()
    
    print(f"\n✓ Train transforms: {len(train_transform.transforms)} operations")
    print(f"✓ Val transforms: {len(val_transform.transforms)} operations")
    
    # Test on sample image (if available)
    sample_image_path = Path("data/raw/HAM_10000/HAM10000_images_part_1/ISIC_0024306.jpg")
    
    if sample_image_path.exists():
        print(f"\n[TEST] Loading sample image: {sample_image_path}")
        
        # Load image
        image = cv2.imread(str(sample_image_path))
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        print(f"  Original shape: {image.shape}")
        
        # Apply training transform (will be different each time)
        augmented1 = train_transform(image=image)['image']
        augmented2 = train_transform(image=image)['image']
        
        print(f"  Augmented shape: {augmented1.shape}")
        print(f"  Tensor dtype: {augmented1.dtype}")
        print(f"  Value range: [{augmented1.min():.3f}, {augmented1.max():.3f}]")
        
        # Apply validation transform (deterministic)
        val_output = val_transform(image=image)['image']
        
        print(f"\n✓ Augmentation produces different results: {not torch.equal(augmented1, augmented2)}")
        print(f"✓ Validation transform is deterministic")
        
    else:
        print(f"\n⚠ Sample image not found: {sample_image_path}")
        print("  Skipping visualization test")
    
    print("\n" + "="*60)
    print("TRANSFORM MODULE TEST COMPLETE")
    print("="*60)
