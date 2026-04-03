from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io

from utils import remove_background

app = FastAPI()

# Allow React to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change in production
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/remove-bg")
async def remove_bg(file: UploadFile = File(...)):
    # Read uploaded file
    image_bytes = await file.read()

    # Convert to PIL Image
    image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")

    # Run your model function
    output_image = remove_background(image)

    # Convert output to bytes
    buffer = io.BytesIO()
    output_image.save(buffer, format="PNG")
    buffer.seek(0)

    return StreamingResponse(buffer, media_type="image/png")