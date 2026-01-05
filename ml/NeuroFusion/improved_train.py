import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from improved_dataset import GliomaAdvancedDataset
from improved_model import SeniorNeuroFusionModel
import time

# --- CONFIG ---
CSV_PATH = r"F:\FYP_Preparation\FYP_Data\FYP_Final_Dataset\final_model_data.csv"
KAGGLE_PATH = r"F:\FYP_Preparation\FYP_Data\LGG\kaggle_3m" # Need this for expansion
MODEL_PATH = r"F:\FYP_Preparation\FYP_Data\best_neurofusion_model.pth"
EPOCHS = 20
BATCH_SIZE = 16 # Increased batch size slightly as data increased
LR = 0.001

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Hardware: {device}")

# --- DATASETS ---
# Automatically creates Train (80%) and Val (20%) splits
train_ds = GliomaAdvancedDataset(CSV_PATH, KAGGLE_PATH, mode='train')
val_ds = GliomaAdvancedDataset(CSV_PATH, KAGGLE_PATH, mode='val')

train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False)

# --- MODEL ---
model = SeniorNeuroFusionModel().to(device)
optimizer = optim.Adam(model.parameters(), lr=LR)
scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=3)

# --- LOSSES ---
# Weighted Class Loss (If imbalance exists, e.g., weight=torch.tensor([1.0, 2.0]))
criterion_cls = nn.CrossEntropyLoss()
criterion_reg = nn.MSELoss()

best_val_acc = 0.0

print(f"\nStarting Professional Training Loop for {EPOCHS} Epochs...")
print(f"{'Epoch':^7} | {'Train Loss':^12} | {'Val Loss':^10} | {'Val Acc':^10} | {'Time':^8}")
print("-" * 60)

for epoch in range(EPOCHS):
    start = time.time()
    
    # --- TRAIN ---
    model.train()
    total_train_loss = 0
    
    for batch in train_loader:
        img = batch['image'].to(device)
        tab = batch['tabular'].to(device)
        grade_true = batch['grade'].to(device)
        surv_true = batch['survival'].to(device)
        
        optimizer.zero_grad()
        
        grade_pred, surv_pred = model(img, tab)
        
        # Losses
        loss_c = criterion_cls(grade_pred, grade_true)
        loss_r = criterion_reg(surv_pred.squeeze(), surv_true)
        
        # Combined Loss (Balanced)
        # Note: Survival is normalized (0-1), so its loss will be small (e.g., 0.05). 
        # Classification loss is usually ~0.6.
        loss = loss_c + loss_r 
        
        loss.backward()
        optimizer.step()
        total_train_loss += loss.item()

    avg_train_loss = total_train_loss / len(train_loader)

    # --- VALIDATION ---
    model.eval()
    total_val_loss = 0
    correct = 0
    total = 0
    
    with torch.no_grad():
        for batch in val_loader:
            img = batch['image'].to(device)
            tab = batch['tabular'].to(device)
            grade_true = batch['grade'].to(device)
            surv_true = batch['survival'].to(device)
            
            g_pred, s_pred = model(img, tab)
            
            loss_c = criterion_cls(g_pred, grade_true)
            loss_r = criterion_reg(s_pred.squeeze(), surv_true)
            
            total_val_loss += (loss_c + loss_r).item()
            
            # Accuracy Calculation
            _, predicted = torch.max(g_pred.data, 1)
            total += grade_true.size(0)
            correct += (predicted == grade_true).sum().item()

    avg_val_loss = total_val_loss / len(val_loader)
    val_acc = 100 * correct / total
    
    # Scheduler Step
    scheduler.step(avg_val_loss)
    
    # Checkpointing
    if val_acc > best_val_acc:
        best_val_acc = val_acc
        torch.save(model.state_dict(), MODEL_PATH)
        save_msg = "*" # Mark best model
    else:
        save_msg = ""
        
    duration = time.time() - start
    print(f"{epoch+1:^7} | {avg_train_loss:^12.4f} | {avg_val_loss:^10.4f} | {val_acc:^9.2f}% {save_msg}| {duration:^8.1f}s")

print("-" * 60)
print(f"Best Validation Accuracy: {best_val_acc:.2f}%")
print(f"Model saved to: {MODEL_PATH}")