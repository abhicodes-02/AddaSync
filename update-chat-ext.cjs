const fs = require('fs');
let content = fs.readFileSync('src/features/room/hooks/useChat.js', 'utf8');

content = content.replace(
  'const fileId = Date.now() + "_" + Math.random().toString(36).substring(7) + "_" + encodeURIComponent(file.name) + ".bin";',
  'const fileId = Date.now() + "_" + Math.random().toString(36).substring(7) + "_" + encodeURIComponent(file.name);'
);

fs.writeFileSync('src/features/room/hooks/useChat.js', content);
