/**
 * Background removal service using FastAPI backend
 */

export async function removeBackgroundAdvanced(
  imageUrl: string,
  threshold: number = 240, // Kept for API compatibility, though not used by backend currently
  edgeSmoothing: boolean = true // Kept for API compatibility
): Promise<string> {
  try {
    let blob: Blob;

    // Convert imageUrl (data URL or regular URL) to Blob
    if (imageUrl.startsWith("data:")) {
      const response = await fetch(imageUrl);
      blob = await response.blob();
    } else {
      const response = await fetch(imageUrl);
      blob = await response.blob();
    }

    const formData = new FormData();
    formData.append("file", blob, "image.png");

    const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
    
    const apiResponse = await fetch(`${apiUrl}/remove-bg`, {
      method: "POST",
      body: formData,
    });

    if (!apiResponse.ok) {
      throw new Error(`Backend API error: ${apiResponse.status} ${apiResponse.statusText}`);
    }

    const resultBlob = await apiResponse.blob();
    
    // Convert the returned Blob back to a base64 Data URL
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
      reader.readAsDataURL(resultBlob);
    });

  } catch (error) {
    console.error("Background removal failed:", error);
    throw error;
  }
}

/**
 * Basic background removal (kept for compatibility with remaining components)
 */
export async function removeBackground(
  imageUrl: string,
  threshold: number = 25
): Promise<string> {
  return removeBackgroundAdvanced(imageUrl, threshold, false);
}
