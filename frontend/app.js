// Use window.__CONFIG__?.API_BASE for deployment (set in index.html or config.js)
const API_BASE = (typeof window !== 'undefined' && window.__CONFIG__ && window.__CONFIG__.API_BASE) || 'http://127.0.0.1:5000';

// Track if backend is available
let backendAvailable = null;

const filterPortfolio = document.getElementById('filter-portfolio');
const filterModelType = document.getElementById('filter-model-type');
const filterVintage = document.getElementById('filter-vintage');
const filterSegment = document.getElementById('filter-segment');
const btnApply = document.getElementById('btn-apply');
const summaryLoading = document.getElementById('summary-loading');
const summaryTableWrap = document.getElementById('summary-table-wrap');
const summaryTbody = document.getElementById('summary-tbody');
const detailSection = document.getElementById('detail-section');
const detailTitle = document.getElementById('detail-title');
const detailContent = document.getElementById('detail-content');
const trendModelSelect = document.getElementById('trend-model');
const btnLoadTrends = document.getElementById('btn-load-trends');
const trendsLoading = document.getElementById('trends-loading');
const trendsCharts = document.getElementById('trends-charts');

let chartKS = null;
let chartPSI = null;
let chartVolume = null;
let chartBadRate = null;

let analysisChartKS = null;
let analysisChartPSI = null;
let analysisChartVolume = null;

/** Last loaded summary metrics and portfolio summary rows for Excel export */
let lastSummaryMetrics = [];
let lastPortfolioSummaryRows = [];

/** Active RAG filter from pie chart click: null | 'green' | 'amber' | 'red' */
let activeRagFilter = null;

let portfolioRagPieChart = null;

// Helper function to try backend API, fallback to mock data
async function tryApiOrMock(apiCall, mockCall) {
  try {
    const result = await apiCall();
    if (backendAvailable === null) {
      backendAvailable = true;
      console.log('Using live backend API');
    }
    return result;
  } catch (error) {
    if (backendAvailable === null) {
      backendAvailable = false;
      console.log('Backend unavailable, using demo mock data');
    }
    return mockCall();
  }
}

async function getFilterOptions() {
  return tryApiOrMock(
    async () => {
      const res = await fetch(`${API_BASE}/api/filter-options`);
      if (!res.ok) throw new Error('Filter options failed');
      return res.json();
    },
    () => window.MOCK_API.getFilterOptions()
  );
}

