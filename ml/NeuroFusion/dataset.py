import torch
from torch.utils.data import Dataset
import pandas as pd
import numpy as np
import cv2
from sklearn.preprocessing import MinMaxScaler

class GliomaDataset(Dataset):
    def __init__(self, csv_file, transform=None):
        """
        Args:
            csv_file (string): Path to the 'final_model_data.csv' file.
            transform (callable, optional): Optional transform to be applied on the image.
        """
        self.data = pd.read_csv(csv_file)
        self.transform = transform
        
        # --- PREPROCESSING / NORMALIZATION ---
        
        # 1. Handle Missing/Unknown Values
        # Replace 'Unknown' Gender with Mode or 0 (Simple fix for FYP)
        self.data['GENDER'] = self.data['GENDER'].replace('Unknown', 'Male') # Assume Male if unknown for now
        self.data['GENDER'] = self.data['GENDER'].apply(lambda x: 1 if x == 'Male' else 0)
        
        # 2. Map Tumor Grade (Text -> Number)
        # G2 (Low Grade) = 0, G3 (High Grade) = 1
        grade_mapper = {'G2': 0, 'G3': 1, 'GBM': 1, 'Unknown': 0}
        self.data['GRADE'] = self.data['GRADE'].map(grade_mapper).fillna(0)
        
        # 3. Normalize Numerical Features (Age + 5 Genes)
        # We use a MinMax Scaler to squash values between 0 and 1
        self.scaler = MinMaxScaler()
        numeric_cols = ['AGE', 'IDH1', 'TP53', 'ATRX', 'CIC', 'PTEN']
        
        # Fit the scaler on the data
        self.data[numeric_cols] = self.scaler.fit_transform(self.data[numeric_cols])
        
        print(f"Dataset Loaded. Total Samples: {len(self.data)}")

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        # 1. Load Image
        img_path = self.data.iloc[idx]['IMAGE_PATH']
        image = cv2.imread(img_path)
        
        # Safety Check: If image load fails, create a black image (prevents crashing)
        if image is None:
            image = np.zeros((224, 224, 3), dtype=np.uint8)
        else:
            # Resize to standard AI input size (224x224)
            image = cv2.resize(image, (224, 224))
            # Convert BGR (OpenCV standard) to RGB (AI standard)
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Apply transforms (Convert to Tensor, Normalize)
        if self.transform:
            image = self.transform(image)

        # 2. Load Tabular Data (Genomics + Clinical)
        # Vector: [Age, Gender, IDH1, TP53, ATRX, CIC, PTEN]
        tabular_features = self.data.iloc[idx][['AGE', 'GENDER', 'IDH1', 'TP53', 'ATRX', 'CIC', 'PTEN']].values.astype(np.float32)
        tabular_tensor = torch.tensor(tabular_features)

        # 3. Load Targets (What we want to predict)
        # Target A: Tumor Grade (Classification: 0 or 1)
        grade_label = torch.tensor(int(self.data.iloc[idx]['GRADE']), dtype=torch.long)
        
        # Target B: Survival Months (Regression: Number)
        survival_label = torch.tensor(float(self.data.iloc[idx]['SURVIVAL_MONTHS']), dtype=torch.float32)

        return {
            'image': image,
            'tabular': tabular_tensor,
            'grade': grade_label,
            'survival': survival_label
        }