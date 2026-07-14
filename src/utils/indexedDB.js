const DB_NAME = 'goeazy_db'
const DB_VERSION = 1
const STORE_NAME = 'embeddings'

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error)
      reject(event.target.error)
    }

    request.onsuccess = (event) => {
      resolve(event.target.result)
    }

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

export const saveEmbeddings = async (embeddingsArray) => {
  try {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      embeddingsArray.forEach(item => {
        if (item.id && item.embedding) {
          // ensure embedding is standard array for consistency, or float32array
          let parsedEmbedding = typeof item.embedding === 'string' ? JSON.parse(item.embedding) : item.embedding
          store.put({ id: item.id, embedding: parsedEmbedding })
        }
      })

      transaction.oncomplete = () => resolve(true)
      transaction.onerror = (event) => reject(event.target.error)
    })
  } catch (err) {
    console.error('Failed to save embeddings to IDB:', err)
    return false
  }
}

export const getAllEmbeddings = async () => {
  try {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = (event) => {
        reject(event.target.error)
      }
    })
  } catch (err) {
    console.error('Failed to fetch embeddings from IDB:', err)
    return []
  }
}
