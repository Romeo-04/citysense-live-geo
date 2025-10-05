import http from 'http';
import { readFileSync } from 'fs';
import { URL } from 'url';

const PORT = process.env.PROXY_PORT || 3000;

function readEnvKey() {
  try {
    const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
    const match = raw.match(/VITE_DEEPSEEK_API_KEY=(.+)/);
    if (match) return match[1].trim();
  } catch (e) {
    // ignore
  }
  return process.env.VITE_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
}

const API_KEY = readEnvKey();
if (!API_KEY) {
  console.error('No API key found. Set VITE_DEEPSEEK_API_KEY in .env.local or set OPENAI_API_KEY/DEEPSEEK_API_KEY in env.');
  process.exit(1);
}

const TARGET_DEEPSEEK = process.env.TARGET_API_URL || 'https://api.openai.com/v1/chat/completions';

console.log(`Proxy starting on http://localhost:${PORT}/api/chat -> ${TARGET_DEEPSEEK}`);

const server = http.createServer(async (req, res) => {
  const { method, url, headers } = req;
  if (!url) return res.end('No URL');

  if (url === '/api/chat') {
    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });
      return res.end();
    }

    if (method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      return res.end('Method Not Allowed');
    }

    try {
      const body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });

      const targetUrl = TARGET_DEEPSEEK;
      const fetchRes = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body,
      });

      const text = await fetchRes.text();

      // forward status and headers
      const headersOut = {
        'Content-Type': fetchRes.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
      };
      res.writeHead(fetchRes.status, headersOut);
      res.end(text);
    } catch (err) {
      console.error('Proxy error', err);
      res.writeHead(500, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
      res.end(String(err));
    }

    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT);

process.on('SIGINT', () => {
  console.log('Proxy shutting down');
  server.close(() => process.exit(0));
});
