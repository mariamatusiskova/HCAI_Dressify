import torch
from transformers import pipeline
from PIL import Image

pipe = None

def get_pipe():
    global pipe
    if pipe is None:
        # Load the model lazily, using GPU if available
        device = 0 if torch.cuda.is_available() else -1
        pipe = pipeline("image-segmentation", model="briaai/RMBG-1.4", trust_remote_code=True, device=device)
    return pipe

def remove_background(image: Image.Image) -> Image.Image:
    p = get_pipe()
    result = p(image)
    return result