from transformers import pipeline
from PIL import Image

pipe = None

def get_pipe():
    global pipe
    if pipe is None:
        # Load the model lazily
        pipe = pipeline("image-segmentation", model="briaai/RMBG-1.4", trust_remote_code=True)
    return pipe

def remove_background(image: Image.Image) -> Image.Image:
    p = get_pipe()
    result = p(image)
    return result