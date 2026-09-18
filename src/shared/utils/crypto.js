// Convert base64 to Uint8Array
export function base64ToUint8Array(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Convert Uint8Array to base64
export function uint8ArrayToBase64(bytes) {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Generate AES-GCM key and encrypt file
export async function encryptFile(fileBlob) {
  // Generate a new AES-GCM key
  const key = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const arrayBuffer = await fileBlob.arrayBuffer();
  
  // Encrypt the file data
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    arrayBuffer
  );

  // Export the key so we can send it via chat
  const rawKey = await window.crypto.subtle.exportKey("raw", key);
  
  return {
    encryptedBlob: new Blob([encryptedBuffer], { type: "application/octet-stream" }),
    base64Key: uint8ArrayToBase64(new Uint8Array(rawKey)),
    base64Iv: uint8ArrayToBase64(iv)
  };
}

// Decrypt file using the key and iv
export async function decryptFile(encryptedBlob, base64Key, base64Iv, originalType) {
  const rawKey = base64ToUint8Array(base64Key);
  const iv = base64ToUint8Array(base64Iv);
  
  const key = await window.crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    true,
    ["decrypt"]
  );
  
  const encryptedBuffer = await encryptedBlob.arrayBuffer();
  
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encryptedBuffer
  );
  
  return new Blob([decryptedBuffer], { type: originalType || "application/octet-stream" });
}
