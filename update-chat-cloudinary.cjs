const fs = require('fs');
let content = fs.readFileSync('src/features/room/hooks/useChat.js', 'utf8');

const regex = /const binName = "addasync_" \+ roomId.*?;.*?xhr\.send\(encryptedBlob\);/s;

const newUploadLogic = `const fileId = Date.now() + "_" + Math.random().toString(36).substring(7) + "_" + encodeURIComponent(file.name) + ".bin";
        const uploadUrl = "https://api.cloudinary.com/v1_1/rchak3gv/raw/upload";

        const formData = new FormData();
        formData.append("file", encryptedBlob, fileId);
        formData.append("upload_preset", "cghc6hcu");

        // 2. Upload Encrypted File to Cloudinary
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const uploadProgress = (event.loaded / event.total) * 90;
            onProgress(10 + uploadProgress);
          }
        };
        
        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              const fileUrl = response.secure_url;
              
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
        xhr.send(formData);`;

content = content.replace(regex, newUploadLogic);
fs.writeFileSync('src/features/room/hooks/useChat.js', content);
