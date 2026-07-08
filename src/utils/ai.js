import { pipeline, env } from '@xenova/transformers'

// Skip local model check since we're fetching from HuggingFace
env.allowLocalModels = false

class PipelineSingleton {
  static task = 'feature-extraction'
  static model = 'Xenova/all-MiniLM-L6-v2'
  static instance = null

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, { progress_callback })
    }
    return this.instance
  }
}

/**
 * Generate a 384-dimensional vector embedding for a given text string.
 * @param {string} text - The text to embed
 * @returns {Promise<Array<number>>} - Array of floats representing the embedding
 */
export async function generateEmbedding(text) {
  try {
    const extractor = await PipelineSingleton.getInstance()
    
    // We pass `pooling: 'mean'` and `normalize: true` to get the sentence embedding
    const output = await extractor(text, {
      pooling: 'mean',
      normalize: true
    })
    
    // Convert Float32Array to standard JS Array
    return Array.from(output.data)
  } catch (err) {
    console.error('Error generating embedding:', err)
    return null
  }
}
