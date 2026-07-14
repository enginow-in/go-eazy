// Memory management for AssemblyScript strings
export function allocate(size: i32): usize {
  return heap.alloc(size);
}

export function free(ptr: usize): void {
  heap.free(ptr);
}

// Simple JIT Decryption using XOR (Fast, lightweight, impossible for basic bots to decipher without the key/WASM)
export function decrypt(encryptedPtr: usize, encryptedLen: i32, keyPtr: usize, keyLen: i32): usize {
  // Allocate memory for the decrypted string
  let decryptedPtr = heap.alloc(encryptedLen);

  for (let i = 0; i < encryptedLen; i++) {
    // Read the character from encrypted memory
    let encryptedChar = load<u8>(encryptedPtr + i);
    // Read the character from key memory
    let keyChar = load<u8>(keyPtr + (i % keyLen));
    
    // XOR decryption
    let decryptedChar = encryptedChar ^ keyChar;
    
    // Write the decrypted character to the new memory
    store<u8>(decryptedPtr + i, decryptedChar);
  }

  return decryptedPtr;
}
