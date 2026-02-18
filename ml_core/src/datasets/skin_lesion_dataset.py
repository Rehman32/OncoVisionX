"""
Skin Lesion Dataset
===================
PyTorch Dataset class for loading HAM10000 and ISIC 2019 images.

Features:
- Handles both HAM10000 and ISIC 2019 directory structures
- Lazy loading (images loaded on-demand)
- Configurable transforms
- Error handling for corrupted images
- Progress logging

Author: [Your Name]
Date: February 2026
"""

import torch
from torch.utils.data import Dataset
import pandas as pd
import cv2
import numpy as np
from pathlib import Path
from typing import Optional, Callable, Tuple, Dict
import logging

logger = logging.getLogger(__name__)


class SkinLesionDataset(Dataset):
    """
    PyTorch Dataset for skin lesion images.
    
    Directory Structure Expected:
    data/raw/
    ├── HAM_10000/
    │   ├── HAM10000_images_part_1/
    │   │   └── ISIC_*.jpg
    │   └── HAM10000_images_part_2/
    │       └── ISIC_*.jpg
    └── ISIC_2019/
        └── ISIC_2019_Training_Input/
            └── ISIC_*.jpg
    
    Attributes:
        csv_path (Path): Path to train/val/test CSV
        image_dirs (dict): Mapping of source to image directory
        transform (Callable): Albumentations transform pipeline
        class_to_idx (dict): Diagnosis to index mapping
        data (DataFrame): Metadata (image_id, dx, source)
        
    Example:
        >>> dataset = SkinLesionDataset(
        ...     csv_path='data/processed/train.csv',
        ...     ham_dir='data/raw/HAM_10000',
        ...     isic_dir='data/raw/ISIC_2019/ISIC_2019_Training_Input',
        ...     transform=train_transforms,
        ...     class_to_idx={'mel': 0, 'nv': 1, ...}
        ... )
        >>> image, label = dataset[0]
        >>> print(image.shape, label)
        torch.Size([3, 224, 224]) 4
    """
    
    def __init__(
        self,
        csv_path: str,
        ham_dir: str,
        isic_dir: str,
        transform: Optional[Callable] = None,
        class_to_idx: Optional[Dict[str, int]] = None
    ):
        """
        Initialize dataset.
        
        Args:
            csv_path: Path to CSV (train.csv, val.csv, or test.csv)
            ham_dir: Path to HAM10000 root directory
            isic_dir: Path to ISIC 2019 images directory
            transform: Albumentations transform pipeline
            class_to_idx: Diagnosis label to index mapping
            
        Raises:
            FileNotFoundError: If CSV or image directories missing
            ValueError: If class_to_idx not provided
        """
        self.csv_path = Path(csv_path)
        self.transform = transform
        
        # Validate CSV exists
        if not self.csv_path.exists():
            raise FileNotFoundError(f"CSV file not found: {csv_path}")
        
        # Load metadata
        logger.info(f"Loading dataset from {self.csv_path}")
        self.data = pd.read_csv(self.csv_path)
        
        # Setup image directories
        self.image_dirs = {
            'ham10000': Path(ham_dir),  # flat directory
            'isic2019': Path(isic_dir)
        }
        
        # Validate directories
        self._validate_directories()
        
        # Setup class encoding
        if class_to_idx is None:
            raise ValueError("class_to_idx mapping must be provided")
        
        self.class_to_idx = class_to_idx
        self.idx_to_class = {v: k for k, v in class_to_idx.items()}
        self.num_classes = len(class_to_idx)
        
        # Statistics
        self.class_distribution = self.data['dx'].value_counts().to_dict()
        
        logger.info(f"✓ Dataset initialized: {len(self.data):,} images")
        logger.info(f"  Sources: {self.data['source'].value_counts().to_dict()}")
        logger.info(f"  Classes: {self.class_distribution}")
    
    def _validate_directories(self):
        """
        Validate that image directories exist.
        
        Raises:
            FileNotFoundError: If critical directories missing
        """
        # Check HAM directories
        if not self.image_dirs['ham10000'].exists():
            logger.warning(f"HAM10000 directory not found: {self.image_dirs['ham10000']}")
        
        # Check ISIC directory
        if not self.image_dirs['isic2019'].exists():
            logger.warning(f"ISIC 2019 directory not found: {self.image_dirs['isic2019']}")
    
    def _get_image_path(self, image_id: str, source: str) -> Path:
        """
        Construct full image path based on image ID and source.
        
        Args:
            image_id: Image identifier (e.g., 'ISIC_0024306')
            source: Dataset source ('ham10000' or 'isic2019')
            
        Returns:
            Path object pointing to image file
            
        Strategy:
        - HAM images: Check part_1 first, then part_2
        - ISIC images: Direct lookup in ISIC directory
        """
        file_extension = ".jpg"
        
        if source == 'ham10000':
            return self.image_dirs['ham10000'] / f"{image_id}{file_extension}"

        
        elif source == 'isic2019':
            return self.image_dirs['isic2019'] / f"{image_id}{file_extension}"
        
        else:
            raise ValueError(f"Unknown source: {source}")
    
    def _load_image(self, image_path: Path) -> np.ndarray:
        """
        Load image from disk with error handling.
        
        Args:
            image_path: Path to image file
            
        Returns:
            RGB image as numpy array
            
        Raises:
            FileNotFoundError: If image doesn't exist
            ValueError: If image is corrupted or unreadable
        """
        if not image_path.exists():
            raise FileNotFoundError(f"Image not found: {image_path}")
        
        # Load with OpenCV
        image = cv2.imread(str(image_path))
        
        if image is None:
            raise ValueError(f"Failed to read image (corrupted?): {image_path}")
        
        # Convert BGR to RGB (OpenCV loads as BGR)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        return image
    
    def __len__(self) -> int:
        """Return total number of images."""
        return len(self.data)
    
    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        """
        Get image and label at index.
        
        Args:
            idx: Index in dataset (0 to len-1)
            
        Returns:
            Tuple of (image_tensor, label_index)
            - image_tensor: torch.Tensor of shape (3, H, W)
            - label_index: int (0 to num_classes-1)
            
        Raises:
            FileNotFoundError: If image file missing
            ValueError: If image corrupted
        """
        # Get metadata for this index
        row = self.data.iloc[idx]
        image_id = row['image_id']
        diagnosis = row['dx']
        source = row['source']
        
        # Get full image path
        image_path = self._get_image_path(image_id, source)
        
        # Load image
        try:
            image = self._load_image(image_path)
        except (FileNotFoundError, ValueError) as e:
            logger.error(f"Error loading image {image_id}: {e}")
            # Return black image as fallback (prevents training crash)
            image = np.zeros((224, 224, 3), dtype=np.uint8)
        
        # Apply transforms
        if self.transform is not None:
            transformed = self.transform(image=image)
            image = transformed['image']
        else:
            # If no transform, convert to tensor manually
            image = torch.from_numpy(image).permute(2, 0, 1).float() / 255.0
        
        # Get label index
        label = self.class_to_idx[diagnosis]
        
        return image, label
    
    def get_class_distribution(self) -> Dict[str, int]:
        """
        Get class distribution in dataset.
        
        Returns:
            Dictionary mapping diagnosis to count
        """
        return self.class_distribution
    
    def get_sample_info(self, idx: int) -> Dict[str, any]:
        """
        Get metadata for a specific sample (useful for debugging).
        
        Args:
            idx: Sample index
            
        Returns:
            Dictionary with image_id, diagnosis, source, path
        """
        row = self.data.iloc[idx]
        image_id = row['image_id']
        diagnosis = row['dx']
        source = row['source']
        image_path = self._get_image_path(image_id, source)
        
        return {
            'index': idx,
            'image_id': image_id,
            'diagnosis': diagnosis,
            'label_idx': self.class_to_idx[diagnosis],
            'source': source,
            'path': str(image_path),
            'exists': image_path.exists()
        }


