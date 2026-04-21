import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file before upload, severely reducing file size
 * and guaranteeing EXIF rotations are baked into the pixels properly.
 */
export async function compressImageForUpload(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1, // Max absolute size in MB
    maxWidthOrHeight: 1280, // Maximum dimension (perfect for mobile view & grids)
    useWebWorker: true, // Use background threads
  };

  // If the file is extremely small already, we could skip compression,
  // but we still want to apply EXIF rotations. So we compress all images!
  try {
    const compressedBlob = await imageCompression(file, options);
    // Convert back to File to retain the original name/type structure if needed
    // browser-image-compression returns a File, but let's be explicitly safe.
    return compressedBlob as File;
  } catch (error) {
    console.error("Compression failed, using original", error);
    return file;
  }
}
