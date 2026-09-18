const https = require('https');

const req = https.request('https://file.coffee/api/file/upload', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://addasync.web.app',
    'Access-Control-Request-Method': 'POST'
  }
}, (res) => {
  console.log('file.coffee Status:', res.statusCode);
  console.log('file.coffee Headers:', res.headers);
});
req.end();