async function getSummary(params = {}) {
  return tryApiOrMock(
    async () => {
      const q = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/api/metrics/summary?${q}`);
      if (!res.ok) throw new Error('Summary failed');
      return res.json();
    },
    () => window.MOCK_API.getSummary(params)
  );
}

async function getDetail(modelId, vintage, segment) {
  return tryApiOrMock(
    async () => {
      let url = `${API_BASE}/api/metrics/detail/${encodeURIComponent(modelId)}?vintage=${encodeURIComponent(vintage)}`;
      if (segment) url += `&segment=${encodeURIComponent(segment)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Detail failed');
      return res.json();
    },
    () => window.MOCK_API.getDetail(modelId, vintage, segment)
  );
}

async function getModels() {
  return tryApiOrMock(
    async () => {
      const res = await fetch(`${API_BASE}/api/models`);
      if (!res.ok) throw new Error('Models failed');
      return res.json();
    },
    () => window.MOCK_API.getModels()
  );
}

async function getTrends(modelId, segment) {
  return tryApiOrMock(
    async () => {
      let url = `${API_BASE}/api/metrics/trends?model_id=${encodeURIComponent(modelId)}`;
      if (segment) url += `&segment=${encodeURIComponent(segment)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Trends failed');
      return res.json();
    },
    () => window.MOCK_API.getTrends(modelId, segment)
  );
}

// --- Data workflow state and API ---
let workflowDatasetId = null;

async function workflowIngest(body) {
  return tryApiOrMock(
    async () => {
      const res = await fetch(`${API_BASE}/api/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
      return res.json();
    },
    () => window.MOCK_API.ingest(body)
  );
}

async function workflowGetDataset(id) {
  return tryApiOrMock(
    async () => {
      const res = await fetch(`${API_BASE}/api/dataset/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error('Dataset not found');
      return res.json();
    },
    () => window.MOCK_API.getDataset(id)
  );
}

async function workflowRunQc(id) {
  return tryApiOrMock(
    async () => {
      const res = await fetch(`${API_BASE}/api/qc/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('QC failed');
      return res.json();
    },
    () => window.MOCK_API.runQc(id)
  );
}

async function workflowScoreDataset(id) {
  return tryApiOrMock(
    async () => {
      const res = await fetch(`${API_BASE}/api/score-dataset/${encodeURIComponent(id)}`, { method: 'POST' });
      if (!res.ok) throw new Error('Scoring failed');
      return res.json();
    },
    () => window.MOCK_API.scoreDataset(id)
  );
}

async function workflowComputeMetrics(datasetId, modelType) {
  return tryApiOrMock(
    async () => {
      const res = await fetch(`${API_BASE}/api/compute-metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset_id: datasetId, model_type: modelType }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Compute failed');
      return res.json();
    },
    () => window.MOCK_API.computeMetrics(datasetId, modelType)
  );
}

function setWorkflowStepDone(stepNum, text) {
  const el = document.querySelector(`.workflow .step[data-step="${stepNum}"]`);
  const status = document.getElementById(`wf-status-${stepNum}`);
  if (el) el.classList.add('done');
  if (status) status.textContent = text || 'Done';
}

function getOtherMetrics(row) {
  const m = row.metrics || {};
  const known = ['KS', 'PSI', 'AUC', 'Gini', 'bad_rate'];
  const rest = Object.keys(m).filter(k => !known.includes(k));
  if (rest.length === 0) return '–';
  return rest.slice(0, 3).map(k => `${k}: ${Number(m[k]).toFixed(3)}`).join('; ');
}

function segmentLabel(seg) {
  if (!seg) return '–';
  return seg === 'thin_file' ? 'Thin file' : seg === 'thick_file' ? 'Thick file' : seg;
}

/** Collapse metrics to one row per model: prefer selected vintage if set, else latest vintage per model. */
function oneRowPerModel(metrics, selectedVintage) {
  const byModel = {};
  (metrics || []).forEach(r => {
    const id = r.model_id;
    const current = byModel[id];
    if (!current) {
      byModel[id] = r;
      return;
    }
    if (selectedVintage) {
      if (r.vintage === selectedVintage) byModel[id] = r;
      else if (current.vintage !== selectedVintage && (r.vintage || '') > (current.vintage || '')) byModel[id] = r;
    } else {
      if ((r.vintage || '') > (current.vintage || '')) byModel[id] = r;
    }
  });
  return Object.values(byModel);
}

function renderSummary(rows) {
  if (!summaryTbody) return;
  summaryTbody.innerHTML = '';
  rows.forEach(row => {
    const tr = document.createElement('tr');
    const m = row.metrics || {};
    tr.innerHTML = `
      <td>${row.model_id}</td>
      <td>${row.portfolio}</td>
      <td>${row.model_type}</td>
      <td>${row.vintage}</td>
      <td>${segmentLabel(row.segment)}</td>
      <td class="num">${m.KS != null ? Number(m.KS).toFixed(4) : '–'}</td>
      <td class="num">${m.PSI != null ? Number(m.PSI).toFixed(4) : '–'}</td>
      <td class="num">${m.AUC != null ? Number(m.AUC).toFixed(4) : '–'}</td>
      <td>${getOtherMetrics(row)}</td>
      <td><button class="btn btn-sm btn-detail" data-model-id="${row.model_id}" data-vintage="${row.vintage}">Detail</button></td>
    `;
    tr.querySelector('.btn-detail').addEventListener('click', () => openDetail(row.model_id, row.vintage, row.segment));
    summaryTbody.appendChild(tr);
  });
}

function renderMetricCell(metrics, keys) {
  const vals = keys.map(k => metrics[k]).filter(v => v !== undefined);
  return vals.length ? vals.map(v => Number(v).toFixed(4)).join(', ') : '–';
}

function openDetail(modelId, vintage, segment) {
  if (!detailSection || !detailTitle || !detailContent) return;
  detailSection.classList.remove('hidden');
  detailTitle.textContent = `${modelId} · ${vintage}${segment ? ' · ' + segmentLabel(segment) : ''}`;
  detailContent.innerHTML = '<div class="loading">Loading…</div>';
  getDetail(modelId, vintage, segment).then(data => {
    renderDetail(data);
  }).catch(() => {
    detailContent.innerHTML = '<p>Failed to load detail.</p>';
  });
  if (trendModelSelect) {
    trendModelSelect.value = modelId;
    loadTrends(modelId, segment);
  }
  document.querySelector('.trends.card')?.scrollIntoView({ behavior: 'smooth' });
}

function renderDetail(data) {
  const m = data.metrics || {};
  const excludeKeys = ['CA_at_10'];
  const entries = Object.entries(m).filter(([k]) => !excludeKeys.includes(k));
  let html = '<div class="metric-grid">';
  entries.forEach(([k, v]) => {
    html += `<div class="metric-box"><div class="label">${k}</div><div class="value">${Number(v).toFixed(4)}</div></div>`;
  });
  html += '</div>';
  if (data.model_type) {
    const badge = data.model_type === 'Fraud' ? 'badge-fraud' : data.model_type === 'Collections' ? 'badge-collections' : data.model_type === 'ML' ? 'badge-ml' : 'badge-scorecard';
    html = `<p><span class="badge ${badge}">${data.model_type}</span></p>` + html;
  }
  if (data.deciles && data.deciles.length) {
    html += '<div class="decile-section"><h3>Decile-level data</h3><table class="data-table"><thead><tr><th>Decile</th><th>Count</th><th>Bad count</th><th>Bad rate</th></tr></thead><tbody>';
    data.deciles.forEach(d => {
      html += `<tr><td class="num">${d.decile}</td><td class="num">${d.count}</td><td class="num">${d.bad_count}</td><td class="num">${(d.bad_rate * 100).toFixed(2)}%</td></tr>`;
    });
    html += '</tbody></table>';
    if (data.decile_commentary) {
      html += `<p class="decile-commentary"><strong>Insight:</strong> ${data.decile_commentary}</p>`;
    }
    html += '</div>';
  }
  if (data.explainability && data.explainability.feature_importance) {
    html += '<div class="explainability"><h3>ML Explainability – Feature importance</h3><ul class="feature-list">';
    data.explainability.feature_importance.forEach(f => {
      html += `<li><span>${f.feature}</span><strong>${Number(f.importance).toFixed(4)}</strong></li>`;
    });
    html += '</ul>';
    if (data.explainability.importance_drift != null) {
      html += `<p><strong>Importance drift:</strong> ${Number(data.explainability.importance_drift).toFixed(4)}</p>`;
    }
    html += '</div>';
  }
  detailContent.innerHTML = html;
}

function applyFilters() {
  summaryTableWrap?.classList.add('hidden');
  summaryLoading?.classList.remove('hidden');
  const portSumLoading = document.getElementById('portfolio-summary-loading');
  const portSumWrap = document.getElementById('portfolio-summary-table-wrap');
  if (portSumLoading) portSumLoading.classList.remove('hidden');
  if (portSumWrap) portSumWrap.classList.add('hidden');
  const params = {};
  if (filterPortfolio?.value) params.portfolio = filterPortfolio.value;
  if (filterModelType?.value) params.model_type = filterModelType.value;
  if (filterVintage?.value) params.vintage = filterVintage.value;
  if (filterSegment?.value) params.segment = filterSegment.value;
  getSummary(params).then(({ metrics }) => {
    const list = metrics || [];
    lastSummaryMetrics = list;
    const filtered = activeRagFilter ? list.filter(m => getModelStatus(m.metrics?.KS, m.metrics?.PSI) === activeRagFilter) : list;
    const selectedVintage = filterVintage?.value || '';
    const onePerModel = oneRowPerModel(filtered, selectedVintage);
    renderSummary(onePerModel);
    loadPortfolioLevelSummary(filtered);
    summaryLoading?.classList.add('hidden');
    summaryTableWrap?.classList.remove('hidden');
    loadPortfolioView(params, filtered);
    updateRagFilterIndicator();
  }).catch(() => {
    summaryLoading.textContent = 'Failed to load summary.';
    document.getElementById('portfolio-summary-loading')?.classList.add('hidden');
    document.getElementById('portfolio-summary-table-wrap')?.classList.remove('hidden');
    loadPortfolioLevelSummary([]);
    loadPortfolioView(params, []);
    activeRagFilter = null;
    updateRagFilterIndicator();
  });
}

function updateRagFilterIndicator() {
  const el = document.getElementById('rag-filter-indicator');
  if (!el) return;
  if (activeRagFilter) {
    el.textContent = `Filter: ${activeRagFilter.charAt(0).toUpperCase() + activeRagFilter.slice(1)} (click segment again to clear)`;
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

function initFilters(opts) {
  (opts.portfolios || []).forEach(p => {
    const o = document.createElement('option');
    o.value = p;
    o.textContent = p;
    filterPortfolio.appendChild(o);
  });
  (opts.model_types || []).forEach(t => {
    const o = document.createElement('option');
    o.value = t;
    o.textContent = t;
    filterModelType.appendChild(o);
  });
  (opts.vintages || []).forEach(v => {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = v;
    filterVintage.appendChild(o);
  });
  if (filterSegment && (opts.segments || []).length) {
    (opts.segments || []).forEach(s => {
      const o = document.createElement('option');
      o.value = (s && s.value) || s;
      o.textContent = (s && s.label) || s.value || s;
      filterSegment.appendChild(o);
    });
  }
  // Workflow dropdowns
  const wfPortfolio = document.getElementById('wf-portfolio');
  const wfModelType = document.getElementById('wf-model-type');
  const wfVintage = document.getElementById('wf-vintage');
  if (wfPortfolio) (opts.portfolios || []).forEach(p => { const o = document.createElement('option'); o.value = p; o.textContent = p; wfPortfolio.appendChild(o); });
  if (wfModelType) (opts.model_types || []).forEach(t => { const o = document.createElement('option'); o.value = t; o.textContent = t; wfModelType.appendChild(o); });
  if (wfVintage) (opts.vintages || []).forEach(v => { const o = document.createElement('option'); o.value = v; o.textContent = v; wfVintage.appendChild(o); });
}

async function init() {
  var loadWarning = document.getElementById('load-warning');
  if (window.location.protocol === 'file:') {
    if (loadWarning) loadWarning.classList.remove('hidden');
  }
  let opts = null;
  try {
    opts = await getFilterOptions();
    if (loadWarning) {
      if (backendAvailable === false) {
        // Using mock data successfully
        loadWarning.classList.remove('hidden');
        loadWarning.style.background = '#e3f2fd';
        loadWarning.style.borderColor = '#2196f3';
        loadWarning.style.color = '#0d47a1';
        loadWarning.innerHTML = '📊 <strong>Demo Mode:</strong> Displaying sample data. To use live data, run <code>run_app.ps1</code> locally and open <strong>http://127.0.0.1:8080</strong>';
      } else {
        loadWarning.classList.add('hidden');
      }
    }
    initFilters(opts);
    applyFilters();
    initKsPsiAnalysis(opts);
    initSegmentLevel(opts);
    initTabs();
    if (opts) initVariableStability(opts);
  } catch (e) {
    if (loadWarning) loadWarning.classList.remove('hidden');
    const isGitHubPages = (typeof window !== 'undefined' && window.__CONFIG__ && window.__CONFIG__.isGitHubPages);
    const apiBase = (typeof window !== 'undefined' && window.__CONFIG__ && window.__CONFIG__.API_BASE) || 'http://127.0.0.1:5000';
    
    if (isGitHubPages) {
      if (loadWarning) loadWarning.innerHTML = `Cannot reach API at <strong>${apiBase}</strong>. <br/>GitHub Pages cannot host backends. For full functionality, deploy your backend API and configure the URL in <code>config.js</code>. <br/>To test locally: Run <code>run_app.ps1</code> and open <strong>http://127.0.0.1:8080</strong> in your browser.`;
    } else {
      if (loadWarning) loadWarning.innerHTML = `Cannot reach API. Run <code>run_app.ps1</code> from the project folder (or run_backend.ps1 + run_frontend.ps1), then open <strong>http://127.0.0.1:8080</strong> in your browser.`;
    }
  }
  btnApply.addEventListener('click', applyFilters);

  // Trends: populate model dropdown
  getModels().then(({ models }) => {
    (models || []).forEach(m => {
      const o = document.createElement('option');
      o.value = m.model_id;
      o.textContent = `${m.model_id} (${m.model_type})`;
      trendModelSelect.appendChild(o);
    });
  }).catch(() => {});

  btnLoadTrends.addEventListener('click', loadTrends);
  trendModelSelect.addEventListener('change', () => {
    if (trendModelSelect.value) loadTrends();
  });

  initWorkflow();

  const btnDownloadExcel = document.getElementById('btn-download-excel');
  if (btnDownloadExcel) btnDownloadExcel.addEventListener('click', downloadExcel);
  const btnDownloadPpt = document.getElementById('btn-download-ppt');
  if (btnDownloadPpt) btnDownloadPpt.addEventListener('click', downloadChartsAsPpt);

  initChat();

  // Overall portfolio view: click card to open KS and PSI Analysis
  const portfolioGrid = document.getElementById('portfolio-grid');
  if (portfolioGrid) {
    portfolioGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.portfolio-card');
      if (!card) return;
      const modelId = card.getAttribute('data-model-id');
      const vintage = card.getAttribute('data-vintage');
      const segment = card.getAttribute('data-segment') || undefined;
      if (modelId && vintage) openDetail(modelId, vintage, segment);
    });
    portfolioGrid.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.portfolio-card');
      if (!card) return;
      e.preventDefault();
      const modelId = card.getAttribute('data-model-id');
      const vintage = card.getAttribute('data-vintage');
      const segment = card.getAttribute('data-segment') || undefined;
      if (modelId && vintage) openDetail(modelId, vintage, segment);
    });
  }
}

