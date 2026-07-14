import { get, set } from 'idb-keyval'

// RSA-OAEP for encryption
const ALGORITHM = {
  name: 'RSA-OAEP',
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: 'SHA-256'
}

/**
 * Generate a new RSA-OAEP key pair.
 * Private key is non-extractable for security, but can be stored in IndexedDB.
 */
export async function generateKeyPair() {
  return await window.crypto.subtle.generateKey(
    ALGORITHM,
    false, // extractable (false = cannot be exported by JS, but can be saved to IDB)
    ['encrypt', 'decrypt']
  )
}

/**
 * Exports a public CryptoKey to a Base64 string for database storage.
 */
export async function exportPublicKey(publicKey) {
  const exported = await window.crypto.subtle.exportKey('spki', publicKey)
  const exportedAsString = String.fromCharCode.apply(null, new Uint8Array(exported))
  return btoa(exportedAsString)
}

/**
 * Imports a Base64 string back into a public CryptoKey.
 */
export async function importPublicKey(base64Key) {
  const binaryDerString = atob(base64Key)
  const binaryDer = new Uint8Array(binaryDerString.length)
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i)
  }
  return await window.crypto.subtle.importKey(
    'spki',
    binaryDer.buffer,
    ALGORITHM,
    true,
    ['encrypt']
  )
}

/**
 * Encrypts a string message using the receiver's public key.
 * Returns a Base64 encoded string.
 */
export async function encryptMessage(text, publicKey) {
  const enc = new TextEncoder()
  const encoded = enc.encode(text)
  const encryptedBuf = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    encoded
  )
  const encryptedBytes = new Uint8Array(encryptedBuf)
  const encryptedString = String.fromCharCode.apply(null, encryptedBytes)
  return btoa(encryptedString)
}

/**
 * Decrypts a Base64 string using the local private key.
 * Returns the plaintext string.
 */
export async function decryptMessage(base64Encrypted, privateKey) {
  const encryptedString = atob(base64Encrypted)
  const encryptedBytes = new Uint8Array(encryptedString.length)
  for (let i = 0; i < encryptedString.length; i++) {
    encryptedBytes[i] = encryptedString.charCodeAt(i)
  }
  
  const decryptedBuf = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    encryptedBytes
  )
  const dec = new TextDecoder()
  return dec.decode(decryptedBuf)
}

/**
 * Store the private key locally in IndexedDB using idb-keyval.
 */
export async function storeLocalPrivateKey(userId, privateKey) {
  await set(`e2ee_private_key_${userId}`, privateKey)
}

/**
 * Retrieve the private key from local IndexedDB.
 */
export async function getLocalPrivateKey(userId) {
  return await get(`e2ee_private_key_${userId}`)
}
