const https = require('https');
const req = https.request('https://filebin.net/testbin', {
  method: 'OPTIONS',
  headers: { 'Origin': 'https://addasync.web.app', 'Access-Control-Request-Method': 'POST' }
}, (res) => {
  console.log('filebin Status:', res.statusCode);
  console.log('filebin Headers:', res.headers);
});
req.end();
