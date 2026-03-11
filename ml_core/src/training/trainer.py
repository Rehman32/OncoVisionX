
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.utils.data import DataLoader
from torch.cuda.amp import GradScaler, autocast
import numpy as np
import time
import logging
from pathlib import Path
from typing import Dict, Tuple
from tqdm import tqdm

from .metrics import MetricsCalculator

logger = logging.getLogger(__name__)

class FocalLoss(nn.Module):
    def __init__(self, weight=None, gamma=1.5, reduction='mean'): # 🚨 RELAXED GAMMA TO 1.5
        super(FocalLoss, self).__init__()
        self.weight = weight
        self.gamma = gamma
        self.reduction = reduction

    def forward(self, inputs, targets):
        ce_loss = F.cross_entropy(inputs, targets, weight=self.weight, reduction='none')
        pt = torch.exp(-ce_loss)
        focal_loss = ((1 - pt) ** self.gamma) * ce_loss
        if self.reduction == 'mean': return focal_loss.mean()
        elif self.reduction == 'sum': return focal_loss.sum()
        else: return focal_loss

class EarlyStopping:
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
        improved = (value > self.best_value + self.min_delta if self.mode == 'max' else value < self.best_value - self.min_delta)
        if improved:
            self.best_value = value
            self.counter = 0
        else:
            self.counter += 1
            if self.counter >= self.patience:
                self.should_stop = True
        return self.should_stop

