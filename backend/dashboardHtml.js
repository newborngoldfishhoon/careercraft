function getDashboardHtml(port) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CareerCraft API — Diagnostic Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
      --card-bg: rgba(30, 41, 59, 0.7);
      --card-border: rgba(255, 255, 255, 0.1);
      --card-hover-border: rgba(99, 102, 241, 0.4);
      --accent-indigo: #6366f1;
      --accent-purple: #a855f7;
      --accent-cyan: #06b6d4;
      --accent-emerald: #10b981;
      --accent-rose: #f43f5e;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --code-bg: #090d16;
    } 

    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #0b0f19;
      background-image: 
        radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.12) 0px, transparent 50%);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Header */
    header {
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--card-border);
      padding: 1rem 2rem;
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-logo {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, var(--accent-indigo), var(--accent-purple));
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.2rem;
      color: #fff;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .brand-title {
      font-weight: 700;
      font-size: 1.25rem;
      letter-spacing: -0.02em;
      background: linear-gradient(to right, #ffffff, #cbd5e1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: var(--accent-emerald);
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background: var(--accent-emerald);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--accent-emerald);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    .nav-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn-link {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      color: var(--text-main);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .btn-link:hover {
      background: rgba(99, 102, 241, 0.15);
      border-color: var(--accent-indigo);
      color: #fff;
    }

    /* Main Container */
    main {
      flex: 1;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
      padding: 2rem;
    }

    /* Top Banner Cards */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .metric-card {
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 1.25rem;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .metric-card:hover {
      transform: translateY(-2px);
      border-color: var(--card-hover-border);
    }

    .metric-label {
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }

    .metric-val {
      font-size: 1.75rem;
      font-weight: 800;
      color: #fff;
    }

    .metric-sub {
      font-size: 0.75rem;
      color: var(--text-dim);
      margin-top: 0.35rem;
    }

    /* Tabs Navigation */
    .tabs-header {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 1.5rem;
      padding-bottom: 0.5rem;
    }

    .tab-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      padding: 0.6rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tab-btn:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.05);
    }

    .tab-btn.active {
      color: #fff;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2));
      border: 1px solid rgba(99, 102, 241, 0.4);
    }

    .tab-content { display: none; }
    .tab-content.active { display: block; }

    /* Explorer Section */
    .explorer-grid {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 1.5rem;
    }

    @media (max-width: 900px) {
      .explorer-grid { grid-template-columns: 1fr; }
    }

    .endpoint-list {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 650px;
      overflow-y: auto;
    }

    .endpoint-item {
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid transparent;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.2s ease;
    }

    .endpoint-item:hover, .endpoint-item.active {
      background: rgba(99, 102, 241, 0.15);
      border-color: rgba(99, 102, 241, 0.4);
    }

    .method-tag {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .method-get { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .method-post { background: rgba(99, 102, 241, 0.2); color: #818cf8; }

    .endpoint-path {
      font-family: 'Fira Code', monospace;
      font-size: 0.82rem;
      color: #e2e8f0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tester-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .tester-input-group {
      display: flex;
      gap: 0.75rem;
    }

    .method-select {
      background: #0f172a;
      border: 1px solid var(--card-border);
      color: #34d399;
      font-family: 'Fira Code', monospace;
      font-weight: 700;
      padding: 0.6rem 1rem;
      border-radius: 8px;
    }

    .url-input {
      flex: 1;
      background: #0f172a;
      border: 1px solid var(--card-border);
      color: #fff;
      font-family: 'Fira Code', monospace;
      padding: 0.6rem 1rem;
      border-radius: 8px;
      font-size: 0.9rem;
    }

    .btn-send {
      background: linear-gradient(135deg, var(--accent-indigo), var(--accent-purple));
      border: none;
      color: #fff;
      font-weight: 600;
      padding: 0.6rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .btn-send:hover { opacity: 0.9; }

    /* Response Viewer */
    .response-meta {
      display: flex;
      gap: 1rem;
      align-items: center;
      font-size: 0.85rem;
    }

    .status-tag {
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.8rem;
    }
    .status-200 { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .status-404 { background: rgba(244, 63, 94, 0.2); color: #fb7185; }

    .json-box {
      background: var(--code-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 1.25rem;
      font-family: 'Fira Code', monospace;
      font-size: 0.85rem;
      color: #38bdf8;
      max-height: 480px;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }

    /* Database Table Grid */
    .table-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
    }

    .table-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .table-name {
      font-family: 'Fira Code', monospace;
      font-size: 0.9rem;
      color: #f1f5f9;
      font-weight: 600;
    }

    .table-count {
      background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 700;
    }

    /* Request Logs Table */
    .logs-table {
      width: 100%;
      border-collapse: collapse;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      overflow: hidden;
      font-size: 0.85rem;
    }

    .logs-table th, .logs-table td {
      padding: 0.85rem 1.25rem;
      text-align: left;
      border-bottom: 1px solid var(--card-border);
    }

    .logs-table th {
      background: rgba(15, 23, 42, 0.8);
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
    }

    .logs-table tr:hover { background: rgba(255, 255, 255, 0.02); }

    /* Footer */
    footer {
      border-top: 1px solid var(--card-border);
      padding: 1.25rem 2rem;
      text-align: center;
      font-size: 0.8rem;
      color: var(--text-dim);
      background: rgba(15, 23, 42, 0.6);
    }
  </style>
</head>
<body>

  <!-- Header -->
  <header>
    <div class="brand">
      <div class="brand-logo">CC</div>
      <div>
        <div class="brand-title">CareerCraft API Console</div>
        <div style="font-size:0.75rem; color:var(--text-muted);">Backend Server Diagnostic & API Explorer</div>
      </div>
    </div>
    <div class="status-badge">
      <div class="pulse-dot"></div>
      <span>Server Online :${port}</span>
    </div>
    <div class="nav-actions">
      <a href="http://localhost:5173" target="_blank" class="btn-link">
        🌐 Open Frontend Web App ↗
      </a>
      <a href="/api/health" target="_blank" class="btn-link">
        🩺 /api/health
      </a>
    </div>
  </header>

  <main>
    <!-- Top Metrics Overview -->
    <section class="metrics-grid" id="metrics-summary">
      <div class="metric-card">
        <div class="metric-label">Server Health</div>
        <div class="metric-val" style="color:var(--accent-emerald);">Active</div>
        <div class="metric-sub" id="uptime-val">Uptime: Loading...</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Database Status</div>
        <div class="metric-val" style="color:var(--accent-cyan);">SQLite WAL</div>
        <div class="metric-sub" id="db-integrity-val">Integrity: Checking...</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Careers</div>
        <div class="metric-val" id="careers-count-val">-</div>
        <div class="metric-sub">Catalog records loaded</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Memory Usage</div>
        <div class="metric-val" id="memory-val">- MB</div>
        <div class="metric-sub" id="node-ver-val">Node.js</div>
      </div>
    </section>

    <!-- Navigation Tabs -->
    <div class="tabs-header">
      <button class="tab-btn active" onclick="switchTab('explorer')">⚡ API Endpoint Tester</button>
      <button class="tab-btn" onclick="switchTab('database')">💾 Database Inspection</button>
      <button class="tab-btn" onclick="switchTab('logs')">📜 Request Logs</button>
    </div>

    <!-- TAB 1: API Explorer -->
    <section id="tab-explorer" class="tab-content active">
      <div class="explorer-grid">
        <div class="endpoint-list" id="preset-list">
          <!-- Populated by JS -->
        </div>
        <div class="tester-card">
          <div class="tester-input-group">
            <select class="method-select" id="req-method">
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
            <input type="text" class="url-input" id="req-url" value="/api/health">
            <button class="btn-send" onclick="sendTestRequest()">Execute Test</button>
          </div>

          <div class="response-meta" id="resp-meta">
            <span>Status: <strong id="resp-status" class="status-tag status-200">200 OK</strong></span>
            <span>Latency: <strong id="resp-time" style="color:#a855f7;">- ms</strong></span>
          </div>

          <div>
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-weight:600; font-size:0.85rem; color:var(--text-muted);">
              <span>Response Payload</span>
              <button onclick="copyResponseJson()" style="background:none; border:none; color:var(--accent-indigo); cursor:pointer; font-size:0.8rem; font-weight:600;">📋 Copy JSON</button>
            </div>
            <pre class="json-box" id="resp-json">Press "Execute Test" to fetch response...</pre>
          </div>
        </div>
      </div>
    </section>

    <!-- TAB 2: Database Inspection -->
    <section id="tab-database" class="tab-content">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
        <h3>SQLite Tables & Data Records</h3>
        <button class="btn-send" onclick="loadDbStats()">🔄 Refresh DB Counts</button>
      </div>
      <div class="table-grid" id="db-tables-grid">
        <!-- Populated by JS -->
      </div>
    </section>

    <!-- TAB 3: Request Logs -->
    <section id="tab-logs" class="tab-content">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
        <h3>Recent API Requests Activity</h3>
        <button class="btn-send" onclick="loadLogs()">🔄 Refresh Logs</button>
      </div>
      <table class="logs-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Method</th>
            <th>Endpoint</th>
            <th>Status</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody id="logs-tbody">
          <tr><td colspan="5" style="text-align:center; color:var(--text-dim);">Loading request logs...</td></tr>
        </tbody>
      </table>
    </section>
  </main>

  <footer>
    CareerCraft API Service • Environment: ${process.env.NODE_ENV || 'development'} • Port: ${port}
  </footer>

  <script>
    const presets = [
      { method: 'GET', path: '/api/health', name: 'Health Check' },
      { method: 'GET', path: '/api/diagnostics/stats', name: 'Server Diagnostics Stats' },
      { method: 'GET', path: '/api/categories', name: 'All Career Categories' },
      { method: 'GET', path: '/api/careers', name: 'List Featured & All Careers' },
      { method: 'GET', path: '/api/search?q=engineer', name: 'Search Careers ("engineer")' },
      { method: 'GET', path: '/api/assessment/questions', name: 'Assessment Questions' },
      { method: 'GET', path: '/api/trust-stats', name: 'Landing Page Trust Stats' },
      { method: 'GET', path: '/api/faqs', name: 'Frequently Asked Questions' },
      { method: 'GET', path: '/api/colleges', name: 'Colleges & Institutions' },
      { method: 'GET', path: '/api/entrance-exams', name: 'Entrance Exams' },
      { method: 'GET', path: '/api/resources', name: 'Learning Resources' },
      { method: 'GET', path: '/api/communities', name: 'Community Hubs' }
    ];

    function initPresets() {
      const container = document.getElementById('preset-list');
      container.innerHTML = presets.map((p, idx) => \`
        <div class="endpoint-item \${idx === 0 ? 'active' : ''}" onclick="selectPreset('\${p.method}', '\${p.path}', this)">
          <div>
            <div style="font-weight:600; font-size:0.85rem;">\${p.name}</div>
            <div class="endpoint-path">\${p.path}</div>
          </div>
          <span class="method-tag method-\${p.method.toLowerCase()}">\${p.method}</span>
        </div>
      \`).join('');
    }

    function selectPreset(method, path, el) {
      document.querySelectorAll('.endpoint-item').forEach(e => e.classList.remove('active'));
      if (el) el.classList.add('active');
      document.getElementById('req-method').value = method;
      document.getElementById('req-url').value = path;
      sendTestRequest();
    }

    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      event.target.classList.add('active');
      document.getElementById('tab-' + tabId).classList.add('active');

      if (tabId === 'database') loadDbStats();
      if (tabId === 'logs') loadLogs();
    }

    async function fetchStats() {
      try {
        const res = await fetch('/api/diagnostics/stats');
        const data = await res.json();
        
        document.getElementById('uptime-val').innerText = 'Uptime: ' + Math.floor(data.uptimeSeconds) + 's';
        document.getElementById('careers-count-val').innerText = data.database.tables.careers || 0;
        document.getElementById('memory-val').innerText = Math.round(data.memoryUsage.heapUsed / (1024 * 1024)) + ' MB';
        document.getElementById('node-ver-val').innerText = 'Node ' + data.nodeVersion;
        document.getElementById('db-integrity-val').innerText = 'Connected (' + Object.keys(data.database.tables).length + ' tables)';

        renderDbTables(data.database.tables);
      } catch (err) {
        console.error("Stats fetch error:", err);
      }
    }

    function renderDbTables(tables) {
      const grid = document.getElementById('db-tables-grid');
      grid.innerHTML = Object.entries(tables).map(([name, count]) => \`
        <div class="table-card">
          <span class="table-name">\${name}</span>
          <span class="table-count">\${count} rows</span>
        </div>
      \`).join('');
    }

    async function loadDbStats() {
      await fetchStats();
    }

    async function sendTestRequest() {
      const url = document.getElementById('req-url').value;
      const method = document.getElementById('req-method').value;
      const startTime = performance.now();

      try {
        const res = await fetch(url, { method });
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        const data = await res.json();

        const statusEl = document.getElementById('resp-status');
        statusEl.innerText = res.status + ' ' + res.statusText;
        statusEl.className = 'status-tag ' + (res.ok ? 'status-200' : 'status-404');

        document.getElementById('resp-time').innerText = duration + ' ms';
        document.getElementById('resp-json').innerText = JSON.stringify(data, null, 2);
      } catch (err) {
        document.getElementById('resp-status').innerText = 'Error';
        document.getElementById('resp-status').className = 'status-tag status-404';
        document.getElementById('resp-json').innerText = err.message;
      }
    }

    async function loadLogs() {
      try {
        const res = await fetch('/api/diagnostics/logs');
        const data = await res.json();
        const tbody = document.getElementById('logs-tbody');

        if (!data.logs || data.logs.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-dim);">No requests recorded yet. Make some requests in the tester!</td></tr>';
          return;
        }

        tbody.innerHTML = data.logs.map(log => \`
          <tr>
            <td style="color:var(--text-muted); font-family:monospace;">\${new Date(log.timestamp).toLocaleTimeString()}</td>
            <td><span class="method-tag method-\${log.method.toLowerCase()}">\${log.method}</span></td>
            <td style="font-family:monospace; color:#e2e8f0;">\${log.url}</td>
            <td><span class="status-tag status-\${log.status === 200 ? '200' : '404'}">\${log.status}</span></td>
            <td style="color:#a855f7;">\${log.durationMs} ms</td>
          </tr>
        \`).join('');
      } catch (err) {
        console.error("Logs load error:", err);
      }
    }

    function copyResponseJson() {
      const text = document.getElementById('resp-json').innerText;
      navigator.clipboard.writeText(text);
      alert('Response JSON copied to clipboard!');
    }

    // Auto init
    initPresets();
    fetchStats();
    sendTestRequest();
  </script>
</body>
</html>`;
}

module.exports = { getDashboardHtml };
