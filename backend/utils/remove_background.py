import gc
import torch
from transformers import pipeline
from PIL import Image

pipe = None

def get_pipe():
    global pipe
    if pipe is None:
        # 1. Limit CPU threads to reduce memory allocated per thread
        torch.set_num_threads(1)
        
        # Load the model lazily with low_cpu_mem_usage flag
        pipe = pipeline("image-segmentation", model="briaai/RMBG-1.4", trust_remote_code=True, model_kwargs={"low_cpu_mem_usage": True})
    return pipe

def remove_background(image: Image.Image) -> Image.Image:
    p = get_pipe()
    
    # 2. Never store gradients for inference
    with torch.no_grad():
        result = p(image)
        
    # 3. Clean up any temporary tensors completely
    gc.collect()
    
    return result