self.onmessage = async (e) => {
  const { id, file, maxWidth = 1920, maxHeight = 1080, quality = 0.8 } = e.data;
  
  try {
    // Graceful degradation: Check if modern Canvas APIs exist in the worker
    if (!self.createImageBitmap || !self.OffscreenCanvas) {
      throw new Error('Web Worker Image Compression not supported on this browser');
    }

    // 1. Create a bitmap representation of the file
    const bitmap = await createImageBitmap(file);
    
    // 2. Calculate scaling to preserve aspect ratio
    let width = bitmap.width;
    let height = bitmap.height;
    
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }

    // 3. Draw onto OffscreenCanvas for hardware-accelerated processing without blocking main thread
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, width, height);

    // 4. Compress to WebP
    const blob = await canvas.convertToBlob({
      type: 'image/webp',
      quality: quality
    });

    self.postMessage({ id, success: true, blob, originalName: file.name });
  } catch (err) {
    // Send back original file as a fallback
    self.postMessage({ id, success: false, error: err.message, file });
  }
};
