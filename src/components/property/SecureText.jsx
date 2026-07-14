import React, { useEffect, useRef, useState } from 'react';
import wasmUrl from '../../../build/release.wasm?url';

export const SecureText = ({ encryptedPayload, xorKey, fallback = 'Decrypted Content', className = '' }) => {
  const containerRef = useRef(null);
  const shadowRootRef = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [decryptedText, setDecryptedText] = useState(null);

  // 1. Initialize Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect(); // Only decrypt once
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // 2. Fetch and initialize WASM, then decrypt JIT
  useEffect(() => {
    if (!isIntersecting || !encryptedPayload || !xorKey) return;

    let wasmInstance = null;

    const decryptWasm = async () => {
      try {
        const response = await fetch(wasmUrl);
        const buffer = await response.arrayBuffer();
        
        // We instantiate the WASM module
        const module = await WebAssembly.instantiate(buffer, {
          env: {
            abort: () => console.error('WASM abort called')
          }
        });
        
        wasmInstance = module.instance.exports;
        const { allocate, free, decrypt, memory } = wasmInstance;

        // Convert strings to Uint8Array
        const encoder = new TextEncoder();
        
        // Convert comma-separated string back to bytes for decryption if it's a string, or just use as array
        let encryptedBytes;
        if (typeof encryptedPayload === 'string') {
           // For prototype: payload is string of comma separated numbers "12, 34, 55"
           encryptedBytes = new Uint8Array(encryptedPayload.split(',').map(Number));
        } else {
           encryptedBytes = new Uint8Array(encryptedPayload);
        }

        const keyBytes = encoder.encode(xorKey);

        // Allocate memory in WASM
        const encryptedPtr = allocate(encryptedBytes.length);
        const keyPtr = allocate(keyBytes.length);

        // Write data to WASM memory
        const memArray = new Uint8Array(memory.buffer);
        memArray.set(encryptedBytes, encryptedPtr);
        memArray.set(keyBytes, keyPtr);

        // Call the decryption function
        const decryptedPtr = decrypt(encryptedPtr, encryptedBytes.length, keyPtr, keyBytes.length);

        // Read decrypted data from WASM memory
        const decryptedBytes = new Uint8Array(memory.buffer, decryptedPtr, encryptedBytes.length);
        const decoder = new TextDecoder();
        const text = decoder.decode(decryptedBytes);

        setDecryptedText(text);

        // Free memory
        free(encryptedPtr);
        free(keyPtr);
        free(decryptedPtr);

      } catch (err) {
        console.error("WASM Decryption Failed:", err);
      }
    };

    decryptWasm();
  }, [isIntersecting, encryptedPayload, xorKey]);

  // 3. Inject decrypted text into closed Shadow DOM
  useEffect(() => {
    if (decryptedText && containerRef.current && !shadowRootRef.current) {
      // Create closed shadow root to hide from DOM queries (Puppeteer won't see it easily)
      shadowRootRef.current = containerRef.current.attachShadow({ mode: 'closed' });
      
      const span = document.createElement('span');
      span.textContent = decryptedText;
      
      // Inject some styles inside shadow DOM
      const style = document.createElement('style');
      style.textContent = `
        span {
          font-family: inherit;
          color: inherit;
          font-weight: inherit;
          font-size: inherit;
          user-select: none; /* Make it harder to copy manually too */
        }
      `;

      shadowRootRef.current.appendChild(style);
      shadowRootRef.current.appendChild(span);
    }
  }, [decryptedText]);

  return (
    <span ref={containerRef} className={className}>
      {/* Fallback spinner while waiting for JIT decryption */}
      {!decryptedText && (
        <span className="inline-flex items-center gap-2 opacity-50 blur-[2px] transition-all">
          <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          {fallback}
        </span>
      )}
    </span>
  );
};
