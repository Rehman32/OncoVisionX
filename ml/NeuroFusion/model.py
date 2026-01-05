import torch
import torch.nn as nn
import torchvision.models as models

class NeuroFusionModel(nn.Module):
    def __init__(self):
        super(NeuroFusionModel, self).__init__()
        
        # --- BRANCH 1: RADIOLOGY (IMAGE) ---
        # Use a pre-trained ResNet18
        self.cnn_backbone = models.resnet18(pretrained=True)
        
        # Remove the last classification layer of ResNet
        # We only want the features (512 numbers), not the final 1000 classes
        self.cnn_backbone.fc = nn.Identity() 
        
        # --- BRANCH 2: GENOMICS + CLINICAL (TABULAR) ---
        # Input size = 7 (Age, Gender, IDH1, TP53, ATRX, CIC, PTEN)
        self.tabular_net = nn.Sequential(
            nn.Linear(7, 32),
            nn.ReLU(),
            nn.Dropout(0.2), # Prevents overfitting
            nn.Linear(32, 16),
            nn.ReLU()
        )
        
        # --- FUSION LAYER ---
        # Image Features (512) + Tabular Features (16) = 528
        self.fusion_layer = nn.Sequential(
            nn.Linear(512 + 16, 128),
            nn.ReLU(),
            nn.Dropout(0.2)
        )
        
        # --- OUTPUT HEADS (MULTI-TASK LEARNING) ---
        
        # Head 1: Predict Tumor Grade (Classification: 2 classes - Low vs High)
        self.grade_head = nn.Linear(128, 2)
        
        # Head 2: Predict Survival Months (Regression: 1 number)
        self.survival_head = nn.Linear(128, 1)

    def forward(self, image, tabular):
        # 1. Process Image
        img_features = self.cnn_backbone(image) # Shape: [Batch, 512]
        
        # 2. Process Tabular Data
        tab_features = self.tabular_net(tabular) # Shape: [Batch, 16]
        
        # 3. Fuse (Concatenate)
        combined = torch.cat((img_features, tab_features), dim=1) # Shape: [Batch, 528]
        
        # 4. Joint Learning
        fused = self.fusion_layer(combined)
        
        # 5. Generate Predictions
        grade_pred = self.grade_head(fused)
        survival_pred = self.survival_head(fused)
        
        return grade_pred, survival_pred