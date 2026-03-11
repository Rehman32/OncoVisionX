import os
import pandas as pd
import numpy as np
from PIL import Image
import torch
from torch.utils.data import Dataset, DataLoader
import albumentations as A
from albumentations.pytorch import ToTensorV2

# Fixed categorical mappings for consistency
SEX_CATEGORIES = ['male', 'female', 'unknown']
LOC_CATEGORIES = [
    'abdomen', 'acral', 'back', 'chest', 'ear', 'face', 'foot', 
    'genital', 'hand', 'lower extremity', 'neck', 'scalp', 'trunk', 
    'unknown', 'upper extremity'
]

class MultimodalDataset(Dataset):
    """Smart Dataset that pulls from multiple directories."""
    
    def __init__(self, csv_file, ham_dir, isic_dir, transform=None):
        self.metadata = pd.read_csv(csv_file)
        self.ham_dir = ham_dir
        self.isic_dir = isic_dir
        self.transform = transform
        
        self.class_to_idx = {
            'akiec': 0, 'bcc': 1, 'bkl': 2, 'df': 3,
            'mel': 4, 'nv': 5, 'scc': 6, 'vasc': 7
        }
        
    def __len__(self):
        return len(self.metadata)
        
    def _extract_metadata(self, row):
        """Converts tabular clinical data into a 19-dimensional tensor."""
        age = row.get('age', 50.0)
        if pd.isna(age): age = 50.0
        age_norm = age / 100.0  
        
        sex = str(row.get('sex', 'unknown')).lower()
        if sex not in SEX_CATEGORIES: sex = 'unknown'
        sex_onehot = [1.0 if sex == cat else 0.0 for cat in SEX_CATEGORIES]
        
        loc = str(row.get('localization', 'unknown')).lower()
        if loc not in LOC_CATEGORIES: loc = 'unknown'
        loc_onehot = [1.0 if loc == cat else 0.0 for cat in LOC_CATEGORIES]
        
        meta_vector = [age_norm] + sex_onehot + loc_onehot
        return torch.tensor(meta_vector, dtype=torch.float32)

    def __getitem__(self, idx):
        row = self.metadata.iloc[idx]
        img_id = row['image_id']
        
        # Ensure correct extension
        img_name = img_id if img_id.endswith('.jpg') else f"{img_id}.jpg"
        
        # SMART ROUTING: Check HAM10000 first, fallback to ISIC 2019
        img_path = os.path.join(self.ham_dir, img_name)
        if not os.path.exists(img_path):
            img_path = os.path.join(self.isic_dir, img_name)
            
        image = Image.open(img_path).convert('RGB')
        image = np.array(image)
        
        label_idx = self.class_to_idx[row['dx']]
        meta_tensor = self._extract_metadata(row)
        
        if self.transform:
            augmented = self.transform(image=image)
            image = augmented['image']
            
        return image, meta_tensor, label_idx

def get_transforms(mode='train'):
    """Updated to remove Albumentations deprecation warnings."""
    if mode == 'train':
        return A.Compose([
            A.Resize(224, 224),
            A.RandomRotate90(p=0.5),
            A.HorizontalFlip(p=0.5),
            A.VerticalFlip(p=0.5),
            # 🚨 Upgraded to A.Affine to fix the ShiftScaleRotate warning
            A.Affine(scale=(0.9, 1.1), translate_percent=(0.1, 0.1), rotate=(-45, 45), p=0.5),
            A.RandomBrightnessContrast(brightness_limit=0.2, contrast_limit=0.2, p=0.5),
            A.HueSaturationValue(hue_shift_limit=20, sat_shift_limit=30, val_shift_limit=20, p=0.5),
            A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ToTensorV2()
        ])
    else:
        return A.Compose([
            A.Resize(224, 224),
            A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ToTensorV2()
        ])

def create_dataloaders_from_config(config):
    datasets = {
        # Passing BOTH ham_images and isic_images to the dataset
        'train': MultimodalDataset(config.paths.train_csv, config.paths.ham_images, config.paths.isic_images, get_transforms('train')),
        'val': MultimodalDataset(config.paths.val_csv, config.paths.ham_images, config.paths.isic_images, get_transforms('val')),
        'test': MultimodalDataset(config.paths.test_csv, config.paths.ham_images, config.paths.isic_images, get_transforms('test'))
    }
    
    dataloaders = {
        split: DataLoader(
            datasets[split],
            batch_size=config.training.batch_size,
            shuffle=(split == 'train'),
            num_workers=config.training.num_workers,
            pin_memory=config.training.pin_memory,
            drop_last=(split == 'train')
        ) for split in ['train', 'val', 'test']
    }
    return dataloaders, datasets

def compute_class_weights(csv_path, class_to_idx):
    from sklearn.utils.class_weight import compute_class_weight
    df = pd.read_csv(csv_path)
    labels = df['dx'].map(class_to_idx).values
    classes = np.unique(labels)
    weights = compute_class_weight(class_weight='balanced', classes=classes, y=labels)
    return torch.tensor(weights, dtype=torch.float32)