async function chatSend() {
  const input = document.getElementById('chat-input');
  const messagesEl = document.getElementById('chat-messages');
  const msg = (input && input.value || '').trim();
  if (!msg || !messagesEl) return;
  input.value = '';
  appendChatMessage('user', msg);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg }),
    });
    const data = await res.json().catch(() => ({}));
    const reply = data.reply || (data.error || 'Could not get a response.');
    appendChatMessage('bot', reply);
  } catch (e) {
    appendChatMessage('bot', 'Network error. Is the backend running at ' + API_BASE + '?');
  }
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function appendChatMessage(role, text) {
  const messagesEl = document.getElementById('chat-messages');
  if (!messagesEl) return;
  const div = document.createElement('div');
  div.className = 'msg ' + role;
  div[role === 'user' ? 'textContent' : 'innerHTML'] = role === 'user' ? text : (text || '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  messagesEl.appendChild(div);
}

function initChat() {
  const toggle = document.getElementById('chat-toggle');
  const panel = document.getElementById('chat-panel');
  const close = document.getElementById('chat-close');
  const input = document.getElementById('chat-input');
  const send = document.getElementById('chat-send');
  const messagesEl = document.getElementById('chat-messages');
  if (toggle && panel) {
    toggle.addEventListener('click', () => {
      panel.classList.toggle('hidden');
      if (!panel.classList.contains('hidden')) {
        input && input.focus();
        if (messagesEl && messagesEl.children.length === 0) {
          appendChatMessage('bot', "Hi! I can help with model performance queries—status, KS, PSI, portfolios, trends, and RAG. Try a suggestion below or type your question.");
        }
      }
    });
  }
  if (close && panel) close.addEventListener('click', () => panel.classList.add('hidden'));
  if (send) send.addEventListener('click', chatSend);
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); chatSend(); }
    });
  }
  document.querySelectorAll('.chat-suggest-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-query');
      if (q && input) {
        input.value = q;
        chatSend();
      }
    });
  });
}

