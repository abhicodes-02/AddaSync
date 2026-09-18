const fs = require('fs');
let fb = fs.readFileSync('src/shared/lib/firebase.js', 'utf8');
fb = fb.replace(/export const storage = getStorage\(app\);/g, '');
fs.writeFileSync('src/shared/lib/firebase.js', fb);

let webrtc = fs.readFileSync('src/features/room/hooks/useWebRTC.js', 'utf8');
webrtc = webrtc.replace(/import \{ ref as storageRef, listAll, deleteObject \} from "firebase\/storage";/g, '');
webrtc = webrtc.replace(/import \{ db, storage \} from "\.\.\/\.\.\/\.\.\/shared\/lib\/firebase";/g, 'import { db } from "../../../shared/lib/firebase";');

// manually chop out the cleanup block
const lines = webrtc.split(/\r?\n/);
const newLines = [];
let skip = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('// 2. Delete Uploaded Files in Storage')) {
    skip = true;
    newLines.push('          // Delete Filebin (E2EE files)');
    newLines.push('          try {');
    newLines.push('            const binName = "addasync_" + roomId.toLowerCase().replace(/[^a-z0-9]/g, "");');
    newLines.push('            await fetch(`https://filebin.net/${binName}`, { method: "DELETE" });');
    newLines.push('          } catch(e) {}');
    continue;
  }
  if (skip && lines[i].includes('} catch (err) {')) {
    // skip this and next 2 lines
    i += 2;
    skip = false;
    continue;
  }
  if (!skip) {
    newLines.push(lines[i]);
  }
}
fs.writeFileSync('src/features/room/hooks/useWebRTC.js', newLines.join('\n'));
