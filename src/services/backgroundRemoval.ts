/**
 * Background removal service for clothing product images on white backgrounds
 * Optimized specifically for white background product photography
 */

/**
 * Get pixel index from coordinates
 */
function getPixelIndex(x: number, y: number, width: number): number {
  return (y * width + x) * 4;
}

/**
 * Calculate color distance in RGB space
 */
function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

/**
 * Check if a pixel is likely white/light background
 */
function isWhitePixel(r: number, g: number, b: number, threshold: number = 240): boolean {
  const brightness = (r + g + b) / 3;
  const maxColor = Math.max(r, g, b);
  const minColor = Math.min(r, g, b);
  const colorRange = maxColor - minColor;
  
  return (
    brightness > threshold &&
    maxColor > threshold - 15 &&
    colorRange < 30 &&
    r > threshold - 20 && g > threshold - 20 && b > threshold - 20
  );
}

/**
 * Detect edges using Sobel operator
 */
function detectEdges(data: Uint8ClampedArray, width: number, height: number): boolean[] {
  const edges = new Array(width * height).fill(false);
  
  // Sobel kernels
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = getPixelIndex(x + kx, y + ky, width);
          const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          gx += gray * sobelX[kernelIdx];
          gy += gray * sobelY[kernelIdx];
        }
      }
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      const pixelIdx = (y * width + x);
      edges[pixelIdx] = magnitude > 30; // Edge threshold
    }
  }
  
  return edges;
}

/**
 * Flood fill from a starting point, marking connected white pixels as background
 */
function floodFillBackground(
  data: Uint8ClampedArray,
  isBackground: boolean[],
  edges: boolean[],
  startX: number,
  startY: number,
  width: number,
  height: number,
  threshold: number
): void {
  const stack: [number, number][] = [[startX, startY]];
  const visited = new Set<number>();
  
  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const pixelIdx = y * width + x;
    
    if (visited.has(pixelIdx)) continue;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    
    visited.add(pixelIdx);
    
    const idx = getPixelIndex(x, y, width);
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    
    // Only mark as background if:
    // 1. It's a white pixel
    // 2. It's not an edge (edges indicate object boundaries)
    if (isWhitePixel(r, g, b, threshold) && !edges[pixelIdx]) {
      isBackground[pixelIdx] = true;
      
      // Add neighbors to stack
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          const neighborIdx = ny * width + nx;
          if (!visited.has(neighborIdx) && nx >= 0 && nx < width && ny >= 0 && ny < height) {
            stack.push([nx, ny]);
          }
        }
      }
    }
  }
}

/**
 * Optimized background removal for white background product images
 * Handles white clothing on white backgrounds using edge detection + flood fill
 */
export async function removeBackgroundAdvanced(
  imageUrl: string,
  threshold: number = 240,
  edgeSmoothing: boolean = true
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;

        // Step 1: Detect edges to identify object boundaries
        // This helps distinguish white clothing from white background
        const edges = detectEdges(data, width, height);

        // Step 2: Initialize background array
        const isBackground = new Array(width * height).fill(false);

        // Step 3: Use flood fill from corners and edges
        // Corners are almost certainly background, so start from there
        // This approach ensures white clothing (which is not connected to corners) is preserved
        const cornerPositions = [
          [0, 0], // Top-left
          [width - 1, 0], // Top-right
          [0, height - 1], // Bottom-left
          [width - 1, height - 1], // Bottom-right
        ];
        
        // Also sample along edges for better coverage
        const edgeSamples: [number, number][] = [];
        for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 20))) {
          edgeSamples.push([x, 0]); // Top edge
          edgeSamples.push([x, height - 1]); // Bottom edge
        }
        for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 20))) {
          edgeSamples.push([0, y]); // Left edge
          edgeSamples.push([width - 1, y]); // Right edge
        }

        // Combine corner and edge positions
        const seedPositions = [...cornerPositions, ...edgeSamples];
        
        // Flood fill from each seed position
        for (const [x, y] of seedPositions) {
          if (!isBackground[y * width + x]) {
            floodFillBackground(data, isBackground, edges, x, y, width, height, threshold);
          }
        }

        // Step 4: Expand background slightly to handle anti-aliasing and shadows
        // But be conservative - only expand to pixels that are very close to confirmed background
        const expandedBackground = [...isBackground];
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const pixelIdx = y * width + x;
            if (!isBackground[pixelIdx] && !edges[pixelIdx]) {
              const idx = getPixelIndex(x, y, width);
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              
              // Count background neighbors
              let bgNeighbors = 0;
              for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                  if (dx === 0 && dy === 0) continue;
                  const neighborIdx = (y + dy) * width + (x + dx);
                  if (isBackground[neighborIdx]) {
                    bgNeighbors++;
                  }
                }
              }
              
              // Only expand if pixel is very white and has many background neighbors
              // This handles shadows and slight color variations
              if (bgNeighbors >= 5 && isWhitePixel(r, g, b, threshold - 10)) {
                expandedBackground[pixelIdx] = true;
              }
            }
          }
        }
        
        // Update background array
        for (let i = 0; i < isBackground.length; i++) {
          isBackground[i] = expandedBackground[i];
        }

        // Step 5: Edge smoothing for cleaner edges
        if (edgeSmoothing) {
          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              const idx = getPixelIndex(x, y, width);
              const pixelIdx = y * width + x;

              if (!isBackground[pixelIdx]) {
                // Count background neighbors
                let bgNeighbors = 0;
                for (let dy = -1; dy <= 1; dy++) {
                  for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const neighborIdx = (y + dy) * width + (x + dx);
                    if (isBackground[neighborIdx]) {
                      bgNeighbors++;
                    }
                  }
                }

                // Create smooth alpha transition at edges
                if (bgNeighbors > 0 && bgNeighbors <= 4) {
                  const edgeRatio = bgNeighbors / 8;
                  const currentAlpha = data[idx + 3];
                  // Slight reduction in alpha for edge pixels
                  data[idx + 3] = Math.max(200, currentAlpha * (1 - edgeRatio * 0.3));
                }
              }
            }
          }
        }

        // Step 6: Apply transparency to background pixels
        for (let i = 0; i < data.length; i += 4) {
          const pixelIdx = i / 4;
          if (isBackground[pixelIdx]) {
            data[i + 3] = 0; // Fully transparent
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const result = canvas.toDataURL("image/png");
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    if (imageUrl.startsWith("data:")) {
      img.src = imageUrl;
    } else {
      fetch(imageUrl)
        .then((response) => response.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            img.src = reader.result as string;
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
        .catch(reject);
    }
  });
}

/**
 * Basic background removal (simpler, faster)
 */
export async function removeBackground(
  imageUrl: string,
  threshold: number = 25
): Promise<string> {
  return removeBackgroundAdvanced(imageUrl, threshold, false);
}
