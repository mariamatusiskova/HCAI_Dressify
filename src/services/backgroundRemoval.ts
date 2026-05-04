/**
 * Background removal via the local FastAPI backend (`POST /remove-bg`).
 *
 * The model loads once in the Python process (lazy singleton); there is no
 * per-request browser download. Start the API from `backend/`:
 *   uv run python main.py
 *
 * Set `VITE_API_URL` if the API is not at http://127.0.0.1:8000.
 */

function apiBase(): string {
  const raw = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
  return raw.replace(/\/$/, "");
}

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
  // Kept for API compatibility with CanvasEditor / GeneratedItemsList; the backend ignores these.
  _threshold: number = 240,
  _edgeSmoothing: boolean = true,
): Promise<string> {
  const sourceResponse = await fetch(imageUrl);
  if (!sourceResponse.ok) {
    throw new Error(`Failed to load source image: ${sourceResponse.status}`);
  }
  const sourceBlob = await sourceResponse.blob();

  const formData = new FormData();
  formData.append("file", sourceBlob, "image.png");

  let apiResponse: Response;
  try {
    apiResponse = await fetch(`${apiBase()}/remove-bg`, {
      method: "POST",
      body: formData,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    throw new Error(
      `${msg}. Is the backend running at ${apiBase()}? (cd backend && uv run python main.py)`,
    );
  }

  if (!apiResponse.ok) {
    throw new Error(
      `Background removal API error: ${apiResponse.status} ${apiResponse.statusText}. Check ${apiBase()}/remove-bg and backend logs.`,
    );
  }

  const resultBlob = await apiResponse.blob();
  return blobToDataUrl(resultBlob);
}

export async function removeBackground(
  imageUrl: string,
  threshold: number = 25,
): Promise<string> {
  return removeBackgroundAdvanced(imageUrl, threshold, false);
}
