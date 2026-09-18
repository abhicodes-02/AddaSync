const https = require('https');

const req = https.request('https://tmpfiles.org/api/v1/dl/12345/file.pdf', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://addasync.web.app',
    'Access-Control-Request-Method': 'GET'
  }
}, (res) => {
  console.log('tmpfiles Status:', res.statusCode);
  console.log('tmpfiles Headers:', res.headers);
});
req.end();
