const fs = require('fs');
const path = 'src/features/room/hooks/useWebRTC.js';
let content = fs.readFileSync(path, 'utf8');

const oldCleanup = "// Files are hosted on tmpfiles.org and auto-delete after 60 mins.";
const newCleanup = `// Delete Filebin (E2EE files)
          try {
            const binName = "addasync_" + roomId.toLowerCase().replace(/[^a-z0-9]/g, '');
            await fetch(\`https://filebin.net/\${binName}\`, { method: 'DELETE' });
            console.log("Filebin deleted.");
          } catch (e) {
            console.warn("Filebin delete error:", e);
          }`;

content = content.replace(oldCleanup, newCleanup);
fs.writeFileSync(path, content);
