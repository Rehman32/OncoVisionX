"""
Unified classifier supporting EfficientNet-B0, ResNet50, ConvNeXt-Tiny.
All models share identical interface — only backbone_name changes.
"""

import torch
import torch.nn as nn
import timm
import logging
from typing import Tuple, Optional

logger = logging.getLogger(__name__)


class SkinLesionClassifier(nn.Module):
    """
    Transfer learning classifier for skin lesion diagnosis.

    Args:
        backbone_name: timm model name (efficientnet_b0, resnet50, convnext_tiny)
        num_classes: Number of output classes (8 for our dataset)
        dropout: Dropout rate before classification head
        pretrained: Load ImageNet pretrained weights
    """

    def __init__(
        self,
        backbone_name: str,
        num_classes: int = 8,
        dropout: float = 0.3,
        pretrained: bool = True,
    ):
        super().__init__()

        # Load backbone without classifier head (num_classes=0)
        self.backbone = timm.create_model(
            backbone_name,
            pretrained=pretrained,
            num_classes=0,       # Remove pretrained head
            global_pool='avg'    # Global average pooling
        )

        self.feature_dim = self.backbone.num_features
        self.backbone_name = backbone_name

        # Classification head
        self.head = nn.Sequential(
            nn.Dropout(p=dropout),
            nn.Linear(self.feature_dim, num_classes)
        )

        logger.info(f"Model: {backbone_name}")
        logger.info(f"  Feature dim: {self.feature_dim}")
        logger.info(f"  Params: {self._count_params():,}")
        logger.info(f"  Pretrained: {pretrained}")

    def forward(
        self,
        x: torch.Tensor,
        return_features: bool = False
    ) -> torch.Tensor | Tuple[torch.Tensor, torch.Tensor]:
        """
        Args:
            x: Input tensor [B, 3, H, W]
            return_features: If True, return (features, logits)

        Returns:
            logits [B, num_classes] or (features [B, D], logits [B, num_classes])
        """
        features = self.backbone(x)       # [B, feature_dim]
        logits = self.head(features)      # [B, num_classes]

        if return_features:
            return features, logits
        return logits

    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        """Returns softmax probabilities [B, num_classes]."""
        with torch.no_grad():
            return torch.softmax(self.forward(x), dim=1)

    def _count_params(self) -> int:
        return sum(p.numel() for p in self.parameters() if p.requires_grad)

    def freeze_backbone(self):
        """Freeze backbone — only train head. Useful for initial warmup."""
        for param in self.backbone.parameters():
            param.requires_grad = False
        logger.info("Backbone frozen (head-only training)")

    def unfreeze_backbone(self):
        """Unfreeze all layers for full fine-tuning."""
        for param in self.backbone.parameters():
            param.requires_grad = True
        logger.info("Backbone unfrozen (full fine-tuning)")


def build_model(
    backbone_name: str,
    num_classes: int = 8,
    dropout: float = 0.3,
    pretrained: bool = True,
    checkpoint_path: Optional[str] = None,
    device: Optional[torch.device] = None
) -> SkinLesionClassifier:
    """
    Factory function to build and optionally load a checkpoint.

    Args:
        backbone_name: One of 'efficientnet_b0', 'resnet50', 'convnext_tiny'
        num_classes: Output classes
        dropout: Dropout rate
        pretrained: Use ImageNet weights
        checkpoint_path: Path to saved .pth checkpoint
        device: Target device

    Returns:
        SkinLesionClassifier ready for training or inference
    """
    if device is None:
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    model = SkinLesionClassifier(
        backbone_name=backbone_name,
        num_classes=num_classes,
        dropout=dropout,
        pretrained=pretrained
    )

    if checkpoint_path:
        checkpoint = torch.load(checkpoint_path, map_location=device)
        model.load_state_dict(checkpoint['model_state_dict'])
        logger.info(f"Loaded checkpoint: {checkpoint_path}")
        logger.info(f"  Epoch: {checkpoint.get('epoch', 'N/A')}")
        logger.info(f"  Val Balanced Acc: {checkpoint.get('val_balanced_acc', 'N/A'):.4f}")

    model = model.to(device)
    return model
