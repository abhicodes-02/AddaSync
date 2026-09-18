const fs = require('fs');
const path = 'src/shared/lib/firebase.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/import \{ getStorage \} from "firebase\/storage";\n/, '');
content = content.replace(/export const storage = getStorage\(app\);\n/, '');

fs.writeFileSync(path, content);
