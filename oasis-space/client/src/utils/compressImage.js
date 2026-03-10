import imageCompression from 'browser-image-compression';

/**
 * Compress an image file to under 2MB before upload.
 * Works transparently — user won't notice any difference.
 * Handles both device uploads and browser/pasted images.
 */
export const compressImage = async (file) => {
    // Skip if already under 2MB
    if (file.size <= 2 * 1024 * 1024) return file;

    const options = {
        maxSizeMB: 2,           // Max 2 MB output
        maxWidthOrHeight: 1920, // HD resolution cap
        useWebWorker: true,     // Background thread — no UI freeze
        fileType: 'image/webp', // Modern format, smaller size
    };

    try {
        const compressed = await imageCompression(file, options);
        console.log(`🗜️ Compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressed.size / 1024 / 1024).toFixed(2)}MB`);
        return compressed;
    } catch (error) {
        console.warn('⚠️ Compression failed, using original:', error);
        return file; // Fallback to original if compression fails
    }
};
