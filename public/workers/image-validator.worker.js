// Image Validation Web Worker
// Performs client-side NSFW filtering and blur detection using TF.js + NSFWJS + Laplacian Variance

// 1. Load TensorFlow.js and NSFWJS from CDN
importScripts(
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.12.0/dist/tf.min.js',
  'https://cdn.jsdelivr.net/npm/nsfwjs@2.4.2/dist/nsfwjs.min.js'
);

let model = null;
let isModelLoading = false;

// 2. Initialize Model
async function loadModel() {
  if (model) return model;
  if (isModelLoading) {
    // Wait for existing load to complete
    while (!model) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return model;
  }

  isModelLoading = true;
  try {
    // Configure CPU backend for reliability in Web Worker environments
    tf.setBackend('cpu');
    // Load MobileNetV2 model files from the locally hosted public directory to avoid CORS/network issues
    model = await nsfwjs.load(self.location.origin + '/models/mobilenet_v2/');
    console.log('[Worker] NSFW model loaded successfully');
    self.postMessage({ type: 'MODEL_LOADED' });
  } catch (error) {
    console.error('[Worker] Failed to load NSFW model:', error);
    self.postMessage({ type: 'MODEL_LOAD_ERROR', error: error.message });
  } finally {
    isModelLoading = false;
  }
  return model;
}

// Pre-load model as soon as worker spawns
loadModel();

// 3. Blur Detection (Laplacian Variance Filter)
function detectBlur(imageData) {
  const { data, width, height } = imageData;
  const grayscale = new Float32Array(width * height);

  // Convert to grayscale
  for (let i = 0; i < data.length; i += 4) {
    grayscale[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  // convolve with Laplacian kernel: [[0, 1, 0], [1, -4, 1], [0, 1, 0]]
  const laplacian = new Float32Array(width * height);
  let sum = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const val =
        -4 * grayscale[idx] +
        grayscale[idx - 1] +
        grayscale[idx + 1] +
        grayscale[idx - width] +
        grayscale[idx + width];
      laplacian[idx] = val;
      sum += val;
    }
  }

  // Calculate Variance of convolved image
  const mean = sum / (width * height);
  let tempSum = 0;
  for (let i = 0; i < laplacian.length; i++) {
    const diff = laplacian[i] - mean;
    tempSum += diff * diff;
  }
  const variance = tempSum / (width * height);
  return variance;
}

// 4. Message Dispatcher
self.addEventListener('message', async (event) => {
  const { type, imageBitmap, filename } = event.data;

  if (type === 'VALIDATE_IMAGE') {
    try {
      const width = imageBitmap.width;
      const height = imageBitmap.height;

      // Extract image data using OffscreenCanvas
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imageBitmap, 0, 0);
      const imageData = ctx.getImageData(0, 0, width, height);

      // Run blur detection (Laplacian Variance threshold < 100.0 is typical for extreme blur)
      const blurVariance = detectBlur(imageData);
      const isBlurry = blurVariance < 100.0;

      // Run NSFW classification
      const activeModel = await loadModel();
      if (!activeModel) {
        throw new Error('NSFW model is not loaded yet');
      }

      const predictions = await activeModel.classify(canvas);

      // Define classification thresholds
      const nsfwThresholds = {
        'Porn': 0.70,
        'Hentai': 0.70,
        'Sexy': 0.85
      };

      let isSafe = true;
      let flaggedReason = '';

      for (const pred of predictions) {
        const threshold = nsfwThresholds[pred.className];
        if (threshold && pred.probability >= threshold) {
          isSafe = false;
          flaggedReason = `${pred.className} content detected (${(pred.probability * 100).toFixed(1)}%)`;
          break;
        }
      }

      // Close transferable bitmap
      imageBitmap.close();

      self.postMessage({
        type: 'VALIDATION_RESULT',
        filename,
        isSafe,
        isBlurry,
        blurVariance,
        flaggedReason,
        predictions
      });

    } catch (error) {
      if (imageBitmap && typeof imageBitmap.close === 'function') {
        imageBitmap.close();
      }
      self.postMessage({
        type: 'VALIDATION_ERROR',
        filename,
        error: error.message || 'Image validation failed'
      });
    }
  }
});
