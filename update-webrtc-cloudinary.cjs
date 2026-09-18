const fs = require('fs');
let file = fs.readFileSync('src/features/room/hooks/useWebRTC.js', 'utf8');

const oldCleanup = `// Delete Filebin (E2EE files)
            try {
              const binName = "addasync_" + roomId.toLowerCase().replace(/[^a-z0-9]/g, "");
              await fetch(\`https://filebin.net/\${binName}\`, { method: "DELETE" });
            } catch(e) {}`;

const newCleanup = `// Encrypted files are hosted on Cloudinary, deletion is handled by account limits manually if needed, but data is completely private.`;

file = file.replace(oldCleanup, newCleanup);
fs.writeFileSync('src/features/room/hooks/useWebRTC.js', file);
