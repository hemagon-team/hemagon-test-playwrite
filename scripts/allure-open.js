const { execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 4040;
const root = path.resolve(__dirname, '../allure-report');

if (!fs.existsSync(root)) {
  console.error('allure-report not found — run npm run allure:generate first');
  process.exit(1);
}

try {
  execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
} catch {
  // No process on that port.
}

const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

const server = http.createServer((req, res) => {
  const url = req.url === '/' ? '/index.html' : (req.url || '/');
  const file = path.join(root, url.split('?')[0]);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(file);
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`Allure report → http://localhost:${port}`);
  try {
    execSync(`cmd.exe /c start http://localhost:${port}`, { stdio: 'ignore' });
  } catch {
    // User can open manually.
  }
});
