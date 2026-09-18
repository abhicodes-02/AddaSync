const fs = require('fs');

async function test() {
  const fileData = fs.readFileSync('src/main.jsx');
  const binName = 'adda' + Date.now();
  
  const res = await fetch(`https://filebin.net/${binName}/main.jsx`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/javascript',
      'Origin': 'https://addasync.web.app'
    },
    body: fileData
  });
  
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
}
test();
