const fs = require('fs');
const path = 'src/features/room/hooks/useChat.js';
let content = fs.readFileSync(path, 'utf8');

const sendFileRegex = /const sendFile = useCallback.*?\}, \[sendMessage, roomId\]\);/s;

const newSendFile = `const sendFile = useCallback(async (file, onProgress) => {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error("No file selected"));
      
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      };
      
      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.status === "success") {
              // response.data.url looks like: https://tmpfiles.org/123456/file.png
              // We need to inject '/dl/' to get the direct download link
              const directUrl = response.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
              
              await sendMessage({
                type: "file",
                fileName: file.name,
                fileSize: file.size,
                fileUrl: directUrl,
              });
              resolve(directUrl);
            } else {
              reject(new Error("Upload failed"));
            }
          } catch (err) {
            reject(new Error("Failed to parse response"));
          }
        } else {
          reject(new Error("Upload failed with status: " + xhr.status));
        }
      };
      
      xhr.onerror = () => reject(new Error("Network error during upload"));
      
      xhr.open("POST", "https://tmpfiles.org/api/v1/upload", true);
      xhr.send(formData);
    });
  }, [sendMessage]);`;

content = content.replace(sendFileRegex, newSendFile);
fs.writeFileSync(path, content);
