/**
 * FILE UPLOAD SECURITY UTILITIES
 *
 * Centralized validation functions for all file upload forms in go-eazy.
 * These prevent users from uploading oversized files or non-whitelisted MIME types,
 * protecting against storage exhaustion and potential upload-based attacks.
 */

// ── Allowed MIME Types ──────────────────────────────────────────────────────
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
]

// ── Size Limits ─────────────────────────────────────────────────────────────
export const MAX_IMAGE_SIZE_MB = 5
export const MAX_DOCUMENT_SIZE_MB = 10

const toBytes = (mb) => mb * 1024 * 1024

/**
 * Validates an image file by MIME type and file size.
 * @param {File} file - The file to validate
 * @param {number} maxMb - Maximum allowed size in MB (default 5)
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateImageFile = (file, maxMb = MAX_IMAGE_SIZE_MB) => {
  if (!file) return { valid: false, error: 'No file selected' }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Accepted: JPG, PNG, WEBP, GIF. Got: ${file.type || 'unknown'}`,
    }
  }

  if (file.size > toBytes(maxMb)) {
    const sizeMb = (file.size / 1024 / 1024).toFixed(1)
    return {
      valid: false,
      error: `Image is too large (${sizeMb}MB). Maximum allowed: ${maxMb}MB`,
    }
  }

  return { valid: true }
}

/**
 * Validates a document file (PDF or image) by MIME type and file size.
 * @param {File} file - The file to validate
 * @param {number} maxMb - Maximum allowed size in MB (default 10)
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateDocumentFile = (file, maxMb = MAX_DOCUMENT_SIZE_MB) => {
  if (!file) return { valid: false, error: 'No file selected' }

  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Document type not allowed. Accepted: PDF, JPG, PNG. Got: ${file.type || 'unknown'}`,
    }
  }

  if (file.size > toBytes(maxMb)) {
    const sizeMb = (file.size / 1024 / 1024).toFixed(1)
    return {
      valid: false,
      error: `Document is too large (${sizeMb}MB). Maximum allowed: ${maxMb}MB`,
    }
  }

  return { valid: true }
}

/**
 * Validates an array of image files.
 * Returns the first encountered error, or null if all pass.
 * @param {File[]} files
 * @param {number} maxMb
 * @returns {string|null} Error message or null
 */
export const validateImageFiles = (files, maxMb = MAX_IMAGE_SIZE_MB) => {
  for (const file of files) {
    const result = validateImageFile(file, maxMb)
    if (!result.valid) return result.error
  }
  return null
}

/**
 * Validates an array of document files.
 * Returns the first encountered error, or null if all pass.
 * @param {File[]} files
 * @param {number} maxMb
 * @returns {string|null} Error message or null
 */
export const validateDocumentFiles = (files, maxMb = MAX_DOCUMENT_SIZE_MB) => {
  for (const file of files) {
    const result = validateDocumentFile(file, maxMb)
    if (!result.valid) return result.error
  }
  return null
}
