import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import transforms  
from dataset import GliomaDataset
from model import NeuroFusionModel
import os

# --- CONFIGURATION ---
CSV_PATH = r"F:\FYP_Preparation\FYP_Data\FYP_Final_Dataset\final_model_data.csv"
MODEL_SAVE_PATH = r"F:\FYP_Preparation\FYP_Data\neurofusion_model.pth"
BATCH_SIZE = 8  # Small batch size for laptop CPU/GPU
EPOCHS = 10     # Fast training for MVP
LEARNING_RATE = 0.001

# --- DEVICE CONFIG ---
# Check if GPU is available, else use CPU
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using Device: {device}")

# --- 1. PREPARE DATA ---
print("Initializing Data Loader...")
# Standard Image Augmentation (Makes the model smarter)
data_transform = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

dataset = GliomaDataset(csv_file=CSV_PATH, transform=data_transform)
dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)

# --- 2. INITIALIZE MODEL ---
print("Initializing NeuroFusion Model...")
model = NeuroFusionModel().to(device)

# --- 3. LOSS FUNCTIONS & OPTIMIZER ---
# CrossEntropy for Classification (Grade)
criterion_grade = nn.CrossEntropyLoss() 
# MSE for Regression (Survival Time)
criterion_survival = nn.MSELoss() 
optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

# --- 4. TRAINING LOOP ---
print(f"Starting Training for {EPOCHS} Epochs...")

for epoch in range(EPOCHS):
    model.train()
    running_loss = 0.0
    
    for i, batch in enumerate(dataloader):
        # Move data to device (CPU or GPU)
        images = batch['image'].to(device)
        tabular = batch['tabular'].to(device)
        grade_labels = batch['grade'].to(device)
        survival_labels = batch['survival'].to(device)
        
        # Zero gradients
        optimizer.zero_grad()
        
        # Forward Pass
        grade_pred, survival_pred = model(images, tabular)
        
        # Calculate Loss (Multi-Task Loss)
        loss_grade = criterion_grade(grade_pred, grade_labels)
        loss_survival = criterion_survival(survival_pred.squeeze(), survival_labels)
        
        # Total Loss = Grade Loss + (0.1 * Survival Loss)
        # We weigh survival less because MSE numbers are usually larger
        total_loss = loss_grade + (0.1 * loss_survival)
        
        # Backward Pass (Learn)
        total_loss.backward()
        optimizer.step()
        
        running_loss += total_loss.item()
        
    # Print stats every epoch
    print(f"Epoch [{epoch+1}/{EPOCHS}] - Loss: {running_loss/len(dataloader):.4f}")

# --- 5. SAVE MODEL ---
torch.save(model.state_dict(), MODEL_SAVE_PATH)
print("="*40)
print(f"Training Complete! Model saved to: {MODEL_SAVE_PATH}")
print("="*40)