class Trainer:
    def __init__(self, model: nn.Module, train_loader: DataLoader, val_loader: DataLoader, class_weights: torch.Tensor, config, device: torch.device, model_name: str, checkpoint_dir: str = "checkpoints"):
        self.model = model
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.device = device
        self.model_name = model_name
        self.checkpoint_dir = Path(checkpoint_dir)
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)
        self.num_epochs = config.training.num_epochs
        self.use_amp = config.training.use_amp and device.type == 'cuda'
        self.grad_clip = config.training.grad_clip_norm

        # 🚨 APPLIED RELAXED FOCAL LOSS
        self.criterion = FocalLoss(weight=class_weights.to(device), gamma=1.5)
        
        # 🚨 DIFFERENTIAL LEARNING RATES
        backbone_params = []
        head_params = []
        for name, param in self.model.named_parameters():
            if 'backbone' in name:
                backbone_params.append(param)
            else:
                head_params.append(param)
                
        self.optimizer = optim.AdamW([
            {'params': backbone_params, 'lr': config.training.learning_rate * 0.1}, # Backbone trains 10x slower
            {'params': head_params, 'lr': config.training.learning_rate}            # MLP trains at normal speed
        ], weight_decay=config.training.weight_decay)
        
        self.scheduler = optim.lr_scheduler.ReduceLROnPlateau(self.optimizer, mode='max', factor=config.training.scheduler_factor, patience=config.training.scheduler_patience, min_lr=config.training.min_lr)
        self.scaler = GradScaler(enabled=self.use_amp)
        self.early_stopping = EarlyStopping(patience=config.training.early_stopping_patience, mode='max')
        self.metrics_calc = MetricsCalculator(results_dir=str(Path(config.paths.results_dir)))
        self.history = {'train_loss': [], 'val_loss': [], 'train_acc': [], 'val_balanced_acc': [], 'val_mel_sensitivity': [], 'lr': []}
        self.best_val_balanced_acc = 0.0

    def _train_one_epoch(self, epoch: int) -> Tuple[float, float]:
        self.model.train()
        total_loss, correct, total = 0.0, 0, 0
        pbar = tqdm(self.train_loader, desc=f"Epoch {epoch+1} [Train]", leave=False, dynamic_ncols=True)
        
        for images, metadata, labels in pbar:
            images = images.to(self.device, non_blocking=True)
            metadata = metadata.to(self.device, non_blocking=True)
            labels = labels.to(self.device, non_blocking=True)
            
            self.optimizer.zero_grad(set_to_none=True)
            with autocast(enabled=self.use_amp):
                logits = self.model(images, metadata)
                loss = self.criterion(logits, labels)
                
            self.scaler.scale(loss).backward()
            self.scaler.unscale_(self.optimizer)
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), self.grad_clip)
            self.scaler.step(self.optimizer)
            self.scaler.update()
            
            total_loss += loss.item()
            preds = logits.argmax(dim=1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)
            pbar.set_postfix({'loss': f"{loss.item():.4f}", 'acc': f"{100 * correct / total:.1f}%"})
        return total_loss / len(self.train_loader), correct / total

    @torch.no_grad()
    def _validate(self, epoch: int) -> Tuple[float, Dict]:
        self.model.eval()
        total_loss = 0.0
        all_preds, all_labels, all_probs = [], [], []
        pbar = tqdm(self.val_loader, desc=f"Epoch {epoch+1} [Val]", leave=False, dynamic_ncols=True)
        
        for images, metadata, labels in pbar:
            images = images.to(self.device, non_blocking=True)
            metadata = metadata.to(self.device, non_blocking=True)
            labels = labels.to(self.device, non_blocking=True)
            
            with autocast(enabled=self.use_amp):
                logits = self.model(images, metadata)
                loss = self.criterion(logits, labels)
                
            total_loss += loss.item()
            probs = torch.softmax(logits, dim=1)
            preds = probs.argmax(dim=1)
            all_preds.append(preds.cpu().numpy())
            all_labels.append(labels.cpu().numpy())
            all_probs.append(probs.cpu().numpy())
            
        all_preds, all_labels, all_probs = np.concatenate(all_preds), np.concatenate(all_labels), np.concatenate(all_probs)
        return total_loss / len(self.val_loader), self.metrics_calc.compute(all_preds, all_labels, all_probs, split='val'), all_preds, all_labels, all_probs

    def _save_checkpoint(self, epoch: int, metrics: Dict, is_best: bool = False):
        checkpoint = {'epoch': epoch, 'model_name': self.model_name, 'model_state_dict': self.model.state_dict(), 'optimizer_state_dict': self.optimizer.state_dict(), 'val_balanced_acc': metrics['balanced_accuracy'], 'val_mel_sensitivity': metrics['mel_sensitivity'], 'metrics': metrics}
        torch.save(checkpoint, self.checkpoint_dir / f"{self.model_name}_latest.pth")
        if is_best:
            best_path = self.checkpoint_dir / f"{self.model_name}_best.pth"
            torch.save(checkpoint, best_path)
            logger.info(f"  ✅ New best model saved: {best_path.name}")

    def _plot_training_curves(self):
        import matplotlib.pyplot as plt
        fig, axes = plt.subplots(1, 3, figsize=(16, 4))
        axes[0].plot(self.history['train_loss'], label='Train')
        axes[0].plot(self.history['val_loss'], label='Val')
        axes[0].set_title(f'{self.model_name} — Loss')
        axes[0].legend()
        axes[1].plot(self.history['train_acc'], label='Train Acc')
        axes[1].plot(self.history['val_balanced_acc'], label='Val Balanced Acc')
        axes[1].set_title(f'{self.model_name} — Accuracy')
        axes[1].legend()
        axes[2].plot(self.history['val_mel_sensitivity'], color='red')
        axes[2].axhline(y=0.90, color='darkred', linestyle='--')
        axes[2].set_title(f'{self.model_name} — Mel Sensitivity')
        axes[2].legend()
        axes[2].set_ylim([0, 1])
        plt.tight_layout()
        plt.savefig(Path("results") / f"training_curves_{self.model_name}.png", dpi=150, bbox_inches='tight')
        plt.close()

    def train(self) -> Dict:
        logger.info(f"\n🚀 Training {self.model_name}...")
        start_time = time.time()
        for epoch in range(self.num_epochs):
            epoch_start = time.time()
            train_loss, train_acc = self._train_one_epoch(epoch)
            val_loss, metrics, _, _, _ = self._validate(epoch)
            current_lr = self.optimizer.param_groups[0]['lr']
            self.scheduler.step(metrics['balanced_accuracy'])
            self.history['train_loss'].append(train_loss); self.history['val_loss'].append(val_loss)
            self.history['train_acc'].append(train_acc); self.history['val_balanced_acc'].append(metrics['balanced_accuracy'])
            self.history['val_mel_sensitivity'].append(metrics['mel_sensitivity']); self.history['lr'].append(current_lr)
            is_best = metrics['balanced_accuracy'] > self.best_val_balanced_acc
            if is_best: self.best_val_balanced_acc = metrics['balanced_accuracy']
            self._save_checkpoint(epoch, metrics, is_best)
            print(f"Ep {epoch+1:02d}/{self.num_epochs} | Loss: {train_loss:.4f}/{val_loss:.4f} | BalAcc: {metrics['balanced_accuracy']:.4f} | MelSens: {metrics['mel_sensitivity']:.4f} | F1: {metrics['f1_macro']:.4f} | LR: {current_lr:.6f} | ⏱ {time.time() - epoch_start:.0f}s")
            if self.early_stopping(metrics['balanced_accuracy']):
                logger.info(f"\n⏹ Early stopping at epoch {epoch+1}")
                break
        logger.info(f"\n✅ Training complete: {(time.time() - start_time) / 60:.1f} min")
        self._plot_training_curves()
        return self.history