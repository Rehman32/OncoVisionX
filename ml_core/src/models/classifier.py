import torch
import torch.nn as nn
import timm
import logging

logger = logging.getLogger(__name__)

class MultimodalSkinClassifier(nn.Module):
    """
    Late-Fusion Architecture: Combines ConvNeXt visual embeddings 
    with MLP-encoded clinical metadata (Age, Sex, Anatomy).
    """
    def __init__(
        self,
        backbone_name: str = 'convnext_tiny',
        num_classes: int = 8,
        meta_dim: int = 19,
        dropout: float = 0.3,
        pretrained: bool = True,
    ):
        super().__init__()
        
        # 1. Visual Encoder (ConvNeXt-Tiny)
        self.backbone = timm.create_model(
            backbone_name,
            pretrained=pretrained,
            num_classes=0,       # Remove pretrained classification head
            global_pool='avg'    # Output shape: [Batch, 768]
        )
        self.visual_dim = self.backbone.num_features 
        self.backbone_name = backbone_name

        # 2. Clinical Metadata Encoder (MLP)
        self.meta_hidden_dim = 128
        self.meta_encoder = nn.Sequential(
            nn.Linear(meta_dim, 64),
            nn.BatchNorm1d(64),
            nn.GELU(),
            nn.Dropout(p=0.2),
            nn.Linear(64, self.meta_hidden_dim),
            nn.BatchNorm1d(self.meta_hidden_dim),
            nn.GELU(),
        )

        # 3. Late-Fusion & Classification Head
        self.fusion_dim = self.visual_dim + self.meta_hidden_dim  # 768 + 128 = 896
        self.classifier = nn.Sequential(
            nn.Dropout(p=dropout),
            nn.Linear(self.fusion_dim, 256),
            nn.BatchNorm1d(256),
            nn.GELU(),
            nn.Dropout(p=dropout),
            nn.Linear(256, num_classes)
        )

    def forward(self, images, metadata):
        # Extract visual features -> [B, 768]
        v_features = self.backbone(images)
        
        # Extract clinical features -> [B, 128]
        m_features = self.meta_encoder(metadata)
        
        # FUSE (Concatenation) -> [B, 896]
        fused_features = torch.cat((v_features, m_features), dim=1)
        
        # Final diagnosis
        logits = self.classifier(fused_features)
        return logits

    def freeze_backbone(self):
        """Freezes only the visual encoder to protect weights during warmup."""
        for param in self.backbone.parameters():
            param.requires_grad = False
        logger.info("Visual backbone frozen (Training MLP + Head only)")

    def unfreeze_backbone(self):
        """Unfreezes visual encoder for full system fine-tuning."""
        for param in self.backbone.parameters():
            param.requires_grad = True
        logger.info("Visual backbone unfrozen (Full Multimodal Fine-tuning)")