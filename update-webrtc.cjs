const fs = require('fs');
const path = 'src/features/room/hooks/useWebRTC.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/import \{ db, storage \} from "\.\.\/\.\.\/\.\.\/shared\/lib\/firebase";/, 'import { db } from "../../../shared/lib/firebase";');
content = content.replace(/import \{ ref as storageRef, listAll, deleteObject \} from "firebase\/storage";/, '');

const cleanupLogicRegex = /\/\/ 2\. Delete Uploaded Files in Storage.*?try \{.*?const folderRef = storageRef\(storage, `chat_files\/\$\{roomId\}`\);.*?const fileList = await listAll\(folderRef\);.*?const deleteFilePromises = fileList\.items\.map\(fileRef => deleteObject\(fileRef\)\);.*?await Promise\.all\(deleteFilePromises\);.*?\} catch \(err\) \{.*?console\.warn\("Storage cleanup error:", err\);.*?\}/s;

content = content.replace(cleanupLogicRegex, '// Files are hosted on tmpfiles.org and auto-delete after 60 mins.');

fs.writeFileSync(path, content);
