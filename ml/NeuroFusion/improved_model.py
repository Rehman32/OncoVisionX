import torch
import torch.nn as nn
import torchvision.models as models

class SeniorNeuroFusionModel(nn.Module):
    def __init__(self):
        super(SeniorNeuroFusionModel, self).__init__()
        
        # --- VISION BRANCH (ResNet18) ---
        # 1. Load Pretrained
        resnet = models.resnet18(pretrained=True)
        
        # 2. FREEZE LAYERS (Senior Engineer Trick)
        # We freeze everything except the last 2 layers. 
        # This prevents the model from forgetting basic shapes.
        for param in resnet.parameters():
            param.requires_grad = False
            
        # Unfreeze Layer 4 (High level features) and FC
        for param in resnet.layer4.parameters():
            param.requires_grad = True
            
        # Extract features (remove classification head)
        self.cnn_backbone = nn.Sequential(*list(resnet.children())[:-1]) # Output: [Batch, 512, 1, 1]
        
        # --- TABULAR BRANCH ---
        self.tabular_net = nn.Sequential(
            nn.Linear(7, 32),
            nn.BatchNorm1d(32), # Added Batch Norm for stability
            nn.ReLU(),
            nn.Dropout(0.3),    # Increased Dropout
            nn.Linear(32, 16),
            nn.ReLU()
        )
        
        # --- FUSION ---
        self.fusion = nn.Sequential(
            nn.Linear(512 + 16, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.4),    # High dropout in fusion to force robust feature learning
            nn.Linear(128, 64),
            nn.ReLU()
        )
        
        # --- HEADS ---
        self.head_grade = nn.Linear(64, 2)
        self.head_survival = nn.Linear(64, 1)

    def forward(self, img, tab):
        # Image
        x_img = self.cnn_backbone(img)
        x_img = x_img.view(x_img.size(0), -1) # Flatten [Batch, 512]
        
        # Tabular
        x_tab = self.tabular_net(tab)
        
        # Concat
        x_combined = torch.cat((x_img, x_tab), dim=1)
        
        # Fuse
        x_fused = self.fusion(x_combined)
        
        # Output
        grade = self.head_grade(x_fused)
        survival = self.head_survival(x_fused)
        
        return grade, survival