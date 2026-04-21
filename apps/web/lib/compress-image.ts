import imageCompression from 'browser-image-compression';

type ImageType = 'avatar' | 'banner' | 'logo' | 'snippet';

const CONFIGS: Record<ImageType, { maxSizeMB: number; maxWidthOrHeight: number; fileType: string }> = {
  avatar:  { maxSizeMB: 0.2, maxWidthOrHeight: 400,  fileType: 'image/webp' },
  banner:  { maxSizeMB: 0.8, maxWidthOrHeight: 1200, fileType: 'image/webp' },
  logo:    { maxSizeMB: 0.2, maxWidthOrHeight: 400,  fileType: 'image/webp' },
  snippet: { maxSizeMB: 0.5, maxWidthOrHeight: 1080, fileType: 'image/webp' },
};

export async function compressForUpload(file: File, type: ImageType): Promise<File> {
  return imageCompression(file, { ...CONFIGS[type], useWebWorker: true });
}
