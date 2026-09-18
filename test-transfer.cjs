const https = require('https');
const req = https.request('https://transfer.sh/', {
  method: 'OPTIONS',
  headers: { 'Origin': 'https://addasync.web.app', 'Access-Control-Request-Method': 'PUT' }
}, (res) => {
  console.log('transfer.sh Status:', res.statusCode);
  console.log('transfer.sh Headers:', res.headers);
});
req.end();