function initWorkflow() {
  const wfUpload = document.getElementById('wf-upload');
  const wfUploadResult = document.getElementById('wf-upload-result');
  const wfRunQc = document.getElementById('wf-run-qc');
  const wfQcResult = document.getElementById('wf-qc-result');
  const wfRunScore = document.getElementById('wf-run-score');
  const wfScoreResult = document.getElementById('wf-score-result');
  const wfCompute = document.getElementById('wf-compute');
  const wfComputeResult = document.getElementById('wf-compute-result');
  const wfGotoSummary = document.getElementById('wf-goto-summary');
  const wfGotoTrends = document.getElementById('wf-goto-trends');

  if (wfUpload) {
    wfUpload.addEventListener('click', async () => {
      const portfolio = document.getElementById('wf-portfolio')?.value;
      const modelType = document.getElementById('wf-model-type')?.value;
      const modelId = document.getElementById('wf-model-id')?.value?.trim();
      const vintage = document.getElementById('wf-vintage')?.value;
      const raw = document.getElementById('wf-data-paste')?.value?.trim();
      wfUploadResult.classList.add('hidden');
      if (!portfolio || !modelType || !modelId || !vintage) {
        wfUploadResult.textContent = 'Please fill Portfolio, Model type, Model ID, and Vintage.';
        wfUploadResult.classList.remove('hidden', 'success');
        wfUploadResult.classList.add('error');
        return;
      }
      let data = [];
      if (raw) {
        try {
          data = JSON.parse(raw);
          if (!Array.isArray(data)) throw new Error('Must be a JSON array');
        } catch (e) {
          wfUploadResult.textContent = 'Invalid JSON array: ' + (e.message || e);
          wfUploadResult.classList.remove('hidden', 'success');
          wfUploadResult.classList.add('error');
          wfUploadResult.classList.remove('hidden');
          return;
        }
      }
      if (data.length === 0) {
        data = [{ target: 0, score: 0.3 }, { target: 1, score: 0.7 }, { target: 0, score: 0.2 }, { target: 1, score: 0.85 }, { target: 0, score: 0.5 }];
      }
      try {
        const result = await workflowIngest({ portfolio, model_type: modelType, model_id: modelId, vintage, data });
        workflowDatasetId = result.dataset_id;
        wfUploadResult.textContent = `Uploaded. Dataset ID: ${result.dataset_id}, rows: ${result.metadata?.row_count ?? data.length}. Proceed to Step 2: Run QC.`;
        wfUploadResult.classList.remove('error');
        wfUploadResult.classList.add('success');
        wfUploadResult.classList.remove('hidden');
        setWorkflowStepDone(1, `Dataset ${result.dataset_id}`);
        wfRunQc.disabled = false;
      } catch (e) {
        wfUploadResult.textContent = e.message || 'Upload failed.';
        wfUploadResult.classList.remove('success');
        wfUploadResult.classList.add('error');
        wfUploadResult.classList.remove('hidden');
      }
    });
  }

  if (wfRunQc) {
    wfRunQc.addEventListener('click', async () => {
      if (!workflowDatasetId) return;
      wfQcResult.classList.add('hidden');
      try {
        const result = await workflowRunQc(workflowDatasetId);
        wfQcResult.textContent = result.pass ? `QC passed. ${result.details || ''}` : `QC failed: ${result.reason || result.details || ''}`;
        wfQcResult.classList.remove('error', 'success');
        wfQcResult.classList.add(result.pass ? 'success' : 'error');
        wfQcResult.classList.remove('hidden');
        setWorkflowStepDone(2, result.pass ? 'Passed' : 'Failed');
        wfRunScore.disabled = false;
        if (result.pass) {
          const ds = await workflowGetDataset(workflowDatasetId).catch(() => null);
          if (ds && ds.has_scores) {
            wfCompute.disabled = false;
            setWorkflowStepDone(3, 'Has scores');
          }
        }
      } catch (e) {
        wfQcResult.textContent = e.message || 'QC failed.';
        wfQcResult.classList.add('error');
        wfQcResult.classList.remove('hidden');
      }
    });
  }

  if (wfRunScore) {
    wfRunScore.addEventListener('click', async () => {
      if (!workflowDatasetId) return;
      wfScoreResult.classList.add('hidden');
      try {
        const result = await workflowScoreDataset(workflowDatasetId);
        wfScoreResult.textContent = `Scoring done. Rows: ${result.row_count}. Proceed to Step 4: Compute metrics.`;
        wfScoreResult.classList.remove('error');
        wfScoreResult.classList.add('success');
        wfScoreResult.classList.remove('hidden');
        setWorkflowStepDone(3, 'Scored');
        wfCompute.disabled = false;
      } catch (e) {
        wfScoreResult.textContent = e.message || 'Scoring failed.';
        wfScoreResult.classList.add('error');
        wfScoreResult.classList.remove('hidden');
      }
    });
  }

  if (wfCompute) {
    wfCompute.addEventListener('click', async () => {
      if (!workflowDatasetId) return;
      const modelType = document.getElementById('wf-model-type')?.value || 'Acquisition Scorecard';
      wfComputeResult.classList.add('hidden');
      try {
        const result = await workflowComputeMetrics(workflowDatasetId, modelType);
        wfComputeResult.innerHTML = `Metrics computed for ${result.model_id}, vintage ${result.vintage}. <br>KS: ${result.metrics?.KS ?? '–'}, PSI: ${result.metrics?.PSI ?? '–'}, AUC: ${result.metrics?.AUC ?? '–'}. Proceed to Step 5: View results.`;
        wfComputeResult.classList.remove('error');
        wfComputeResult.classList.add('success');
        wfComputeResult.classList.remove('hidden');
        setWorkflowStepDone(4, 'Done');
        setWorkflowStepDone(5, 'Ready');
      } catch (e) {
        wfComputeResult.textContent = e.message || 'Compute failed. Ensure data has "target"/"y" and "score"/"probability".';
        wfComputeResult.classList.add('error');
        wfComputeResult.classList.remove('hidden');
      }
    });
  }

  if (wfGotoSummary) {
    wfGotoSummary.addEventListener('click', () => {
      document.querySelector('.summary.card')?.scrollIntoView({ behavior: 'smooth' });
      applyFilters();
    });
  }
  if (wfGotoTrends) {
    wfGotoTrends.addEventListener('click', () => {
      document.querySelector('.trends.card')?.scrollIntoView({ behavior: 'smooth' });
      if (workflowDatasetId) {
        const meta = document.getElementById('wf-model-id')?.value;
        if (meta && trendModelSelect) {
          trendModelSelect.value = meta;
          loadTrends();
        }
      }
    });
  }
}

function destroyCharts() {
  if (chartKS) { chartKS.destroy(); chartKS = null; }
  if (chartPSI) { chartPSI.destroy(); chartPSI = null; }
  if (chartVolume) { chartVolume.destroy(); chartVolume = null; }
  if (chartBadRate) { chartBadRate.destroy(); chartBadRate = null; }
}

function getModelStatus(ks, psi) {
  if (ks == null) ks = 0;
  if (psi == null) psi = 1;
  if (ks >= 0.3 && psi < 0.2) return 'green';
  if (ks >= 0.2 && psi < 0.25) return 'amber';
  return 'red';
}

