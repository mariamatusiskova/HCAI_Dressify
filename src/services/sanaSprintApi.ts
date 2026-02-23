/**
 * Sana Sprint API service for clothing item generation
 * Uses Gradio client to connect to https://sana.hanlab.ai/sprint/
 */

import { Client } from "@gradio/client";

const SANA_SPRINT_URL = "https://sana.hanlab.ai/sprint/";

interface GenerateImageOptions {
  prompt: string;
  style?: string;
  num_imgs?: number;
  seed?: number;
  height?: number;
  width?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
  max_timesteps?: number | string;
  intermediate_timesteps?: number | string;
  timesteps?: string | null;
  randomize_seed?: boolean;
  use_resolution_binning?: boolean;
}

/**
 * Generate a clothing item image using Sana Sprint API
 */
export async function generateClothingItem(
  prompt: string,
  category: "top" | "trousers" | "shoes"
): Promise<string> {
  try {
    // Build the full prompt with category context
    const fullPrompt = `A ${category} item: ${prompt}. High quality fashion photography, white background, product shot, detailed, professional lighting`;

    // Connect to Gradio client
    const client = await Client.connect(SANA_SPRINT_URL);

    // Convert string timesteps to numbers if needed (API expects numbers for dropdown values)
    // This is the key fix - the API expects numbers, not strings for these dropdown parameters
    const maxTimesteps = parseFloat("1.5708");
    const intermediateTimesteps = parseFloat("1.3");

    // Based on the official API documentation and recorded API calls
    const options: any = {
      prompt: fullPrompt,
      style: "(No style)",
      num_imgs: 1,
      seed: 0,
      height: 1024,
      width: 1024,
      guidance_scale: 4.5,
      num_inference_steps: 2,
      max_timesteps: maxTimesteps, // Use number, not string
      intermediate_timesteps: intermediateTimesteps, // Use number, not string
      timesteps: "", // Empty string for default (no custom timesteps)
      randomize_seed: true,
      use_resolution_binning: true,
    };

    // Call the API with retry logic for status errors
    let result;
    const maxRetries = 2;
    let lastError: any = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
        
        result = await client.predict("/run", options);
        break; // Success, exit retry loop
      } catch (predictError: any) {
        lastError = predictError;
        
        // If it's a status error and we have retries left, try again
        if (predictError?.type === "status" && attempt < maxRetries) {
          console.log(`API busy, retrying... (attempt ${attempt + 1}/${maxRetries + 1})`);
          continue;
        }
        
        // Handle Gradio client errors
        let errorMessage = "API call failed";
        
        if (predictError?.original_msg) {
          errorMessage = predictError.original_msg;
        } else if (predictError?.message) {
          errorMessage = predictError.message;
        } else if (typeof predictError === "string") {
          errorMessage = predictError;
        } else if (predictError?.type === "status") {
          errorMessage = `The Sana Sprint API is currently busy or unavailable. Please try again in a moment.`;
        } else {
          const errorInfo = JSON.stringify(predictError, Object.getOwnPropertyNames(predictError));
          errorMessage = `API error: ${errorInfo.substring(0, 200)}`;
        }
        
        console.error("Gradio API error:", predictError);
        throw new Error(errorMessage);
      }
    }
    
    // If we exhausted retries
    if (!result && lastError) {
      throw new Error("API is busy. Please wait a moment and try again.");
    }

    // The result is a list: [gallery, seed, markdown1, markdown2]
    // Gallery contains the generated images
    const gallery = result.data[0];
    
    // Handle different gallery formats (more robust handling from api_test)
    if (!gallery) {
      console.error("No gallery data in result:", result);
      throw new Error("No images returned from API");
    }

    // Handle different gallery formats
    let imageData: any;
    
    if (Array.isArray(gallery)) {
      if (gallery.length === 0) {
        throw new Error("Gallery array is empty");
      }
      imageData = gallery[0];
    } else if (typeof gallery === "object") {
      // Gallery might be an object with images array or direct image data
      imageData = (gallery as any).images?.[0] || (gallery as any).image || gallery;
    } else {
      // Gallery might be a single image directly
      imageData = gallery;
    }
    
    // Handle string URLs (http/https or data URLs)
    if (typeof imageData === "string") {
      if (imageData.startsWith("data:")) {
        return imageData; // Already a data URL
      }
      if (imageData.startsWith("http://") || imageData.startsWith("https://")) {
        // Fetch URL and convert to data URL
        try {
          const response = await fetch(imageData);
          const blob = await response.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (fetchError) {
          console.error("Error fetching image URL:", fetchError);
          throw new Error(`Failed to fetch image from URL: ${imageData}`);
        }
      }
      // If it's a string but not a URL, it might be a file path
      // Try to construct a full URL
      if (imageData.startsWith("/") || !imageData.includes("://")) {
        const baseUrl = SANA_SPRINT_URL.replace(/\/$/, "");
        const fullUrl = imageData.startsWith("/") 
          ? `${baseUrl}${imageData}` 
          : `${baseUrl}/${imageData}`;
        try {
          const response = await fetch(fullUrl);
          const blob = await response.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (fetchError) {
          console.error("Error fetching image from path:", fetchError);
        }
      }
    }

    // Handle object with file/url/path properties
    if (typeof imageData === "object" && imageData !== null) {
      // Check for nested image object (e.g., { image: { url: "...", path: "..." } })
      const nestedImage = (imageData as any).image;
      if (nestedImage && typeof nestedImage === "object") {
        imageData = nestedImage;
      }
      
      const url = (imageData as any).url || 
                  (imageData as any).file || 
                  (imageData as any).path ||
                  (imageData as any).src ||
                  (imageData as any).name;
      
      if (url && typeof url === "string") {
        try {
          // Use the URL directly if it's already a full URL
          const imageUrl = url.startsWith("http://") || url.startsWith("https://")
            ? url 
            : url.startsWith("/")
            ? `${SANA_SPRINT_URL.replace(/\/$/, "")}${url}`
            : `${SANA_SPRINT_URL.replace(/\/$/, "")}/${url}`;
            
          const response = await fetch(imageUrl);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const blob = await response.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (fetchError) {
          console.error("Error fetching image from object URL:", fetchError);
          throw new Error(`Failed to fetch image: ${url}`);
        }
      }
      
      // Check if the object itself contains base64 data
      if ((imageData as any).data) {
        const data = (imageData as any).data;
        if (typeof data === "string") {
          return data.startsWith("data:") ? data : `data:image/png;base64,${data}`;
        }
      }
    }

    // If we get here, log the full structure for debugging
    console.error("Unexpected image data format. Full result:", JSON.stringify(result, null, 2));
    console.error("Image data structure:", JSON.stringify(imageData, null, 2));
    throw new Error(`Unexpected image data format from API. Type: ${typeof imageData}, Value: ${JSON.stringify(imageData).substring(0, 200)}`);
  } catch (error) {
    // Re-throw if it's already an Error with a message
    if (error instanceof Error) {
      throw error;
    }
    
    // Handle other error types
    if (typeof error === "string") {
      throw new Error(error);
    }
    
    console.error("Unexpected error format:", error);
    throw new Error("Failed to generate clothing item image. Please check the console for details.");
  }
}
