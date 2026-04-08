import gc
import torch
from transformers import pipeline
from PIL import Image

pipe = None

def get_pipe():
    global pipe
    if pipe is None:
        # Use GPU if available, otherwise use all CPU cores
        device = 0 if torch.cuda.is_available() else -1
        
        # Load the model lazily and assign to GPU/CPU
        pipe = pipeline("image-segmentation", model="briaai/RMBG-1.4", trust_remote_code=True, device=device)
    return pipe

def remove_background(image: Image.Image) -> Image.Image:
    p = get_pipe()
    
    # 2. Never store gradients for inference
    with torch.no_grad():
        result = p(image)
        
    # 3. Clean up any temporary tensors completely
    gc.collect()
    
    return result