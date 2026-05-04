const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;
const MAX_BYTES = 5 * 1024 * 1024;

export type CompressionResult = {
  file: File;
  originalSize: number;
  compressedSize: number;
  wasCompressed: boolean;
};

export async function compressChatImage(file: File): Promise<CompressionResult> {
  const originalSize = file.size;

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Image is too large. Please choose a file under 10MB.");
  }

  // GIFs: skip compression (canvas kills animation), just validate size
  if (file.type === "image/gif") {
    if (file.size > MAX_BYTES) throw new Error("GIF files must be under 5MB.");
    return { file, originalSize, compressedSize: file.size, wasCompressed: false };
  }

  const img = await loadImage(file);
  const { width, height } = constrain(img.width, img.height, MAX_DIMENSION);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);

  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";

  let blob = await toBlob(canvas, outputType, outputType === "image/jpeg" ? JPEG_QUALITY : undefined);

  // Second pass at lower quality if still oversized
  if (blob.size > MAX_BYTES && outputType === "image/jpeg") {
    blob = await toBlob(canvas, "image/jpeg", 0.6);
    if (blob.size > MAX_BYTES) {
      throw new Error("Image is too large even after compression. Try a smaller image.");
    }
  } else if (blob.size > MAX_BYTES) {
    throw new Error("Image is too large. Try a smaller file.");
  }

  const compressed = new File([blob], file.name, { type: outputType });
  return {
    file: compressed,
    originalSize,
    compressedSize: compressed.size,
    wasCompressed: compressed.size < originalSize,
  };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image.")); };
    img.src = url;
  });
}

function constrain(w: number, h: number, max: number) {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = Math.min(max / w, max / h);
  return { width: Math.floor(w * ratio), height: Math.floor(h * ratio) };
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => b ? resolve(b) : reject(new Error("Canvas compression failed.")),
      type,
      quality,
    );
  });
}
