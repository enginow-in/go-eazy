/**
 * useFileUpload — shared hook for tracked, retryable Supabase Storage uploads.
 *
 * Uses XMLHttpRequest instead of the Supabase JS SDK because the SDK
 * does not expose upload progress events. We call the Supabase Storage
 * REST API directly: PUT /storage/v1/object/<bucket>/<path>
 *
 * Each file entry in `fileStates`:
 *   { id, file, name, sizeLabel, progress, status, errorMsg, url }
 *
 * status values: 'pending' | 'uploading' | 'success' | 'error'
 */
import { useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const fmtSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

/**
 * @param {string} bucket  — Supabase Storage bucket name
 * @param {string} userId  — current user's ID (used as path prefix)
 */
export const useFileUpload = (bucket, userId) => {
  const [fileStates, setFileStates] = useState([])
  // Keep a ref of active XHRs keyed by file id so we can abort on unmount
  const xhrMapRef = useRef({})

  const setEntry = useCallback((id, patch) => {
    setFileStates(prev =>
      prev.map(f => (f.id === id ? { ...f, ...patch } : f))
    )
  }, [])

  /**
   * Core upload function — uses XHR so we get progress events.
   * Returns the public URL on success, throws on failure.
   */
  const uploadOneFile = useCallback(
    (entry) =>
      new Promise(async (resolve, reject) => {
        const { id, file } = entry

        // ── Build storage path ──────────────────────────────────────────
        const ext = file.name.split('.').pop()
        const safeName = file.name
          .replace(/\s+/g, '_')
          .replace(/[^a-zA-Z0-9._-]/g, '')
        const path = `${userId}/${makeId()}_${safeName}`

        // ── Get auth token ──────────────────────────────────────────────
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const token = session?.access_token
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

        if (!token) {
          reject(new Error('Not authenticated'))
          return
        }

        // ── XHR upload ──────────────────────────────────────────────────
        const xhr = new XMLHttpRequest()
        xhrMapRef.current[id] = xhr

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const pct = Math.min(Math.round((e.loaded / e.total) * 100), 99)
            setEntry(id, { progress: pct, status: 'uploading' })
          }
        })

        xhr.addEventListener('load', () => {
          delete xhrMapRef.current[id]
          if (xhr.status === 200 || xhr.status === 201) {
            // Get public URL via SDK helper
            const { data: { publicUrl } } = supabase.storage
              .from(bucket)
              .getPublicUrl(path)
            setEntry(id, { progress: 100, status: 'success', url: publicUrl })
            resolve(publicUrl)
          } else {
            let msg = `Upload failed (HTTP ${xhr.status})`
            try {
              const body = JSON.parse(xhr.responseText)
              msg = body.message || body.error || msg
            } catch {}
            setEntry(id, { status: 'error', errorMsg: msg })
            reject(new Error(msg))
          }
        })

        xhr.addEventListener('error', () => {
          delete xhrMapRef.current[id]
          const msg = 'Network error during upload'
          setEntry(id, { status: 'error', errorMsg: msg })
          reject(new Error(msg))
        })

        xhr.addEventListener('abort', () => {
          delete xhrMapRef.current[id]
          setEntry(id, { status: 'error', errorMsg: 'Upload cancelled' })
          reject(new Error('Upload cancelled'))
        })

        const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`
        xhr.open('POST', url)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.setRequestHeader('apikey', anonKey)
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
        xhr.setRequestHeader('x-upsert', 'false')

        setEntry(id, { status: 'uploading', progress: 1 })
        xhr.send(file)
      }),
    [bucket, userId, setEntry]
  )

  /**
   * Add new files and immediately start uploading them.
   * Returns the new entries (with ids) so callers can track them.
   */
  const uploadFiles = useCallback(
    (files) => {
      const newEntries = Array.from(files).map((file) => ({
        id: makeId(),
        file,
        name: file.name,
        sizeLabel: fmtSize(file.size),
        progress: 0,
        status: 'pending',
        errorMsg: null,
        url: null,
      }))

      setFileStates((prev) => [...prev, ...newEntries])

      // Kick off uploads in parallel (fire-and-forget — state is updated internally)
      newEntries.forEach((entry) => {
        uploadOneFile(entry).catch(() => {
          // errors are already reflected in state by uploadOneFile
        })
      })

      return newEntries
    },
    [uploadOneFile]
  )

  /**
   * Retry a single failed upload by id.
   */
  const retryFile = useCallback(
    (id) => {
      setFileStates((prev) => {
        const entry = prev.find((f) => f.id === id)
        if (!entry || entry.status === 'uploading') return prev
        // Reset state optimistically
        const updated = prev.map((f) =>
          f.id === id ? { ...f, progress: 0, status: 'pending', errorMsg: null, url: null } : f
        )
        // Kick off upload after state update (use the updated entry)
        const freshEntry = { ...entry, progress: 0, status: 'pending', errorMsg: null, url: null }
        setTimeout(() => {
          uploadOneFile(freshEntry).catch(() => {})
        }, 0)
        return updated
      })
    },
    [uploadOneFile]
  )

  /**
   * Remove a file entry (e.g. when user clicks the ✕ on a preview).
   * Aborts any in-progress XHR for that entry.
   */
  const removeFile = useCallback((id) => {
    if (xhrMapRef.current[id]) {
      xhrMapRef.current[id].abort()
      delete xhrMapRef.current[id]
    }
    setFileStates((prev) => prev.filter((f) => f.id !== id))
  }, [])

  /**
   * Replace the entire fileStates list (used to restore existing URLs on edit).
   * Existing URL entries are marked as 'success' with 100% progress.
   */
  const setExistingUrls = useCallback((urls) => {
    setFileStates(
      (urls || []).map((url) => ({
        id: makeId(),
        file: null,
        name: url.split('/').pop(),
        sizeLabel: '',
        progress: 100,
        status: 'success',
        errorMsg: null,
        url,
      }))
    )
  }, [])

  /** Reset all state */
  const clearAll = useCallback(() => {
    Object.values(xhrMapRef.current).forEach((xhr) => xhr.abort())
    xhrMapRef.current = {}
    setFileStates([])
  }, [])

  const allDone = fileStates.length > 0 && fileStates.every((f) => f.status === 'success' || f.status === 'error')
  const allSuccess = fileStates.length > 0 && fileStates.every((f) => f.status === 'success')
  const hasErrors = fileStates.some((f) => f.status === 'error')
  const hasUploading = fileStates.some((f) => f.status === 'uploading' || f.status === 'pending')
  const successUrls = fileStates.filter((f) => f.status === 'success').map((f) => f.url)

  return {
    fileStates,
    uploadFiles,
    retryFile,
    removeFile,
    setExistingUrls,
    clearAll,
    allDone,
    allSuccess,
    hasErrors,
    hasUploading,
    successUrls,
  }
}
