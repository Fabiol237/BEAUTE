const https = require('https');

const data = new URLSearchParams({
  email: 'admin@munipro.cm',
  password: 'munipro2024'
}).toString();

const options = {
  hostname: 'js-app-mauve.vercel.app',
  port: 443,
  path: '/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  
  if (res.statusCode === 302) {
    console.log('Redirection vers:', res.headers.location);
    console.log('✅ Connexion réussie (Cookie reçu) !');
  } else {
    console.log('❌ Connexion échouée.');
  }

  res.on('data', d => {
    // console.log(d.toString());
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(data);
req.end();
