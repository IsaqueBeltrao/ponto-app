import http from 'http';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { URL } from 'url';

export type ClockAction = 'in' | 'out';

export interface ClockEntry {
  action: ClockAction;
  timestamp: string; // ISO
}

export interface Session {
  token: string;
  username: string;
  entries: ClockEntry[];
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const FRONTEND_DIR = path.resolve(__dirname, '..', 'frontend');

const sessions = new Map<string, Session>();

const jsonResponse = (res: http.ServerResponse, status: number, body: unknown) => {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload, 'utf8'),
  });
  res.end(payload);
};

const parseJson = (req: http.IncomingMessage): Promise<unknown> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => {
      if (chunks.length === 0) return resolve({});
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });

const getTokenFromRequest = (req: http.IncomingMessage): string | null => {
  const auth = req.headers['authorization'];
  if (!auth || Array.isArray(auth)) return null;
  const [scheme, token] = auth.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
};

const serveStatic = (req: http.IncomingMessage, res: http.ServerResponse, parsedUrl: URL) => {
  const cleanPath = parsedUrl.pathname === '/' ? '/index.html' : parsedUrl.pathname;
  const filePath = path.join(FRONTEND_DIR, cleanPath);

  if (!filePath.startsWith(FRONTEND_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404);
      return res.end('Not Found');
    }

    const stream = fs.createReadStream(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mime =
      ext === '.js'
        ? 'application/javascript'
        : ext === '.css'
        ? 'text/css'
        : ext === '.html'
        ? 'text/html'
        : 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': 'no-cache',
    });
    stream.pipe(res);
  });
};

const server = http.createServer(async (req, res) => {
  const host = req.headers.host ?? `localhost:${PORT}`;
  const url = new URL(req.url ?? '', `http://${host}`);

  if (url.pathname.startsWith('/api/')) {
    if (req.method === 'POST' && url.pathname === '/api/login') {
      try {
        const body = (await parseJson(req)) as { username?: string; password?: string };
        if (body.username !== 'admin' || body.password !== '1234') {
          return jsonResponse(res, 401, { error: 'Invalid credentials' });
        }

        const token = cryptoRandomId();
        const session: Session = { token, username: body.username, entries: [] };
        sessions.set(token, session);

        return jsonResponse(res, 200, { token });
      } catch (error) {
        return jsonResponse(res, 400, { error: 'Invalid JSON' });
      }
    }

    const token = getTokenFromRequest(req);
    if (!token || !sessions.has(token)) {
      return jsonResponse(res, 401, { error: 'Unauthorized' });
    }

    const session = sessions.get(token)!;

    if (req.method === 'POST' && url.pathname === '/api/clock') {
      try {
        const body = (await parseJson(req)) as { action?: ClockAction };
        if (body.action !== 'in' && body.action !== 'out') {
          return jsonResponse(res, 400, { error: 'Invalid action' });
        }

        const entry: ClockEntry = { action: body.action, timestamp: new Date().toISOString() };
        session.entries.push(entry);
        return jsonResponse(res, 200, { ok: true, entry });
      } catch (error) {
        return jsonResponse(res, 400, { error: 'Invalid JSON' });
      }
    }

    if (req.method === 'GET' && url.pathname === '/api/clock') {
      return jsonResponse(res, 200, { entries: session.entries });
    }

    return jsonResponse(res, 404, { error: 'Endpoint not found' });
  }

  // Serve frontend static assets
  serveStatic(req, res, url);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Ponto App backend running at http://localhost:${PORT}`);
});

function cryptoRandomId() {
  try {
    return randomUUID();
  } catch {
    return `tk_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  }
}
