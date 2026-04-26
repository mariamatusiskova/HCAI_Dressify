import io

from PIL import Image
from rembg import remove


def remove_background(image: Image.Image) -> Image.Image:
    image_bytes = io.BytesIO()
    image.convert("RGBA").save(image_bytes, format="PNG")

    # rembg returns raw PNG bytes with transparency.
    output_bytes = remove(image_bytes.getvalue())
    output_image = Image.open(io.BytesIO(output_bytes)).convert("RGBA")

    return output_image