function loadPortfolioLevelSummary(metrics) {
  const loading = document.getElementById('portfolio-summary-loading');
  const wrap = document.getElementById('portfolio-summary-table-wrap');
  const tbody = document.getElementById('portfolio-summary-tbody');
  if (!loading || !wrap || !tbody) return;
  loading.classList.add('hidden');
  wrap.classList.remove('hidden');
  const rows = metrics || [];
  const byPortfolio = {};
  rows.forEach(r => {
    const port = r.portfolio || 'Other';
    if (!byPortfolio[port]) byPortfolio[port] = [];
    byPortfolio[port].push(r);
  });
  const byModelPerPort = {};
  Object.keys(byPortfolio).forEach(port => {
    const list = byPortfolio[port];
    const byModel = {};
    list.forEach(r => {
      const id = r.model_id;
      if (!byModel[id] || (r.vintage > (byModel[id].vintage || ''))) byModel[id] = r;
    });
    byModelPerPort[port] = Object.values(byModel);
  });
  const portfolios = Object.keys(byModelPerPort).sort();
  lastPortfolioSummaryRows = portfolios.map(port => {
    const list = byModelPerPort[port];
    let green = 0, amber = 0, red = 0;
    list.forEach(r => {
      const m = r.metrics || {};
      const status = getModelStatus(m.KS, m.PSI);
      if (status === 'green') green++; else if (status === 'amber') amber++; else red++;
    });
    const commentary = buildPortfolioCommentary(port, list.length, green, amber, red);
    return { Portfolio: port, Models: list.length, Green: green, Amber: amber, Red: red, Commentary: commentary.replace(/<[^>]+>/g, '').trim() };
  });
  tbody.innerHTML = lastPortfolioSummaryRows.map(row => `
    <tr>
      <td><strong>${row.Portfolio}</strong></td>
      <td class="num">${row.Models}</td>
      <td class="num"><span class="badge status-green">${row.Green}</span></td>
      <td class="num"><span class="badge status-amber">${row.Amber}</span></td>
      <td class="num"><span class="badge status-red">${row.Red}</span></td>
      <td class="portfolio-commentary">${buildPortfolioCommentary(row.Portfolio, row.Models, row.Green, row.Amber, row.Red)}</td>
    </tr>
  `).join('');
  if (portfolios.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">No data for selected filters.</td></tr>';
    lastPortfolioSummaryRows = [];
  }
  const chartWrap = document.getElementById('portfolio-summary-chart-wrap');
  const pieEl = document.getElementById('portfolio-rag-pie');
  if (chartWrap && pieEl) {
    const totalGreen = lastPortfolioSummaryRows.reduce((s, r) => s + (r.Green || 0), 0);
    const totalAmber = lastPortfolioSummaryRows.reduce((s, r) => s + (r.Amber || 0), 0);
    const totalRed = lastPortfolioSummaryRows.reduce((s, r) => s + (r.Red || 0), 0);
    if (totalGreen + totalAmber + totalRed > 0) {
      if (portfolioRagPieChart) { portfolioRagPieChart.destroy(); portfolioRagPieChart = null; }
      const statusKeys = ['green', 'amber', 'red'];
      portfolioRagPieChart = new Chart(pieEl, {
        type: 'pie',
        data: {
          labels: ['Green', 'Amber', 'Red'],
          datasets: [{
            data: [totalGreen, totalAmber, totalRed],
            backgroundColor: ['#2e7d32', '#f9a825', '#c62828'],
            borderWidth: 2,
            borderColor: (ctx) => (activeRagFilter === statusKeys[ctx.dataIndex] ? '#1e3a5f' : '#fff'),
            hoverBorderWidth: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: { callbacks: { title: () => 'Click to filter by this status' } }
          },
          onClick: (evt, elements, chart) => {
            if (elements.length === 0) return;
            const idx = elements[0].index;
            const status = statusKeys[idx];
            activeRagFilter = (activeRagFilter === status ? null : status);
            applyFilters();
          }
        }
      });
      chartWrap.classList.remove('hidden');
      updateRagFilterIndicator();
    } else {
      chartWrap.classList.add('hidden');
    }
  }
}

function buildPortfolioCommentary(portfolio, modelCount, green, amber, red) {
  const total = green + amber + red;
  if (total === 0) return '<em>No model data for this portfolio.</em>';
  const pctG = (green / total * 100).toFixed(0), pctA = (amber / total * 100).toFixed(0), pctR = (red / total * 100).toFixed(0);
  const parts = [];
  parts.push(`<strong>Distribution:</strong> ${pctG}% Green, ${pctA}% Amber, ${pctR}% Red (${total} model${total !== 1 ? 's' : ''}). `);
  if (red > 0) parts.push(`<strong>Risk:</strong> ${red} model${red !== 1 ? 's' : ''} in Red require immediate review (KS &lt; 0.2 or PSI &gt; 0.25). `);
  if (amber > 0) parts.push(`<strong>Review:</strong> ${amber} Amber model${amber !== 1 ? 's' : ''} need proactive monitoring. `);
  if (green / total >= 0.6) parts.push('<strong>Assessment:</strong> Healthy—majority of models show good discrimination and stability. ');
  else if (red / total >= 0.3) parts.push('<strong>Assessment:</strong> Elevated risk—consider portfolio-level remediation. ');
  else parts.push('<strong>Assessment:</strong> Mixed—focus on Red/Amber models. ');
  parts.push('<strong>Next:</strong> Use Trends and Analysis tab for Volume, KS, PSI deep dives.');
  return parts.join('');
}

function downloadExcel() {
  if (typeof XLSX === 'undefined') {
    alert('Excel library not loaded. Refresh the page and try again.');
    return;
  }
  const onePerModel = oneRowPerModel(lastSummaryMetrics, filterVintage?.value || '');
  const modelSheet = onePerModel.map(r => {
    const m = r.metrics || {};
    return {
      'Model ID': r.model_id,
      'Portfolio': r.portfolio,
      'Model type': r.model_type,
      'Vintage': r.vintage,
      'Segment': r.segment ? (r.segment === 'thin_file' ? 'Thin file' : r.segment === 'thick_file' ? 'Thick file' : r.segment) : '',
      'KS': m.KS != null ? Number(m.KS) : '',
      'PSI': m.PSI != null ? Number(m.PSI) : '',
      'AUC': m.AUC != null ? Number(m.AUC) : '',
      'Volume': r.volume != null ? r.volume : '',
    };
  });
  const wb = XLSX.utils.book_new();
  if (modelSheet.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(modelSheet), 'Model Summary');
  }
  if (lastPortfolioSummaryRows.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lastPortfolioSummaryRows), 'Portfolio Summary');
  }
  if (modelSheet.length === 0 && lastPortfolioSummaryRows.length === 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['No data']]), 'Model Summary');
  }
  const name = 'model_monitoring_' + new Date().toISOString().slice(0, 10) + '.xlsx';
  XLSX.writeFile(wb, name);
}

