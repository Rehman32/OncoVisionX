"""
Evaluation metrics for clinical AI — safety metrics prioritized.
Key insight: For melanoma detection, sensitivity > accuracy.
"""

import torch
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from sklearn.metrics import (
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score
)
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

CLASS_NAMES = ['akiec', 'bcc', 'bkl', 'df', 'mel', 'nv', 'scc', 'vasc']
MELANOMA_IDX = 4  # 'mel' in sorted class_names


class MetricsCalculator:
    """
    Computes and logs all evaluation metrics.

    Safety-first metrics:
    - Melanoma sensitivity: must be >90% (false negative = missed cancer)
    - Balanced accuracy: accounts for class imbalance
    - Per-class F1: identifies which classes need improvement
    """

    def __init__(self, class_names: List[str] = CLASS_NAMES, results_dir: str = "results"):
        self.class_names = class_names
        self.results_dir = Path(results_dir)
        self.results_dir.mkdir(parents=True, exist_ok=True)
        self.melanoma_idx = class_names.index('mel') if 'mel' in class_names else MELANOMA_IDX

    def compute(
        self,
        all_preds: np.ndarray,
        all_labels: np.ndarray,
        all_probs: np.ndarray,
        split: str = "val"
    ) -> Dict[str, float]:
        """
        Compute full metric suite.

        Args:
            all_preds: Predicted class indices [N]
            all_labels: True class indices [N]
            all_probs: Class probabilities [N, C]
            split: 'val' or 'test'

        Returns:
            Dictionary of metric_name → value
        """
        metrics = {}

        # Standard metrics
        accuracy = (all_preds == all_labels).mean()
        balanced_acc = balanced_accuracy_score(all_labels, all_preds)
        metrics['accuracy'] = float(accuracy)
        metrics['balanced_accuracy'] = float(balanced_acc)

        # Per-class F1 and overall macro F1
        report = classification_report(
            all_labels, all_preds,
            target_names=self.class_names,
            output_dict=True,
            zero_division=0
        )
        metrics['f1_macro'] = report['macro avg']['f1-score']
        metrics['f1_weighted'] = report['weighted avg']['f1-score']
        for cls in self.class_names:
            if cls in report:
                metrics[f'f1_{cls}'] = report[cls]['f1-score']

        # Critical safety metric: Melanoma sensitivity (recall)
        mel_report = report.get('mel', {})
        metrics['mel_sensitivity'] = mel_report.get('recall', 0.0)
        metrics['mel_precision'] = mel_report.get('precision', 0.0)
        metrics['mel_f1'] = mel_report.get('f1-score', 0.0)

        # ROC AUC (one-vs-rest for multi-class)
        try:
            metrics['auc_roc_macro'] = roc_auc_score(
                all_labels, all_probs,
                multi_class='ovr', average='macro'
            )
            # Melanoma-specific AUC
            mel_binary_labels = (all_labels == self.melanoma_idx).astype(int)
            metrics['auc_roc_melanoma'] = roc_auc_score(
                mel_binary_labels, all_probs[:, self.melanoma_idx]
            )
        except Exception:
            metrics['auc_roc_macro'] = 0.0
            metrics['auc_roc_melanoma'] = 0.0

        # Log safety alert if melanoma sensitivity is too low
        if metrics['mel_sensitivity'] < 0.85:
            logger.warning(
                f"⚠️  SAFETY ALERT: Melanoma sensitivity = {metrics['mel_sensitivity']:.3f} "
                f"(target: >0.90). Model may miss cancer!"
            )

        logger.info(f"\n{'='*50}")
        logger.info(f"METRICS [{split.upper()}]")
        logger.info(f"{'='*50}")
        logger.info(f"  Accuracy:           {metrics['accuracy']:.4f}")
        logger.info(f"  Balanced Accuracy:  {metrics['balanced_accuracy']:.4f}")
        logger.info(f"  F1 Macro:           {metrics['f1_macro']:.4f}")
        logger.info(f"  AUC-ROC Macro:      {metrics['auc_roc_macro']:.4f}")
        logger.info(f"  🎯 Mel Sensitivity: {metrics['mel_sensitivity']:.4f}")
        logger.info(f"  🎯 Mel AUC-ROC:     {metrics['auc_roc_melanoma']:.4f}")

        return metrics

    def plot_confusion_matrix(
        self,
        all_preds: np.ndarray,
        all_labels: np.ndarray,
        model_name: str,
        split: str = "test"
    ):
        """Saves normalized confusion matrix as PNG."""
        cm = confusion_matrix(all_labels, all_preds, normalize='true')

        fig, ax = plt.subplots(figsize=(10, 8))
        sns.heatmap(
            cm, annot=True, fmt='.2f', cmap='Blues',
            xticklabels=self.class_names,
            yticklabels=self.class_names,
            ax=ax
        )
        ax.set_title(f'{model_name} — Confusion Matrix ({split})', fontsize=13, fontweight='bold')
        ax.set_ylabel('True Label')
        ax.set_xlabel('Predicted Label')
        plt.tight_layout()

        save_path = self.results_dir / f"confusion_matrix_{model_name}_{split}.png"
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.close()
        logger.info(f"Saved confusion matrix: {save_path}")

    def save_metrics_csv(self, metrics: Dict, model_name: str, split: str = "test"):
        """Saves metrics to CSV for model comparison."""
        df = pd.DataFrame([metrics])
        df.insert(0, 'model', model_name)
        df.insert(1, 'split', split)

        save_path = self.results_dir / f"metrics_{model_name}_{split}.csv"
        df.to_csv(save_path, index=False)
        logger.info(f"Saved metrics: {save_path}")

        return df
