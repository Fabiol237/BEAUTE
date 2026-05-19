const fs = require('fs');
const path = require('path');

function replaceInDir(dir, searchStr, replaceStr) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath, searchStr, replaceStr);
        } else if (fullPath.endsWith('.ejs')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes(searchStr)) {
                content = content.replaceAll(searchStr, replaceStr);
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Replaced in ${fullPath}`);
            }
        }
    });
}

const viewsDir = path.join(__dirname, '..', 'views');
replaceInDir(viewsDir, '<%= siteUrl %>/assets/', '/assets/');
console.log('Done replacing assets paths.');