function downloadChartsAsPpt() {
  if (typeof PptxGenJS === 'undefined') {
    alert('PPT library not loaded. Refresh the page and try again.');
    return;
  }
  const pres = new PptxGenJS();
  pres.title = 'Model Monitoring Metrics';
  pres.author = 'Model Monitoring';
  const charts = [
    { id: 'portfolio-rag-pie', title: 'RAG status distribution', wrap: 'portfolio-summary-chart-wrap' },
    { id: 'chart-ks', title: 'KS trend', wrap: 'trends-charts' },
    { id: 'chart-psi', title: 'PSI trend', wrap: 'trends-charts' },
    { id: 'chart-bad-rate', title: 'Bad rate trend', wrap: 'trends-charts' },
    { id: 'chart-volume', title: 'Volume trend', wrap: 'trends-charts' },
    { id: 'analysis-chart-volume', title: 'Volume trend (Analysis)', wrap: 'analysis-content' },
    { id: 'analysis-chart-ks', title: 'KS trend (Analysis)', wrap: 'analysis-content' },
    { id: 'analysis-chart-psi', title: 'PSI trend (Analysis)', wrap: 'analysis-content' }
  ];
  const collected = [];
  const isVisible = (el) => el && !el.closest('[hidden]') && el.offsetParent !== null;
  charts.forEach(({ id, title, wrap }) => {
    const canvas = document.getElementById(id);
    const wrapEl = wrap ? document.getElementById(wrap) : null;
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) return;
    if (wrapEl && (!isVisible(wrapEl) || wrapEl.classList.contains('hidden'))) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      if (dataUrl && dataUrl.length > 100) collected.push({ title, data: dataUrl });
    } catch (e) { /* skip if canvas not ready */ }
  });
  if (collected.length === 0) {
    alert('No charts available. Load metrics (apply filters), load trends, or load analysis first.');
    return;
  }
  const slide1 = pres.addSlide();
  slide1.addText('Model Monitoring – Metrics Charts', { x: 0.5, y: 1, w: 9, h: 0.75, fontSize: 28, bold: true });
  slide1.addText('Generated ' + new Date().toLocaleDateString(), { x: 0.5, y: 1.9, w: 9, h: 0.4, fontSize: 12, color: '666666' });
  const commentary = (document.getElementById('metrics-commentary')?.value || '').trim();
  if (commentary) {
    const slideComment = pres.addSlide();
    slideComment.addText('Commentary', { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 20, bold: true });
    slideComment.addText(commentary.replace(/\n/g, '\n'), { x: 0.5, y: 1.1, w: 9, h: 5, fontSize: 12, valign: 'top', wrap: true });
  }
  collected.forEach(({ title, data }) => {
    const slide = pres.addSlide();
    slide.addText(title, { x: 0.5, y: 0.25, w: 9, h: 0.5, fontSize: 18, bold: true });
    slide.addImage({ data, x: 0.5, y: 0.9, w: 6.5, h: 4 });
  });
  const name = 'model_monitoring_charts_' + new Date().toISOString().slice(0, 10) + '.pptx';
  pres.writeFile({ fileName: name });
}

async function loadPortfolioView(params, metricsOverride) {
  const loading = document.getElementById('portfolio-loading');
  const grid = document.getElementById('portfolio-grid');
  if (!loading || !grid) return;
  try {
    const metrics = (metricsOverride !== undefined && Array.isArray(metricsOverride)) ? metricsOverride : (await getSummary(params || {})).metrics || [];
    const byModel = {};
    (metrics || []).forEach(r => {
      const id = r.model_id;
      if (!byModel[id] || (r.vintage > (byModel[id].vintage || ''))) byModel[id] = r;
    });
    const list = Object.values(byModel);
    loading.classList.add('hidden');
    grid.classList.remove('hidden');
    grid.innerHTML = list.map(r => {
      const m = r.metrics || {};
      const status = getModelStatus(m.KS, m.PSI);
      const seg = r.segment ? ` data-segment="${r.segment}"` : '';
      return `<div class="portfolio-card status-${status}" role="button" tabindex="0" data-model-id="${r.model_id}" data-vintage="${r.vintage}"${seg} title="Click to view detail">
        <span class="portfolio-status" title="${status}"></span>
        <div class="portfolio-card-body">
          <strong>${r.model_id}</strong>
          <div>${r.portfolio} · ${r.model_type}</div>
          <div class="portfolio-metrics">KS ${m.KS != null ? Number(m.KS).toFixed(3) : '–'} | PSI ${m.PSI != null ? Number(m.PSI).toFixed(3) : '–'}</div>
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    loading.textContent = 'Failed to load portfolio.';
    grid.classList.remove('hidden');
  }
}

async function getVariableStability(modelId, vintage) {
  return tryApiOrMock(
    async () => {
      const res = await fetch(`${API_BASE}/api/metrics/variable-stability?model_id=${encodeURIComponent(modelId)}&vintage=${encodeURIComponent(vintage)}`);
      if (!res.ok) throw new Error('Stability failed');
      return res.json();
    },
    () => window.MOCK_API.getVariableStability(modelId, vintage)
  );
}

async function getSegmentMetrics(modelId, vintage) {
  return tryApiOrMock(
    async () => {
      const res = await fetch(`${API_BASE}/api/metrics/segments?model_id=${encodeURIComponent(modelId)}&vintage=${encodeURIComponent(vintage)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Segments failed');
      }
      return res.json();
    },
    () => window.MOCK_API.getSegmentMetrics(modelId, vintage)
  );
}

function initSegmentLevel(opts) {
  const segModel = document.getElementById('seg-model');
  const segVintage = document.getElementById('seg-vintage');
  const btnLoad = document.getElementById('btn-load-segments');
  const loading = document.getElementById('segments-loading');
  const errorEl = document.getElementById('segments-error');
  const wrap = document.getElementById('segments-table-wrap');
  const tbody = document.getElementById('segments-tbody');
  if (!opts) return;
  (opts.vintages || []).forEach(v => {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = v;
    if (segVintage) segVintage.appendChild(o);
  });
  getModels().then(({ models }) => {
    (models || []).forEach(m => {
      const o = document.createElement('option');
      o.value = m.model_id;
      o.textContent = `${m.model_id} (${m.model_type})`;
      if (segModel) segModel.appendChild(o);
    });
  }).catch(() => {});
  if (btnLoad) {
    btnLoad.addEventListener('click', async () => {
      const modelId = segModel?.value;
      const vintage = segVintage?.value;
      if (!modelId || !vintage) return;
      wrap.classList.add('hidden');
      errorEl.classList.add('hidden');
      loading.classList.remove('hidden');
      try {
        const data = await getSegmentMetrics(modelId, vintage);
        tbody.innerHTML = (data.segments || []).map(s => {
          const m = s.metrics || {};
          return `<tr>
            <td>${s.label || s.segment}</td>
            <td class="num">${m.KS != null ? Number(m.KS).toFixed(4) : '–'}</td>
            <td class="num">${m.PSI != null ? Number(m.PSI).toFixed(4) : '–'}</td>
            <td class="num">${m.AUC != null ? Number(m.AUC).toFixed(4) : '–'}</td>
            <td class="num">${s.volume != null ? Number(s.volume).toLocaleString() : '–'}</td>
            <td class="num">${m.bad_rate != null ? Number(m.bad_rate).toFixed(4) : '–'}</td>
          </tr>`;
        }).join('');
        loading.classList.add('hidden');
        wrap.classList.remove('hidden');
      } catch (e) {
        loading.classList.add('hidden');
        errorEl.textContent = e.message || 'Failed to load. Only available for Acquisition Scorecard models.';
        errorEl.classList.remove('hidden');
        wrap.classList.add('hidden');
      }
    });
  }
}

function initKsPsiAnalysis(opts) {
  const analysisModel = document.getElementById('analysis-model');
  const analysisVintage = document.getElementById('analysis-vintage');
  const btnLoad = document.getElementById('btn-load-analysis');
  if (!opts) return;
  (opts.vintages || []).forEach(v => {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = v;
    if (analysisVintage) analysisVintage.appendChild(o);
  });
  getModels().then(({ models }) => {
    (models || []).forEach(m => {
      const o = document.createElement('option');
      o.value = m.model_id;
      o.textContent = `${m.model_id} (${m.model_type})`;
      if (analysisModel) analysisModel.appendChild(o);
    });
  }).catch(() => {});
  if (btnLoad) btnLoad.addEventListener('click', loadKsPsiAnalysis);
}

function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      tabs.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      panels.forEach(p => {
        const isDashboard = p.id === 'dashboard-panel';
        const match = (tab === 'dashboard' && isDashboard) || (tab === 'analysis' && p.id === 'analysis-panel');
        p.classList.toggle('active', match);
        p.hidden = !match;
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    });
  });
  document.getElementById('analysis-panel').hidden = true;
}

