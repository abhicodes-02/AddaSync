const fs = require('fs');
let content = fs.readFileSync('src/features/room/hooks/useChat.js', 'utf8');

content = content.replace(
  'const fileId = Date.now() + "_" + Math.random().toString(36).substring(7) + "_" + encodeURIComponent(file.name);',
  '// Append .txt so Cloudinary does not block PDF/ZIP delivery by default\n        const fileId = Date.now() + "_" + Math.random().toString(36).substring(7) + "_" + encodeURIComponent(file.name) + ".txt";'
);

fs.writeFileSync('src/features/room/hooks/useChat.js', content);
