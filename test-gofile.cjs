const https = require('https');

const req = https.request('https://api.gofile.io/servers', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://addasync.web.app',
    'Access-Control-Request-Method': 'GET'
  }
}, (res) => {
  console.log('gofile Status:', res.statusCode);
  console.log('gofile Headers:', res.headers);
});
req.end();
