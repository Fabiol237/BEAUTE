const { execSync } = require('child_process');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const lines = envContent.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

for (const line of lines) {
    const splitIndex = line.indexOf('=');
    if (splitIndex === -1) continue;
    const key = line.substring(0, splitIndex);
    let value = line.substring(splitIndex + 1);
    
    // For SITE_URL, override with production URL
    if (key === 'SITE_URL') {
        value = 'https://js-app-mauve.vercel.app';
    }

    if (key === 'PORT') continue; // Don't push PORT

    console.log(`Setting ${key}...`);
    try {
        // We use echo value | vercel env add key production
        execSync(`echo ${value} | npx vercel env add ${key} production`, { stdio: 'inherit' });
    } catch (e) {
        console.error(`Failed to set ${key}`);
    }
}
console.log('All env vars pushed to Vercel.');
