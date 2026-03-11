import torch
import torch.nn.functional as F
import numpy as np
import cv2
import base64

class ConvNeXtGradCAM:
    """
    Gradient-weighted Class Activation Mapping tailored specifically for ConvNeXt.
    """
    def __init__(self, model, target_layer_name="backbone.stages.3.blocks.2"):
        self.model = model
        self.gradients = None
        self.activations = None
        
        # We must dynamically find the target layer inside the timm model
        target_layer = dict(self.model.named_modules()).get(target_layer_name)
        if target_layer is None:
            # Fallback to the final norm layer before pooling if naming differs
            target_layer = self.model.backbone.norm 
            
        target_layer.register_forward_hook(self.save_activation)
        target_layer.register_full_backward_hook(self.save_gradient)

    def save_activation(self, module, input, output):
        self.activations = output.detach()

    def save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate(self, image_tensor: torch.Tensor, class_idx: int, original_image_np: np.ndarray) -> str:
        """Generates the heatmap, overlays it on the image, and returns a Base64 string."""
        self.model.eval()
        
        # We need gradients to flow back to the visual backbone
        image_tensor.requires_grad_(True)
        
        # 1. Forward Pass (Dummy metadata since Grad-CAM is visual)
        dummy_meta = torch.zeros((1, 19)).to(image_tensor.device)
        self.model.zero_grad()
        logits = self.model(image_tensor, dummy_meta)
        
        # 2. Backward Pass targeting the specific class
        score = logits[0, class_idx]
        score.backward()
        
        # 3. Compute Weights and Saliency Map
        # ConvNeXt outputs channels last or first depending on the specific block.
        # We handle standard [Batch, Channels, H, W]
        if self.activations.dim() == 4:
            weights = torch.mean(self.gradients, dim=[2, 3], keepdim=True)
            cam = torch.sum(weights * self.activations, dim=1, keepdim=True)
        else:
            # Handle [Batch, H, W, Channels] output from ConvNeXt stages
            weights = torch.mean(self.gradients, dim=[1, 2], keepdim=True)
            cam = torch.sum(weights * self.activations, dim=-1, keepdim=True)
            cam = cam.permute(0, 3, 1, 2) # Back to NCHW
            
        cam = F.relu(cam)
        cam = cam.squeeze().cpu().numpy()
        
        # Prevent division by zero
        cam_max = np.max(cam)
        if cam_max == 0: cam_max = 1e-9
        cam = cam / cam_max
        
        # 4. Resize and Overlay
        cam_resized = cv2.resize(cam, (original_image_np.shape[1], original_image_np.shape[0]))
        heatmap = cv2.applyColorMap(np.uint8(255 * cam_resized), cv2.COLORMAP_JET)
        heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
        
        # 50% Image, 50% Heatmap
        overlaid = cv2.addWeighted(original_image_np, 0.5, heatmap, 0.5, 0)
        
        # 5. Encode to Base64 for JSON API Response
        _, buffer = cv2.imencode('.png', cv2.cvtColor(overlaid, cv2.COLOR_RGB2BGR))
        return base64.b64encode(buffer).decode('utf-8')