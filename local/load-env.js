/* .env faylini o'qib process.env ga yozadi (paket kerak emas). index.js va server.js ishlatadi. */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', '.env');
if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
        if (line.trim().startsWith('#')) continue;
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
        if (m && (process.env[m[1]] === undefined || m[1] === 'ADMIN_KEY')) {
            process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
        }
    }
}