function initVariableStability(opts) {
  const stabModel = document.getElementById('stab-model');
  const stabVintage = document.getElementById('stab-vintage');
  const btnLoad = document.getElementById('btn-load-stability');
  const loading = document.getElementById('stability-loading');
  const wrap = document.getElementById('stability-table-wrap');
  const tbody = document.getElementById('stability-tbody');
  if (!opts) return;
  (opts.vintages || []).forEach(v => {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = v;
    if (stabVintage) stabVintage.appendChild(o);
  });
  getModels().then(({ models }) => {
    (models || []).forEach(m => {
      const o = document.createElement('option');
      o.value = m.model_id;
      o.textContent = `${m.model_id} (${m.model_type})`;
      if (stabModel) stabModel.appendChild(o);
    });
  }).catch(() => {});
  if (btnLoad) {
    btnLoad.addEventListener('click', async () => {
      const modelId = stabModel?.value;
      const vintage = stabVintage?.value;
      if (!modelId || !vintage) {
        if (loading) { loading.textContent = 'Please select both Model and Vintage.'; loading.classList.remove('hidden'); setTimeout(() => loading.classList.add('hidden'), 2000); }
        return;
      }
      if (!wrap || !tbody || !loading) return;
      wrap.classList.add('hidden');
      loading.textContent = 'Loading…';
      loading.classList.remove('hidden');
      try {
        const data = await getVariableStability(modelId, vintage);
        const vars = data && data.variables ? data.variables : [];
        tbody.innerHTML = vars.map(item => `
          <tr><td>${item.variable || ''}</td><td class="num">${item.psi != null ? Number(item.psi).toFixed(4) : '–'}</td><td><span class="badge status-${item.status || 'amber'}">${item.status || '–'}</span></td></tr>
        `).join('');
        loading.classList.add('hidden');
        wrap.classList.remove('hidden');
      } catch (e) {
        loading.textContent = 'Failed to load: ' + (e.message || 'Check console.');
        loading.classList.remove('hidden');
      }
    });
  }
}

function destroyAnalysisCharts() {
  if (analysisChartKS) { analysisChartKS.destroy(); analysisChartKS = null; }
  if (analysisChartPSI) { analysisChartPSI.destroy(); analysisChartPSI = null; }
  if (analysisChartVolume) { analysisChartVolume.destroy(); analysisChartVolume = null; }
}

async function loadKsPsiAnalysis() {
  const modelId = document.getElementById('analysis-model')?.value;
  const vintage = document.getElementById('analysis-vintage')?.value;
  const segment = document.getElementById('analysis-segment')?.value || undefined;
  const loading = document.getElementById('analysis-loading');
  const content = document.getElementById('analysis-content');
  const ksTrigger = document.getElementById('analysis-ks-trigger');
  const decileWrap = document.getElementById('analysis-decile-table-wrap');
  const decileCommentary = document.getElementById('analysis-decile-commentary');
  const psiTrigger = document.getElementById('analysis-psi-trigger');
  const variableWrap = document.getElementById('analysis-variable-table-wrap');
  const trendsInsightsEl = document.getElementById('analysis-trends-insights');
  if (!modelId || !vintage) return;
  if (loading) loading.classList.remove('hidden');
  if (content) content.classList.add('hidden');
  try {
    const [trendData, detailData, stabilityData] = await Promise.all([
      getTrends(modelId, segment),
      getDetail(modelId, vintage, segment),
      getVariableStability(modelId, vintage),
    ]);
    destroyAnalysisCharts();
    const labels = trendData.vintages || [];
    const commonOpts = { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { x: { title: { display: true, text: 'Vintage' } }, y: { beginAtZero: true } } };
    const volEl = document.getElementById('analysis-chart-volume');
    const ksEl = document.getElementById('analysis-chart-ks');
    const psiEl = document.getElementById('analysis-chart-psi');
    if (volEl && trendData.volume) {
      analysisChartVolume = new Chart(volEl, { type: 'bar', data: { labels, datasets: [{ label: 'Volume', data: trendData.volume, backgroundColor: 'rgba(30, 58, 95, 0.7)', borderColor: '#1e3a5f', borderWidth: 1 }] }, options: { ...commonOpts, scales: { ...commonOpts.scales, y: { ...commonOpts.scales.y, title: { display: true, text: 'Volume' } } } } });
    }
    if (ksEl && trendData.ks) {
      analysisChartKS = new Chart(ksEl, { type: 'line', data: { labels, datasets: [{ label: 'KS', data: (trendData.ks || []).map(v => v == null ? 0 : v), borderColor: '#1e3a5f', backgroundColor: 'rgba(30, 58, 95, 0.1)', fill: true, tension: 0.2 }] }, options: { ...commonOpts, scales: { ...commonOpts.scales, y: { ...commonOpts.scales.y, max: 1, title: { display: true, text: 'KS' } } } } });
    }
    if (psiEl && trendData.psi) {
      analysisChartPSI = new Chart(psiEl, { type: 'line', data: { labels, datasets: [{ label: 'PSI', data: (trendData.psi || []).map(v => v == null ? 0 : v), borderColor: '#2d5a87', backgroundColor: 'rgba(45, 90, 135, 0.1)', fill: true, tension: 0.2 }] }, options: { ...commonOpts, scales: { ...commonOpts.scales, y: { ...commonOpts.scales.y, title: { display: true, text: 'PSI' } } } } });
    }
    if (trendsInsightsEl && trendData.commentary) {
      const c = trendData.commentary;
      trendsInsightsEl.innerHTML = [c.volume_commentary, c.ks_commentary, c.psi_commentary].filter(Boolean).map(t => `<p>${t}</p>`).join('');
      trendsInsightsEl.classList.remove('hidden');
    } else if (trendsInsightsEl) trendsInsightsEl.innerHTML = '';
    if (ksTrigger) ksTrigger.innerHTML = detailData.ks_trigger_insight ? `<p>${detailData.ks_trigger_insight}</p>` : '';
    if (decileWrap) {
      if (detailData.deciles && detailData.deciles.length) {
        decileWrap.innerHTML = `<table class="data-table"><thead><tr><th>Decile</th><th>Count</th><th>Bad count</th><th>Bad rate</th></tr></thead><tbody>${
          detailData.deciles.map(d => `<tr><td class="num">${d.decile}</td><td class="num">${d.count}</td><td class="num">${d.bad_count}</td><td class="num">${(d.bad_rate * 100).toFixed(2)}%</td></tr>`).join('')
        }</tbody></table>`;
      } else {
        decileWrap.innerHTML = '<p>No decile data for this model/vintage.</p>';
      }
    }
    if (decileCommentary) decileCommentary.innerHTML = detailData.decile_commentary ? `<p><strong>Insight:</strong> ${detailData.decile_commentary}</p>` : '';
    if (psiTrigger) psiTrigger.innerHTML = stabilityData.psi_trigger_insight ? `<p>${stabilityData.psi_trigger_insight}</p>` : '';
    if (variableWrap) {
      variableWrap.innerHTML = (stabilityData.variables || []).length
        ? `<table class="data-table"><thead><tr><th>Variable</th><th>PSI</th><th>Status</th></tr></thead><tbody>${
          stabilityData.variables.map(v => `<tr><td>${v.variable}</td><td class="num">${Number(v.psi).toFixed(4)}</td><td><span class="badge status-${v.status}">${v.status}</span></td></tr>`).join('')
        }</tbody></table>`
        : '<p>No variable stability data.</p>';
    }
  } catch (e) {
    if (ksTrigger) ksTrigger.innerHTML = `<p class="error">Failed to load analysis: ${e.message || e}.</p>`;
    if (decileWrap) decileWrap.innerHTML = '';
    if (decileCommentary) decileCommentary.innerHTML = '';
    if (psiTrigger) psiTrigger.innerHTML = '';
    if (variableWrap) variableWrap.innerHTML = '';
  }
  if (loading) loading.classList.add('hidden');
  if (content) content.classList.remove('hidden');
}

