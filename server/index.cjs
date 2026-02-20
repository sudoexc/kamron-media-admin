/* eslint-disable no-console */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const port = Number(process.env.PORT || 8081);
const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
const distDir = path.join(__dirname, '..', 'dist');

// Where to persist snapshots
const dataDir = path.join(__dirname, 'data');
const snapshotsFile = path.join(dataDir, 'statistics.json');

// ─── Snapshot storage ─────────────────────────────────────────────────────────

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

// ─── HTTP helper ──────────────────────────────────────────────────────────────

const httpGet = (url) => new Promise((resolve, reject) => {
  const isHttps = url.startsWith('https');
  const fn = isHttps ? https.get : http.get;
  fn(url, (res) => {
    let raw = '';
    res.on('data', (chunk) => { raw += chunk; });
    res.on('end', () => {
      try { resolve(JSON.parse(raw)); }
      catch (e) { reject(new Error(`JSON parse error: ${e.message}`)); }
    });
  }).on('error', reject);
});

// ─── Fetch bots list from backend ────────────────────────────────────────────

const fetchBots = async () => {
  try {
    const data = await httpGet(`${backendUrl}/bots/`);
    const list = Array.isArray(data) ? data : (data.results || data.data || []);
    return list.filter((b) => b.request_port);
  } catch (e) {
    console.error('[stats] Failed to fetch bots:', e.message);
    return [];
  }
};

// ─── Fetch stats from a single bot port ──────────────────────────────────────

const fetchBotStats = async (botPort) => {
  try {
    const data = await httpGet(`http://127.0.0.1:${botPort}/v1/stats`);
    if (!data.ok) return null;
    return data;
  } catch (e) {
    console.error(`[stats] Failed to fetch stats from port ${botPort}:`, e.message);
    return null;
  }
};

// ─── Aggregate stats across all bots ─────────────────────────────────────────

const aggregateStats = (results) => {
  // results: array of { bot, stats }
  const sumLang = (field) => ({
    count: results.reduce((s, r) => s + (r.stats[field]?.count || 0), 0),
    ru:    results.reduce((s, r) => s + (r.stats[field]?.ru    || 0), 0),
    en:    results.reduce((s, r) => s + (r.stats[field]?.en    || 0), 0),
    uz__lotin:  results.reduce((s, r) => s + (r.stats[field]?.uz__lotin  || 0), 0),
    uz__kiril:  results.reduce((s, r) => s + (r.stats[field]?.uz__kiril  || 0), 0),
  });

  return {
    ok: true,
    total:         results.reduce((s, r) => s + (r.stats.total         || 0), 0),
    new_users:     results.reduce((s, r) => s + (r.stats.new_users     || 0), 0),
    new_groups:    results.reduce((s, r) => s + (r.stats.new_groups    || 0), 0),
    premium_users: results.reduce((s, r) => s + (r.stats.premium_users || 0), 0),
    unique_groups: results.reduce((s, r) => s + (r.stats.unique_groups || 0), 0),
    blocked_users: results.reduce((s, r) => s + (r.stats.blocked_users || 0), 0),
    downloads:     results.reduce((s, r) => s + (r.stats.downloads     || 0), 0),
    users:         sumLang('users'),
    groups:        sumLang('groups'),
    unique_users:  sumLang('unique_users'),
    timestamp: Math.floor(Date.now() / 1000),
    // per-bot breakdown (stored for future use)
    bots: results.map((r) => ({
      id: r.bot.id,
      title: r.bot.title || r.bot.username,
      port: r.bot.request_port,
      stats: r.stats,
    })),
  };
};

// ─── Main fetch & store ───────────────────────────────────────────────────────

const fetchAndStoreStats = async () => {
  console.log('[stats] Starting stats collection...');
  const today = new Date().toISOString().slice(0, 10);

  const bots = await fetchBots();
  if (bots.length === 0) {
    console.warn('[stats] No bots found, skipping');
    return;
  }
  console.log(`[stats] Found ${bots.length} bots`);

  const results = [];
  for (const bot of bots) {
    const stats = await fetchBotStats(bot.request_port);
    if (stats) {
      results.push({ bot, stats });
      console.log(`[stats] Bot ${bot.title || bot.id} (port ${bot.request_port}): total=${stats.total}`);
    }
  }

  if (results.length === 0) {
    console.warn('[stats] No stats collected');
    return;
  }

  const snapshot = aggregateStats(results);
  snapshot.date = today;

  const snapshots = loadSnapshots();
  const idx = snapshots.findIndex((s) => s.date === today);
  if (idx >= 0) {
    snapshots[idx] = snapshot;
  } else {
    snapshots.push(snapshot);
  }
  // Keep last 400 days
  if (snapshots.length > 400) snapshots.splice(0, snapshots.length - 400);
  saveSnapshots(snapshots);
  console.log(`[stats] Saved snapshot for ${today}: total=${snapshot.total}, bots=${results.length}`);
};

// ─── Cron: daily at 04:55 Tashkent (= 23:55 UTC) ────────────────────────────

const scheduleDailyFetch = () => {
  const now = new Date();
  const next = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
    23, 55, 0, 0
  ));
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);

  const msUntilFirst = next - now;
  console.log(`[stats] Next fetch in ${Math.round(msUntilFirst / 60000)} min (${next.toISOString()})`);

  setTimeout(() => {
    fetchAndStoreStats();
    setInterval(fetchAndStoreStats, 24 * 60 * 60 * 1000);
  }, msUntilFirst);
};

scheduleDailyFetch();

// ─── Statistics API endpoints ─────────────────────────────────────────────────

const handleStatisticsLatest = (res) => {
  const snapshots = loadSnapshots();
  if (snapshots.length === 0) {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'No data yet' }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(snapshots[snapshots.length - 1]));
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
    const msMap = { '7d': 7, '30d': 30, '3m': 90, '1y': 365 };
    const days = msMap[period];
    if (days) {
      const cutoff = new Date(now - days * 86400000).toISOString().slice(0, 10);
      snapshots = snapshots.filter((s) => s.date >= cutoff);
    }
  }

  snapshots.sort((a, b) => (a.date > b.date ? 1 : -1));
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(snapshots));
};

// ─── Static files ─────────────────────────────────────────────────────────────

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.ttf':  'font/ttf',
};

const sendFile = (filePath, res) => {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
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
    if (!err && stat.isFile()) { sendFile(filePath, res); return; }
    sendFile(path.join(distDir, 'index.html'), res);
  });
};

// ─── Proxy to backend ─────────────────────────────────────────────────────────

const proxyRequest = (req, res) => {
  const target = new URL(backendUrl);
  const isHttps = target.protocol === 'https:';
  const requestFn = isHttps ? https.request : http.request;

  const options = {
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port || (isHttps ? 443 : 80),
    method: req.method,
    path: req.url || '/',
    headers: { ...req.headers, host: target.host },
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

  if (url === '/api/statistics/latest/' || url === '/api/statistics/latest') {
    handleStatisticsLatest(res);
    return;
  }
  if (url.startsWith('/api/statistics/history')) {
    handleStatisticsHistory(url, res);
    return;
  }

  if (url.startsWith('/api')) {
    proxyRequest(req, res);
    return;
  }

  serveStatic(req, res);
});

server.listen(port, () => {
  console.log(`Admin frontend listening on :${port}`);
  console.log(`Proxying /api -> ${backendUrl}`);
});
