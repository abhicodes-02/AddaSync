const https = require('https');

const req = https.request('https://litterbox.catbox.moe/user/api.php', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://addasync.web.app',
    'Access-Control-Request-Method': 'POST'
  }
}, (res) => {
  console.log('Litterbox Status:', res.statusCode);
  console.log('Litterbox Headers:', res.headers);
});
req.end();
