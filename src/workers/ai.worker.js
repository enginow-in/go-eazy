import { pipeline, env } from '@xenova/transformers'

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

self.addEventListener('message', async (event) => {
  const { type, text, id } = event.data
  
  if (type === 'embed') {
    try {
      const extractor = await PipelineSingleton.getInstance((x) => {
        self.postMessage({ type: 'progress', data: x })
      })
      
      const output = await extractor(text, {
        pooling: 'mean',
        normalize: true
      })
      
      self.postMessage({ 
        type: 'result', 
        id, 
        embedding: Array.from(output.data) 
      })
    } catch (err) {
      self.postMessage({ type: 'error', id, error: err.message })
    }
  }
})
