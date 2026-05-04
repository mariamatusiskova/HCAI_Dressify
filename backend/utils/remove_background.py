"""Background removal via rembg (ONNX). No HuggingFace / PyTorch — avoids RMBG-1.4 + transformers version conflicts."""

import io

from PIL import Image
from rembg import remove


def remove_background(image: Image.Image) -> Image.Image:
    buf = io.BytesIO()
    image.convert("RGBA").save(buf, format="PNG")
    output_bytes = remove(buf.getvalue())
    return Image.open(io.BytesIO(output_bytes)).convert("RGBA")