function loadTrends(modelIdOverride, segmentOverride) {
  const modelId = modelIdOverride != null ? modelIdOverride : (trendModelSelect && trendModelSelect.value);
  if (!modelId) return;
  if (trendModelSelect && modelIdOverride != null) trendModelSelect.value = modelId;
  trendsCharts.classList.add('hidden');
  trendsLoading.classList.remove('hidden');
  getTrends(modelId, segmentOverride).then(data => {
    trendsLoading.classList.add('hidden');
    destroyCharts();
    renderTrendCharts(data);
    trendsCharts.classList.remove('hidden');
  }).catch(() => {
    trendsLoading.textContent = 'Failed to load trends.';
    trendsLoading.classList.remove('hidden');
  });
}

function renderTrendCharts(data) {
  let labels = data.vintages || [];
  let ksValues = (data.ks || []).map(v => v == null ? 0 : v);
  let psiValues = (data.psi || []).map(v => v == null ? 0 : v);
  let volumeValues = data.volume || [];
  let badRateValues = (data.bad_rate || []).map(v => v == null ? 0 : v);
  const selectedVintage = filterVintage?.value;
  if (selectedVintage && labels.length) {
    const idx = labels.indexOf(selectedVintage);
    if (idx >= 0) {
      const end = idx + 1;
      labels = labels.slice(0, end);
      ksValues = ksValues.slice(0, end);
      psiValues = psiValues.slice(0, end);
      volumeValues = volumeValues.slice(0, end);
      badRateValues = badRateValues.slice(0, end);
    }
  }

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { title: { display: true, text: 'Vintage' } },
      y: { beginAtZero: true }
    }
  };

  chartKS = new Chart(document.getElementById('chart-ks'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'KS',
        data: ksValues,
        borderColor: '#1e3a5f',
        backgroundColor: 'rgba(30, 58, 95, 0.1)',
        fill: true,
        tension: 0.2
      }]
    },
    options: {
      ...commonOptions,
      scales: {
        ...commonOptions.scales,
        y: { ...commonOptions.scales.y, max: 1, title: { display: true, text: 'KS' } }
      }
    }
  });

  chartPSI = new Chart(document.getElementById('chart-psi'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'PSI',
        data: psiValues,
        borderColor: '#2d5a87',
        backgroundColor: 'rgba(45, 90, 135, 0.1)',
        fill: true,
        tension: 0.2
      }]
    },
    options: {
      ...commonOptions,
      scales: {
        ...commonOptions.scales,
        y: { ...commonOptions.scales.y, title: { display: true, text: 'PSI' } }
      }
    }
  });

  chartBadRate = new Chart(document.getElementById('chart-bad-rate'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Bad rate',
        data: badRateValues,
        borderColor: '#c62828',
        backgroundColor: 'rgba(198, 40, 40, 0.1)',
        fill: true,
        tension: 0.2
      }]
    },
    options: {
      ...commonOptions,
      scales: {
        ...commonOptions.scales,
        y: { ...commonOptions.scales.y, max: 1, title: { display: true, text: 'Bad rate' } }
      }
    }
  });

  chartVolume = new Chart(document.getElementById('chart-volume'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Volume',
        data: volumeValues,
        backgroundColor: 'rgba(30, 58, 95, 0.7)',
        borderColor: '#1e3a5f',
        borderWidth: 1
      }]
    },
    options: {
      ...commonOptions,
      scales: {
        ...commonOptions.scales,
        y: { ...commonOptions.scales.y, title: { display: true, text: 'Volume (count)' } }
      }
    }
  });

  const insightsWrap = document.getElementById('trends-insights');
  const insightsContent = document.getElementById('trends-insights-content');
  if (insightsWrap && insightsContent && data.commentary) {
    const c = data.commentary;
    insightsContent.innerHTML = [
      c.volume_commentary ? `<p><strong>Volume:</strong> ${c.volume_commentary}</p>` : '',
      c.ks_commentary ? `<p><strong>KS:</strong> ${c.ks_commentary}</p>` : '',
      c.psi_commentary ? `<p><strong>PSI:</strong> ${c.psi_commentary}</p>` : '',
      c.bad_rate_commentary ? `<p><strong>Bad rate:</strong> ${c.bad_rate_commentary}</p>` : ''
    ].filter(Boolean).join('');
    insightsWrap.classList.remove('hidden');
  } else if (insightsWrap) {
    insightsWrap.classList.add('hidden');
  }
}

init();
