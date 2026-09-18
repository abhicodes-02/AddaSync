const fs = require('fs');

async function test() {
  const binName = 'adda' + Date.now();
  
  // 1. Upload
  const res = await fetch(`https://filebin.net/${binName}/test.txt`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain', 'Origin': 'https://addasync.web.app' },
    body: 'hello world'
  });
  console.log('Upload Status:', res.status);
  
  // 2. Download
  const res2 = await fetch(`https://filebin.net/${binName}/test.txt`, {
    headers: { 'Origin': 'https://addasync.web.app' }
  });
  console.log('Download Status:', res2.status);
  console.log('Download Content-Type:', res2.headers.get('content-type'));
  const text = await res2.text();
  console.log('Download Text:', text.substring(0, 100));
}
test();
