let worker = null;
let resolveCbs = {};
let messageIdCounter = 0;

/**
 * Generate a 384-dimensional vector embedding for a given text string,
 * offloaded to a Web Worker so the main UI thread doesn't block.
 * @param {string} text - The text to embed
 * @returns {Promise<Array<number>>} - Array of floats representing the embedding
 */
export async function generateEmbedding(text) {
  if (!worker) {
    worker = new Worker(new URL('../workers/ai.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (event) => {
      const { type, id, embedding, error } = event.data;
      if (type === 'result') {
        if (resolveCbs[id]) {
          resolveCbs[id].resolve(embedding);
          delete resolveCbs[id];
        }
      } else if (type === 'error') {
        if (resolveCbs[id]) {
          resolveCbs[id].reject(new Error(error));
          delete resolveCbs[id];
        }
      }
    };
  }

  return new Promise((resolve, reject) => {
    const id = messageIdCounter++;
    resolveCbs[id] = { resolve, reject };
    worker.postMessage({ type: 'embed', text, id });
  });
}
