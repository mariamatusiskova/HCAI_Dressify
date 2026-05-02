/**
 * Background removal service.
 *
 * Runs entirely in the browser using @imgly/background-removal so the
 * production GitHub Pages build doesn't depend on a Python/FastAPI server.
 *
 * The model weights (~50 MB) are downloaded the first time the user removes
 * a background and then served from the browser cache for the rest of the
 * session, so only the first call is slow. Inference happens in a Web Worker
 * via WASM/ONNX Runtime, so the main UI stays responsive.
 *
 * The function signature is unchanged from the previous FastAPI-based
 * implementation so existing callers (CanvasEditor, ImageEditorDialog, etc.)
 * keep working without edits.
 */

import { removeBackground as imglyRemoveBackground } from "@imgly/background-removal";

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert blob to base64 string"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function removeBackgroundAdvanced(
  imageUrl: string,
  // The next two params are kept for API compatibility with the older
  // FastAPI-backed signature; they are ignored by the in-browser model.
  _threshold: number = 240,
  _edgeSmoothing: boolean = true,
): Promise<string> {
  // Convert the input (which is usually a data URL or a same-origin URL)
  // into a Blob the imgly library can consume.
  const sourceResponse = await fetch(imageUrl);
  if (!sourceResponse.ok) {
    throw new Error(`Failed to load source image: ${sourceResponse.status}`);
  }
  const sourceBlob = await sourceResponse.blob();

  // Use library defaults: ISNet model, output as PNG with transparency.
  // Defaults are stable across recent versions and require no config tuning
  // for our use case (clothing photos on a relatively clean background).
  const outputBlob = await imglyRemoveBackground(sourceBlob);
  return blobToDataUrl(outputBlob);
}

/**
 * Basic background removal (kept for compatibility with remaining components).
 */
export async function removeBackground(
  imageUrl: string,
  threshold: number = 25,
): Promise<string> {
  return removeBackgroundAdvanced(imageUrl, threshold, false);
}
