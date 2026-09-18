const fs = require('fs');
const path = 'src/features/room/components/SidePanel.jsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import FileAttachment')) {
  content = content.replace('import Draggable from "react-draggable";', 'import Draggable from "react-draggable";\nimport FileAttachment from "./FileAttachment";');
}

const regex = /\{m\.type === 'file' \? \([\s\S]*?<\/a>\s*<\/div>\s*<\/div>\s*\) : \(/g;
content = content.replace(regex, "{m.type === 'file' ? (\n                          <FileAttachment m={m} isMe={isMe} />\n                        ) : (");

fs.writeFileSync(path, content);
