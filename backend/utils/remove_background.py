from transformers import pipeline
from PIL import Image

pipe = pipeline("image-segmentation", model="briaai/RMBG-1.4", trust_remote_code=True)

def remove_background(image: Image.Image) -> Image.Image:
    result = pipe(image)
    return result