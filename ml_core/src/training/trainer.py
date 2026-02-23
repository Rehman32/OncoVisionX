"""
Unified training engine for all 3 models.
Handles: mixed precision, early stopping, checkpointing, LR scheduling.
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torch.cuda.amp import GradScaler, autocast
import numpy as np
import time
import logging
from pathlib import Path
from typing import Dict, Optional, Tuple
from tqdm import tqdm

from .metrics import MetricsCalculator

logger = logging.getLogger(__name__)


class EarlyStopping:
    """Stops training when validation metric stops improving."""

    def __init__(self, patience: int = 7, min_delta: float = 0.001, mode: str = 'max'):
        self.patience = patience
        self.min_delta = min_delta
        self.mode = mode
        self.counter = 0
        self.best_value = None
        self.should_stop = False

    def __call__(self, value: float) -> bool:
        if self.best_value is None:
            self.best_value = value
            return False

        improved = (
            value > self.best_value + self.min_delta if self.mode == 'max'
            else value < self.best_value - self.min_delta
        )

        if improved:
            self.best_value = value
            self.counter = 0
        else:
            self.counter += 1
            if self.counter >= self.patience:
                self.should_stop = True

        return self.should_stop


class Trainer:
    """
    Full training pipeline with:
    - Mixed precision (FP16) for T4 GPU efficiency
    - Weighted CrossEntropyLoss for class imbalance
    - ReduceLROnPlateau scheduling
    - Checkpoint saving (best model only)
    - Early stopping

    Args:
        model: SkinLesionClassifier
        train_loader: Training DataLoader
        val_loader: Validation DataLoader
        class_weights: Tensor of per-class weights [num_classes]
        config: Config object
        device: torch.device
        model_name: Name for logging and checkpoint files
        checkpoint_dir: Directory to save .pth files
    """

    def __init__(
        self,
        model: nn.Module,
        train_loader: DataLoader,
        val_loader: DataLoader,
        class_weights: torch.Tensor,
        config,
        device: torch.device,
        model_name: str,
        checkpoint_dir: str = "checkpoints",
    ):
        self.model = model
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.device = device
        self.model_name = model_name
        self.checkpoint_dir = Path(checkpoint_dir)
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)

        # Training config
        self.num_epochs = config.training.num_epochs
        self.use_amp = config.training.use_amp and device.type == 'cuda'
        self.grad_clip = config.training.grad_clip_norm

        # Loss with class weights
        self.criterion = nn.CrossEntropyLoss(
            weight=class_weights.to(device)
        )

        # Optimizer
        self.optimizer = optim.AdamW(
            model.parameters(),
            lr=config.training.learning_rate,
            weight_decay=config.training.weight_decay
        )

        # LR Scheduler — reduce on plateau of balanced accuracy
        self.scheduler = optim.lr_scheduler.ReduceLROnPlateau(
            self.optimizer,
            mode='max',
            factor=config.training.scheduler_factor,
            patience=config.training.scheduler_patience,
            min_lr=config.training.min_lr
        )

        # Mixed precision scaler
        self.scaler = GradScaler(enabled=self.use_amp)

        # Early stopping
        self.early_stopping = EarlyStopping(
            patience=config.training.early_stopping_patience,
            mode='max'
        )

        # Metrics
        self.metrics_calc = MetricsCalculator(
            results_dir=str(Path(config.paths.results_dir))
        )

        # History for plotting
        self.history = {
            'train_loss': [], 'val_loss': [],
            'train_acc': [], 'val_balanced_acc': [],
            'val_mel_sensitivity': [], 'lr': []
        }

        self.best_val_balanced_acc = 0.0

        logger.info(f"\n{'='*60}")
        logger.info(f"Trainer initialized: {model_name}")
        logger.info(f"  Device: {device} | AMP: {self.use_amp}")
        logger.info(f"  Epochs: {self.num_epochs} | Batch: {train_loader.batch_size}")
        logger.info(f"  LR: {config.training.learning_rate} | WD: {config.training.weight_decay}")
        logger.info(f"{'='*60}")

    def _train_one_epoch(self, epoch: int) -> Tuple[float, float]:
        """One full training pass over training set."""
        self.model.train()
        total_loss = 0.0
        correct = 0
        total = 0

        pbar = tqdm(
            self.train_loader,
            desc=f"Epoch {epoch+1} [Train]",
            leave=False,
            dynamic_ncols=True
        )

        for images, labels in pbar:  # <--- REMOVED THE ", _" HERE
            images = images.to(self.device, non_blocking=True)
            labels = labels.to(self.device, non_blocking=True)

            self.optimizer.zero_grad(set_to_none=True)

            # Forward pass (with mixed precision)
            with autocast(enabled=self.use_amp):
                logits = self.model(images)
                loss = self.criterion(logits, labels)

            # Backward pass
            self.scaler.scale(loss).backward()

            # Gradient clipping (prevents exploding gradients)
            self.scaler.unscale_(self.optimizer)
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), self.grad_clip)

            self.scaler.step(self.optimizer)
            self.scaler.update()

            # Track metrics
            total_loss += loss.item()
            preds = logits.argmax(dim=1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)

            pbar.set_postfix({
                'loss': f"{loss.item():.4f}",
                'acc': f"{100 * correct / total:.1f}%"
            })

        

        avg_loss = total_loss / len(self.train_loader)
        avg_acc = correct / total
        return avg_loss, avg_acc

    @torch.no_grad()
    def _validate(self, epoch: int) -> Tuple[float, Dict]:
        """One full pass over validation set — no gradient updates."""
        self.model.eval()
        total_loss = 0.0
        all_preds, all_labels, all_probs = [], [], []

        pbar = tqdm(
            self.val_loader,
            desc=f"Epoch {epoch+1} [Val]",
            leave=False,
            dynamic_ncols=True
        )

        for images, labels in pbar:
            images = images.to(self.device, non_blocking=True)
            labels = labels.to(self.device, non_blocking=True)

            with autocast(enabled=self.use_amp):
                logits = self.model(images)
                loss = self.criterion(logits, labels)

            total_loss += loss.item()
            probs = torch.softmax(logits, dim=1)
            preds = probs.argmax(dim=1)

            all_preds.append(preds.cpu().numpy())
            all_labels.append(labels.cpu().numpy())
            all_probs.append(probs.cpu().numpy())

        all_preds = np.concatenate(all_preds)
        all_labels = np.concatenate(all_labels)
        all_probs = np.concatenate(all_probs)

        avg_loss = total_loss / len(self.val_loader)
        metrics = self.metrics_calc.compute(all_preds, all_labels, all_probs, split='val')

        return avg_loss, metrics, all_preds, all_labels, all_probs

    def _save_checkpoint(self, epoch: int, metrics: Dict, is_best: bool = False):
        """Save model checkpoint with full metadata."""
        checkpoint = {
            'epoch': epoch,
            'model_name': self.model_name,
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'val_balanced_acc': metrics['balanced_accuracy'],
            'val_mel_sensitivity': metrics['mel_sensitivity'],
            'metrics': metrics,
        }

        # Always save latest
        latest_path = self.checkpoint_dir / f"{self.model_name}_latest.pth"
        torch.save(checkpoint, latest_path)

        # Save best separately
        if is_best:
            best_path = self.checkpoint_dir / f"{self.model_name}_best.pth"
            torch.save(checkpoint, best_path)
            logger.info(f"  ✅ New best model saved: {best_path.name}")
            logger.info(f"     Balanced Acc: {metrics['balanced_accuracy']:.4f} | "
                        f"Mel Sensitivity: {metrics['mel_sensitivity']:.4f}")

    def _plot_training_curves(self):
        """Save loss and accuracy training curves."""
        import matplotlib.pyplot as plt

        fig, axes = plt.subplots(1, 3, figsize=(16, 4))

        # Loss curves
        axes[0].plot(self.history['train_loss'], label='Train', color='steelblue')
        axes[0].plot(self.history['val_loss'], label='Val', color='orange')
        axes[0].set_title(f'{self.model_name} — Loss', fontweight='bold')
        axes[0].set_xlabel('Epoch')
        axes[0].set_ylabel('Loss')
        axes[0].legend()
        axes[0].grid(alpha=0.3)

        # Accuracy
        axes[1].plot(self.history['train_acc'], label='Train Acc', color='steelblue')
        axes[1].plot(self.history['val_balanced_acc'], label='Val Balanced Acc', color='orange')
        axes[1].set_title(f'{self.model_name} — Accuracy', fontweight='bold')
        axes[1].set_xlabel('Epoch')
        axes[1].set_ylabel('Accuracy')
        axes[1].legend()
        axes[1].grid(alpha=0.3)

        # Melanoma sensitivity (clinical safety metric)
        axes[2].plot(self.history['val_mel_sensitivity'], color='red', linewidth=2)
        axes[2].axhline(y=0.90, color='darkred', linestyle='--', label='Target (0.90)')
        axes[2].set_title(f'{self.model_name} — Melanoma Sensitivity', fontweight='bold')
        axes[2].set_xlabel('Epoch')
        axes[2].set_ylabel('Sensitivity')
        axes[2].legend()
        axes[2].grid(alpha=0.3)
        axes[2].set_ylim([0, 1])

        plt.tight_layout()
        save_path = Path("results") / f"training_curves_{self.model_name}.png"
        save_path.parent.mkdir(exist_ok=True)
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.close()
        logger.info(f"Saved training curves: {save_path}")

    def train(self) -> Dict:
        """
        Full training loop.

        Returns:
            History dictionary with all metrics per epoch
        """
        logger.info(f"\n🚀 Training {self.model_name}...")
        start_time = time.time()

        for epoch in range(self.num_epochs):
            epoch_start = time.time()

            # Train
            train_loss, train_acc = self._train_one_epoch(epoch)

            # Validate
            val_loss, metrics, all_preds, all_labels, all_probs = self._validate(epoch)

            # LR scheduling (based on balanced accuracy)
            current_lr = self.optimizer.param_groups[0]['lr']
            self.scheduler.step(metrics['balanced_accuracy'])

            # Track history
            self.history['train_loss'].append(train_loss)
            self.history['val_loss'].append(val_loss)
            self.history['train_acc'].append(train_acc)
            self.history['val_balanced_acc'].append(metrics['balanced_accuracy'])
            self.history['val_mel_sensitivity'].append(metrics['mel_sensitivity'])
            self.history['lr'].append(current_lr)

            # Check for best model
            is_best = metrics['balanced_accuracy'] > self.best_val_balanced_acc
            if is_best:
                self.best_val_balanced_acc = metrics['balanced_accuracy']

            self._save_checkpoint(epoch, metrics, is_best)

            epoch_time = time.time() - epoch_start

            # Console summary (clean, not verbose)
            print(
                f"Ep {epoch+1:02d}/{self.num_epochs} | "
                f"Loss: {train_loss:.4f}/{val_loss:.4f} | "
                f"BalAcc: {metrics['balanced_accuracy']:.4f} | "
                f"MelSens: {metrics['mel_sensitivity']:.4f} | "
                f"F1: {metrics['f1_macro']:.4f} | "
                f"LR: {current_lr:.6f} | "
                f"⏱ {epoch_time:.0f}s"
            )

            # Early stopping check
            if self.early_stopping(metrics['balanced_accuracy']):
                logger.info(f"\n⏹ Early stopping at epoch {epoch+1}")
                break

        total_time = (time.time() - start_time) / 60
        logger.info(f"\n✅ Training complete: {total_time:.1f} min")
        logger.info(f"   Best Balanced Acc: {self.best_val_balanced_acc:.4f}")

        self._plot_training_curves()

        return self.history
