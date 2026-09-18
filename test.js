const formData = new FormData();
const blob = new Blob(['hello world'], { type: 'text/plain' });
formData.append('file', blob, 'hello.txt');

fetch('https://store1.gofile.io/contents/upload', {
    method: 'POST',
    body: formData
}).then(r => r.json()).then(console.log).catch(console.error);