# Example usage
if __name__ == "__main__":
    from src.utils.config import load_config
    from src.datasets.transforms import TransformFactory
    
    print("="*60)
    print("DATASET CLASS TEST")
    print("="*60)
    
    # Load configuration
    project_root = Path(__file__).parent.parent.parent
    config = load_config(str(project_root / "config" / "config.yaml"))
    
    # Create transforms
    factory = TransformFactory(
        image_size=config.dataset.image_size,
        mean=config.dataset.mean,
        std=config.dataset.std
    )
    train_transform = factory.get_train_transforms()
    
    # Create dataset
    try:
        dataset = SkinLesionDataset(
            csv_path=str(project_root / config.paths.train_csv),
            ham_dir=str(project_root / "data/raw/HAM_10000"),
            isic_dir=str(project_root / "data/raw/ISIC_2019/ISIC_2019_Training_Input"),
            transform=train_transform,
            class_to_idx=config.dataset.class_to_idx
        )
        
        print(f"\n✓ Dataset loaded successfully")
        print(f"  Total samples: {len(dataset):,}")
        print(f"  Number of classes: {dataset.num_classes}")
        
        # Test loading first sample
        print(f"\n[TEST] Loading first sample...")
        image, label = dataset[0]
        
        print(f"  Image shape: {image.shape}")
        print(f"  Image dtype: {image.dtype}")
        print(f"  Label: {label} ({dataset.idx_to_class[label]})")
        print(f"  Value range: [{image.min():.3f}, {image.max():.3f}]")
        
        # Test sample info
        info = dataset.get_sample_info(0)
        print(f"\n[SAMPLE INFO]")
        for key, value in info.items():
            print(f"  {key}: {value}")
        
        print("\n" + "="*60)
        print("DATASET TEST COMPLETE")
        print("="*60)
        
    except Exception as e:
        print(f"\n Dataset test failed: {e}")
        print("  Please verify image directories exist")
