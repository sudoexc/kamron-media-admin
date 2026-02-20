/* eslint-disable no-console */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const port = Number(process.env.PORT || 8081);
const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
const distDir = path.join(__dirname, '..', 'dist');

// URL of Kamron's stats API, e.g. https://api.example.com/v1/stats
const statsSourceUrl = process.env.STATS_SOURCE_URL || '';

// Where to persist snapshots
const dataDir = path.join(__dirname, 'data');
const snapshotsFile = path.join(dataDir, 'statistics.json');

// ─── Snapshot storage ────────────────────────────────────────────────────────

const ensureDataDir = () => {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
};

const loadSnapshots = () => {
  try {
    ensureDataDir();
    if (!fs.existsSync(snapshotsFile)) return [];
    return JSON.parse(fs.readFileSync(snapshotsFile, 'utf8'));
  } catch {
    return [];
  }
};

const saveSnapshots = (snapshots) => {
  ensureDataDir();
  fs.writeFileSync(snapshotsFile, JSON.stringify(snapshots, null, 2), 'utf8');
};

// ─── Fetch & store stats ──────────────────────────────────────────────────────

const fetchAndStoreStats = () => {
  if (!statsSourceUrl) {
    console.warn('[stats] STATS_SOURCE_URL not set, skipping fetch');
    return;
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const isHttps = statsSourceUrl.startsWith('https');
  const requestFn = isHttps ? https.get : http.get;

  console.log(`[stats] Fetching stats from ${statsSourceUrl}`);

  requestFn(statsSourceUrl, (res) => {
    let raw = '';
    res.on('data', (chunk) => { raw += chunk; });
    res.on('end', () => {
      try {
        const snapshot = JSON.parse(raw);
        if (!snapshot.ok) {
          console.warn('[stats] Response ok=false, skipping save');
          return;
        }
        snapshot.date = today;

        const snapshots = loadSnapshots();
        // Replace if same date already exists, otherwise append
        const idx = snapshots.findIndex((s) => s.date === today);
        if (idx >= 0) {
          snapshots[idx] = snapshot;
        } else {
          snapshots.push(snapshot);
        }
        // Keep last 400 days max
        if (snapshots.length > 400) snapshots.splice(0, snapshots.length - 400);
        saveSnapshots(snapshots);
        console.log(`[stats] Saved snapshot for ${today} (total=${snapshot.total})`);
      } catch (e) {
        console.error('[stats] Failed to parse response:', e.message);
      }
    });
  }).on('error', (e) => {
    console.error('[stats] Fetch error:', e.message);
  });
};

// ─── Cron: run daily at 04:55 Tashkent (= 23:55 UTC) ─────────────────────────

const scheduleDailyFetch = () => {
  const now = new Date();
  // Next 23:55 UTC
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    23, 55, 0, 0
  ));
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);

  const msUntilFirst = next - now;
  console.log(`[stats] Next fetch scheduled in ${Math.round(msUntilFirst / 60000)} min (${next.toISOString()})`);

  setTimeout(() => {
    fetchAndStoreStats();
    // Then repeat every 24 hours
    setInterval(fetchAndStoreStats, 24 * 60 * 60 * 1000);
  }, msUntilFirst);
};

scheduleDailyFetch();

// ─── Statistics API handlers ──────────────────────────────────────────────────

const handleStatisticsLatest = (res) => {
  const snapshots = loadSnapshots();
  if (snapshots.length === 0) {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'No data yet' }));
    return;
  }
  const latest = snapshots[snapshots.length - 1];
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(latest));
};

const handleStatisticsHistory = (reqUrl, res) => {
  const parsed = new URL(reqUrl, 'http://localhost');
  const period = parsed.searchParams.get('period');
  const from = parsed.searchParams.get('from');
  const to = parsed.searchParams.get('to');

  let snapshots = loadSnapshots();

  if (from && to) {
    snapshots = snapshots.filter((s) => s.date >= from && s.date <= to);
  } else if (period) {
    const now = new Date();
    let cutoff;
    if (period === '7d') cutoff = new Date(now - 7 * 86400000);
    else if (period === '30d') cutoff = new Date(now - 30 * 86400000);
    else if (period === '3m') cutoff = new Date(now - 90 * 86400000);
    else if (period === '1y') cutoff = new Date(now - 365 * 86400000);
    if (cutoff) {
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      snapshots = snapshots.filter((s) => s.date >= cutoffStr);
    }
  }

  snapshots.sort((a, b) => (a.date > b.date ? 1 : -1));
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(snapshots));
};

// ─── Static files ─────────────────────────────────────────────────────────────

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

const sendFile = (filePath, res) => {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
};

const serveStatic = (req, res) => {
  const parsed = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(parsed.pathname);
  const filePath = path.join(distDir, pathname === '/' ? '/index.html' : pathname);

  if (!filePath.startsWith(distDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      sendFile(filePath, res);
      return;
    }
    sendFile(path.join(distDir, 'index.html'), res);
  });
};

// ─── Proxy to backend ─────────────────────────────────────────────────────────

const proxyRequest = (req, res) => {
  const target = new URL(backendUrl);
  const isHttps = target.protocol === 'https:';
  const requestFn = isHttps ? https.request : http.request;
  const forwardPath = req.url || '/';

  const options = {
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port || (isHttps ? 443 : 80),
    method: req.method,
    path: forwardPath,
    headers: {
      ...req.headers,
      host: target.host,
    },
  };

  const proxyReq = requestFn(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (error) => {
    console.error('Proxy error:', error.message);
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad gateway');
  });

  req.pipe(proxyReq, { end: true });
};

// ─── Main server ──────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  const url = req.url || '/';

  // Statistics routes (handled directly, not proxied)
  if (url === '/api/statistics/latest/' || url === '/api/statistics/latest') {
    handleStatisticsLatest(res);
    return;
  }
  if (url.startsWith('/api/statistics/history')) {
    handleStatisticsHistory(url, res);
    return;
  }

  // Everything else under /api → proxy to backend
  if (url.startsWith('/api')) {
    proxyRequest(req, res);
    return;
  }

  serveStatic(req, res);
});

server.listen(port, () => {
  console.log(`Admin frontend listening on :${port}`);
  console.log(`Proxying /api -> ${backendUrl}`);
  console.log(`Stats source: ${statsSourceUrl || '(not set — add STATS_SOURCE_URL to env)'}`);
});
