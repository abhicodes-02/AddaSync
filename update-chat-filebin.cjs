const fs = require('fs');
const path = 'src/features/room/hooks/useChat.js';
let content = fs.readFileSync(path, 'utf8');

// Add import
const importStr = `import { encryptFile } from "../../../shared/utils/crypto";\n`;
if (!content.includes('encryptFile')) {
  content = content.replace('import { db }', importStr + 'import { db }');
}

const sendFileRegex = /const sendFile = useCallback.*?\}, \[sendMessage, roomId\]\);/s;

const newSendFile = `const sendFile = useCallback(async (file, onProgress) => {
    return new Promise(async (resolve, reject) => {
      if (!file) return reject(new Error("No file selected"));
      
      try {
        // 1. Encrypt File E2EE
        if (onProgress) onProgress(10); // initial progress
        const { encryptedBlob, base64Key, base64Iv } = await encryptFile(file);
        
        const fileId = Date.now() + "_" + Math.random().toString(36).substring(7) + "_" + encodeURIComponent(file.name);
        const binName = "addasync_" + roomId.toLowerCase().replace(/[^a-z0-9]/g, '');
        const uploadUrl = \`https://filebin.net/\${binName}/\${fileId}\`;

        // 2. Upload Encrypted File to Filebin
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            // Map 10% to 100% since 0-10% is encryption
            const uploadProgress = (event.loaded / event.total) * 90;
            onProgress(10 + uploadProgress);
          }
        };
        
        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const fileUrl = uploadUrl;
              await sendMessage({
                type: "file",
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                fileUrl: fileUrl,
                encryption: {
                  key: base64Key,
                  iv: base64Iv
                }
              });
              resolve(fileUrl);
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error("Upload failed with status: " + xhr.status));
          }
        };
        
        xhr.onerror = () => reject(new Error("Network error during upload"));
        
        xhr.open("POST", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", "application/octet-stream");
        xhr.send(encryptedBlob);
      } catch (err) {
        reject(err);
      }
    });
  }, [sendMessage, roomId]);`;

content = content.replace(sendFileRegex, newSendFile);
fs.writeFileSync(path, content);
