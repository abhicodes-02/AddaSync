const https = require('https');
const req = https.request('https://ti.fo/api/v1/upload', {
  method: 'OPTIONS',
  headers: { 'Origin': 'https://addasync.web.app', 'Access-Control-Request-Method': 'POST' }
}, (res) => {
  console.log('ti.fo Status:', res.statusCode);
  console.log('ti.fo Headers:', res.headers);
});
req.end();
