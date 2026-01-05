import torch
from torch.utils.data import Dataset
import pandas as pd
import numpy as np
import cv2
import os
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from torchvision import transforms

class GliomaAdvancedDataset(Dataset):
    def __init__(self, master_csv_path, kaggle_folder, mode='train', split_ratio=0.8, slices_per_patient=3):
        """
        Senior Engineer Upgrade:
        1. Slices Per Patient: Takes top N slices instead of 1.
        2. Mode: Separates 'train' and 'val' data to prevent leakage.
        """
        self.mode = mode
        self.slices_per_patient = slices_per_patient
        self.kaggle_folder = kaggle_folder
        
        # 1. Load Master Data
        full_df = pd.read_csv(master_csv_path)

        # --- FIX: DATA SANITIZATION BLOCK (Added this to fix your error) ---
        # 1. Wipe out "Unknown" text
        full_df.replace('Unknown', np.nan, inplace=True)

        # 2. Fix GENDER (Convert Male/Female to 0/1)
        # If your CSV uses different words, adjust 'Male'/'Female' below
        if 'GENDER' in full_df.columns:
            full_df['GENDER'] = full_df['GENDER'].map({'Male': 0, 'Female': 1})

        # 3. Force numeric columns to be numbers (coerces errors to NaN)
        # We include GENDER here to be safe
        numeric_targets = ['AGE', 'GENDER', 'IDH1', 'TP53', 'ATRX', 'CIC', 'PTEN']
        for col in numeric_targets:
            if col in full_df.columns:
                full_df[col] = pd.to_numeric(full_df[col], errors='coerce')
        
        # 4. Fill any remaining gaps with 0 so the model doesn't crash
        full_df[numeric_targets] = full_df[numeric_targets].fillna(0.0)
        # -------------------------------------------------------------------
        
        # 2. Split Patients (NOT Slices) to ensure no data leakage
        unique_patients = full_df['PATIENT_ID'].unique()
        train_ids, val_ids = train_test_split(unique_patients, train_size=split_ratio, random_state=42)
        
        target_ids = train_ids if mode == 'train' else val_ids
        self.patient_data = full_df[full_df['PATIENT_ID'].isin(target_ids)].copy()
        
        # 3. Data Expansion (The 3x Strategy)
        self.samples = []
        self._expand_slices()
        
        # 4. Feature Scaling (Fit only on training to simulate real world)
        self.scaler = MinMaxScaler()
        # We must include GENDER in the numeric cols list now that it is a number
        numeric_cols = ['AGE', 'GENDER', 'IDH1', 'TP53', 'ATRX', 'CIC', 'PTEN']
        
        # Handle missing columns if any (Create them as 0 if missing)
        for col in numeric_cols:
            if col not in self.patient_data.columns:
                self.patient_data[col] = 0.0
                
        # Fit scaler on the data
        self.patient_data[numeric_cols] = self.scaler.fit_transform(self.patient_data[numeric_cols])
        
        # 5. Normalize Survival (Critical for Loss Stability)
        self.max_survival = 100.0 

        print(f"[{mode.upper()}] Dataset Initialized. Patients: {len(target_ids)} | Expanded Samples: {len(self.samples)}")

    def _expand_slices(self):
        """
        Finds the Top N slices for each patient by tumor area.
        """
        for _, row in self.patient_data.iterrows():
            pid = row['PATIENT_ID']
            # Reconstruct folder path
            folder_prefix = pid.replace("-", "_")
            patient_path = None
            
            # Find the folder
            if os.path.exists(self.kaggle_folder):
                for item in os.listdir(self.kaggle_folder):
                    if item.startswith(folder_prefix):
                        patient_path = os.path.join(self.kaggle_folder, item)
                        break
            
            if not patient_path: continue
            
            # Find all masks and areas
            slice_candidates = []
            if os.path.exists(patient_path):
                for f in os.listdir(patient_path):
                    if "_mask.tif" in f:
                        mask_path = os.path.join(patient_path, f)
                        mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
                        if mask is not None:
                            area = np.sum(mask > 0)
                            if area > 0:
                                img_name = f.replace("_mask.tif", ".tif")
                                img_path = os.path.join(patient_path, img_name)
                                slice_candidates.append((area, img_path))
            
            # Sort by Area (Descending) and take Top N
            slice_candidates.sort(key=lambda x: x[0], reverse=True)
            top_slices = slice_candidates[:self.slices_per_patient]
            
            # Add to samples list
            for _, img_path in top_slices:
                self.samples.append({
                    'image_path': img_path,
                    # Safe to convert now because we cleaned it in __init__
                    'tabular': row[['AGE', 'GENDER', 'IDH1', 'TP53', 'ATRX', 'CIC', 'PTEN']].values.astype(np.float32),
                    'grade': 1 if str(row.get('GRADE', '')).upper() in ['G3', 'GBM', '1', 'WHO IV'] else 0,
                    'survival': float(row.get('SURVIVAL_MONTHS', 0))
                })

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        sample = self.samples[idx]
        
        # Load Image
        image = cv2.imread(sample['image_path'])
        if image is None: image = np.zeros((224, 224, 3), dtype=np.uint8)
        image = cv2.resize(image, (224, 224))
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Simple Data Augmentation (Only for Training)
        if self.mode == 'train':
            if np.random.rand() > 0.5:
                image = cv2.flip(image, 1)
            if np.random.rand() > 0.5:
                image = cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)

        # To Tensor and Normalize
        image = image.astype(np.float32) / 255.0
        mean = np.array([0.485, 0.456, 0.406])
        std = np.array([0.229, 0.224, 0.225])
        image = (image - mean) / std
        image = torch.from_numpy(image).permute(2, 0, 1).float() 

        return {
            'image': image,
            'tabular': torch.tensor(sample['tabular']),
            'grade': torch.tensor(sample['grade'], dtype=torch.long),
            'survival': torch.tensor(sample['survival'] / self.max_survival, dtype=torch.float32)
        }