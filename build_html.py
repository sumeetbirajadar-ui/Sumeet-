#!/usr/bin/env python3
"""build_html.py — generates kcet_college_predictor.html with Engineering +
Agriculture & Farm Science + Veterinary & Professional data."""

import json, os

# ── Load data ─────────────────────────────────────────────────────────────────
with open('/home/user/Sumeet-/kcet_data.json', 'r') as f:
    engg_raw = json.load(f)

with open('/home/user/Sumeet-/agri_data.json', 'r') as f:
    other_raw = json.load(f)

agri_raw = other_raw['agriculture']
prof_raw = other_raw['professional']

ROUNDS = ['2022_R1','2022_R2','2022_EXT','2023_R1','2023_R2','2023_EXT','2024_R1','2024_R2','2024_EXT']
CATS = ['1G','1K','1R','2AG','2AK','2AR','2BG','2BK','2BR',
        '3AG','3AK','3AR','3BG','3BK','3BR','GM','GMK','GMR',
        'SCG','SCK','SCR','STG','STK','STR']

# ── Build Engineering JS data ─────────────────────────────────────────────────
engg_js = {}
for code, college in engg_raw.items():
    bouts = {}
    for branch, rounds_data in college.get('branches', {}).items():
        cats_out = {}
        for cat in CATS:
            arr = []
            has_any = False
            for rnd in ROUNDS:
                val = rounds_data.get(rnd, {})
                v = val.get(cat) if isinstance(val, dict) else None
                if v is not None:
                    has_any = True
                arr.append(v if v is not None else 0)
            if has_any:
                cats_out[cat] = arr
        if cats_out:
            bouts[branch] = cats_out
    if bouts:
        engg_js[code] = {'n': college['name'], 'l': college.get('location',''), 'b': bouts}

# ── Build Agriculture JS data ─────────────────────────────────────────────────
# Format: { code: { n, l, b: { bcode: { n: name, r1: {cat:val}, r2: {cat:val} } } } }
agri_js = {}
for code, college in agri_raw.items():
    bouts = {}
    for bcode, bdata in college.get('branches', {}).items():
        routs = {}
        for rnd_key, round_data in bdata.get('rounds', {}).items():
            cats_out = {}
            for cat in CATS:
                v = round_data.get(cat)
                if v is not None:
                    cats_out[cat] = v
            if cats_out:
                routs[rnd_key] = cats_out
        if routs:
            bouts[bcode] = {'n': bdata['name'], 'r': routs}
    if bouts:
        agri_js[code] = {'n': college['name'], 'l': college.get('location',''), 'b': bouts}

# ── Build Professional/Vet JS data ────────────────────────────────────────────
# Format: { code: { n, l, b: { bcode: { n: name, d: {cat:val} } } } }
prof_js = {}
for code, college in prof_raw.items():
    bouts = {}
    for bcode, bdata in college.get('branches', {}).items():
        cats_out = {}
        for cat in CATS:
            v = bdata.get('data', {}).get(cat)
            if v is not None:
                cats_out[cat] = v
        if cats_out:
            bouts[bcode] = {'n': bdata['name'], 'd': cats_out}
    if bouts:
        prof_js[code] = {'n': college['name'], 'l': college.get('location',''), 'b': bouts}

engg_js_str = json.dumps(engg_js, separators=(',',':'), ensure_ascii=False)
agri_js_str = json.dumps(agri_js, separators=(',',':'), ensure_ascii=False)
prof_js_str = json.dumps(prof_js, separators=(',',':'), ensure_ascii=False)

# ── Engineering branch list ────────────────────────────────────────────────────
BRANCH_NAMES = {
    'AD':'Aeronautical Engineering','AE':'Agricultural Engineering',
    'AI':'Artificial Intelligence & ML','AM':'Aerospace Manufacturing',
    'AR':'Architecture','AT':'Automation & Robotics','AU':'Automobile Engineering',
    'BT':'Biotechnology Engineering','CA':'Computer Applications',
    'CB':'Cloud Computing & Big Data','CD':'Computer Science (Data Science)',
    'CE':'Civil Engineering','CF':'CS (AI & Forensics)','CH':'Chemical Engineering',
    'CI':'CS (IoT)','CK':'CS (Blockchain)','CL':'CS (Full Stack)',
    'CM':'CS (Machine Learning)','CN':'Construction Engineering',
    'CS':'Computer Science Engineering','CT':'CS & Technology',
    'CU':'CS (UI/UX)','CW':'CS Engineering (AI)','CX':'Cyber Security',
    'CY':'CS (Cyber Security)','CZ':'CS (Cloud Computing)',
    'DA':'Data Analytics','DB':'Data Science','DS':'Data Science Engineering',
    'EC':'Electronics & Communication Engg','EE':'Electrical & Electronics Engg',
    'EI':'Electronics & Instrumentation Engg','ET':'Electronics & Telecom Engg',
    'EV':'Electric Vehicle Technology','IC':'Information Science Engineering',
    'IE':'Industrial Engineering & Management','IM':'Industrial Management',
    'IO':'Internet of Things (IoT)','IP':'Industrial Production Engineering',
    'MA':'Mechatronics','MC':'Mechanical (Core)','MD':'Mechatronics & Design',
    'ME':'Mechanical Engineering','MI':'Mining Engineering','MN':'Mineral Engineering',
    'MT':'Mechatronics','PL':'Polymer Technology','PT':'Petroleum Technology',
    'RA':'Robotics and Automation','RB':'Robotics & AI','RI':'Robotics & Industrial IoT',
    'RO':'Robotics Engineering','SE':'Software Engineering','ST':'Structural Engineering',
    'TC':'Textile Chemistry','TX':'Textile Engineering',
}

all_engg_branches = set()
for c in engg_raw.values():
    for b in c.get('branches', {}):
        all_engg_branches.add(b)

priority = ['CS','EC','ME','CE','EE','IE','AI','CA','DS','IC','AD','AE','AR','AU','BT',
            'CH','CY','CD','CB','CW','DB','ET','EI','IO','MT','RA','SE','RO']
engg_branch_list = []
for b in priority:
    if b in all_engg_branches:
        engg_branch_list.append(b)
for b in sorted(all_engg_branches):
    if b not in engg_branch_list:
        engg_branch_list.append(b)

engg_branch_opts = ''
for b in engg_branch_list:
    label = BRANCH_NAMES.get(b, b)
    engg_branch_opts += f'<option value="{b}">{b} - {label}</option>\n'

# ── Agriculture course list ────────────────────────────────────────────────────
AGRI_COURSE_NAMES = {
    'AG':  'B.Sc.(Hons) Agriculture',
    'AM':  'B.Sc.(Hons) Ag. Business Mng.',
    'AB':  'B.Tech (Biotechnology)',
    'DT':  'B.Tech (Dairy Technology)',
    'FH':  'B.Fisheries Science',
    'FT':  'B.Tech (Food Technology)',
    'HT':  'B.Sc.(Hons) Horticulture',
    'ND':  'B.Sc.(Hons) Nutrition & Dietetics',
    'FND': 'B.Sc.(Hons) Food Nutrition & Dietetics',
    'SR':  'B.Sc.(Hons) Sericulture',
    'FR':  'B.Sc.(Hons) Forestry',
    'HS':  'B.Sc.(Hons) Community Science',
    'EA':  'B.Tech (Agricultural Engineering)',
    'VS':  'B.V.Sc and A.H',
}

all_agri_branches = set()
for c in agri_raw.values():
    for b in c.get('branches', {}):
        all_agri_branches.add(b)

agri_branch_opts = ''
for b in sorted(all_agri_branches):
    label = AGRI_COURSE_NAMES.get(b, b)
    agri_branch_opts += f'<option value="{b}">{label}</option>\n'

# ── Professional course list ───────────────────────────────────────────────────
all_prof_branches = set()
for c in prof_raw.values():
    for b in c.get('branches', {}):
        all_prof_branches.add(b)

PROF_ORDER = ['VS','AG','FND','HT','SR','FR','AB','HS']
prof_branch_opts = ''
for b in PROF_ORDER:
    if b in all_prof_branches:
        label = AGRI_COURSE_NAMES.get(b, b)
        prof_branch_opts += f'<option value="{b}">{label}</option>\n'
for b in sorted(all_prof_branches):
    if b not in PROF_ORDER:
        label = AGRI_COURSE_NAMES.get(b, b)
        prof_branch_opts += f'<option value="{b}">{label}</option>\n'

# ── Category dropdown ─────────────────────────────────────────────────────────
CAT_LABELS = {
    'GM':'GM - General Merit','GMR':'GMR - GM Rural','GMK':'GMK - GM Kannada Medium',
    '1G':'1G - Category I','1K':'1K - Category I (KM)','1R':'1R - Category I (Rural)',
    '2AG':'2AG - OBC 2A','2AK':'2AK - OBC 2A (KM)','2AR':'2AR - OBC 2A (Rural)',
    '2BG':'2BG - OBC 2B','2BK':'2BK - OBC 2B (KM)','2BR':'2BR - OBC 2B (Rural)',
    '3AG':'3AG - OBC 3A','3AK':'3AK - OBC 3A (KM)','3AR':'3AR - OBC 3A (Rural)',
    '3BG':'3BG - OBC 3B','3BK':'3BK - OBC 3B (KM)','3BR':'3BR - OBC 3B (Rural)',
    'SCG':'SCG - Scheduled Caste','SCK':'SCK - SC (KM)','SCR':'SCR - SC (Rural)',
    'STG':'STG - Scheduled Tribe','STK':'STK - ST (KM)','STR':'STR - ST (Rural)',
}
cat_opts = ''
for cat, label in CAT_LABELS.items():
    cat_opts += f'<option value="{cat}">{label}</option>\n'

# ── HTML template ─────────────────────────────────────────────────────────────
HTML = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>KCET 2025 College Predictor</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --grad1:#4f46e5;--grad2:#7c3aed;--grad3:#2563eb;
  --safe:#16a34a;--mod:#d97706;--border:#ef4444;--long:#6b7280;
  --bg:#f8faff;--card:#fff;--text:#1e293b;--muted:#64748b;--border-c:#e2e8f0;
}
body{font-family:'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
header{background:linear-gradient(135deg,var(--grad1),var(--grad2),var(--grad3));color:#fff;padding:2rem 1rem;text-align:center}
.college-header{font-size:clamp(1rem,3vw,1.35rem);font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-bottom:.6rem;padding-bottom:.6rem;border-bottom:2px solid rgba(255,255,255,.35)}
header h1{font-size:clamp(1.4rem,4vw,2.2rem);font-weight:800;letter-spacing:-0.5px}
header p.sub{font-size:.95rem;opacity:.88;margin-top:.4rem}
.attribution{font-size:.9rem;margin-top:.7rem;font-weight:700;letter-spacing:.02em}
.container{max-width:1400px;margin:0 auto;padding:1rem}
.card{background:var(--card);border-radius:14px;box-shadow:0 2px 16px rgba(79,70,229,.08);padding:1.5rem;margin-bottom:1.5rem}
.form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;align-items:end}
label{display:block;font-size:.82rem;font-weight:600;color:var(--muted);margin-bottom:.35rem;text-transform:uppercase;letter-spacing:.05em}
input,select{width:100%;padding:.65rem .85rem;border:2px solid var(--border-c);border-radius:8px;font-size:.95rem;background:#fff;color:var(--text);transition:border-color .2s}
input:focus,select:focus{outline:none;border-color:var(--grad1)}
.btn{padding:.7rem 2rem;background:linear-gradient(135deg,var(--grad1),var(--grad2));color:#fff;border:none;border-radius:8px;font-size:1rem;font-weight:700;cursor:pointer;transition:opacity .2s;white-space:nowrap}
.btn:hover{opacity:.9}
.stats-bar{display:flex;flex-wrap:wrap;gap:.75rem;margin-bottom:1rem;font-size:.85rem;font-weight:600}
.stat-chip{padding:.35rem .9rem;border-radius:20px;color:#fff}
.chip-safe{background:var(--safe)}.chip-mod{background:var(--mod)}.chip-border{background:var(--border)}.chip-long{background:var(--long)}
.table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
table{width:100%;border-collapse:collapse;font-size:.82rem;white-space:nowrap}
thead tr{background:linear-gradient(135deg,var(--grad1),var(--grad2));color:#fff}
thead th{padding:.65rem .75rem;text-align:center;font-weight:700;font-size:.78rem;letter-spacing:.03em;position:sticky;top:0}
thead th.col-name{text-align:left;min-width:220px}
thead th.col-loc{text-align:left;min-width:120px}
thead th.col-pred{min-width:110px}
tbody tr:nth-child(even){background:#f8faff}
tbody tr:hover{background:#eef2ff}
td{padding:.55rem .75rem;text-align:center;border-bottom:1px solid var(--border-c)}
td.col-name{text-align:left;font-weight:600;color:var(--text)}
td.col-loc{text-align:left;color:var(--muted);font-size:.78rem}
.cell-green{background:#dcfce7;color:#166534;border-radius:4px;padding:.2rem .5rem;font-weight:700}
.cell-yellow{background:#fef9c3;color:#854d0e;border-radius:4px;padding:.2rem .5rem;font-weight:700}
.cell-red{background:#fee2e2;color:#991b1b;border-radius:4px;padding:.2rem .5rem;font-weight:700}
.cell-grey{background:#f1f5f9;color:#94a3b8;border-radius:4px;padding:.2rem .5rem}
.cell-na{color:#cbd5e1;font-size:.75rem}
.badge{display:inline-block;padding:.25rem .75rem;border-radius:20px;font-size:.75rem;font-weight:700;color:#fff}
.badge-safe{background:var(--safe)}.badge-mod{background:var(--mod)}.badge-border{background:var(--border)}.badge-long{background:var(--long)}
.est-2025{background:linear-gradient(135deg,#dbeafe,#ede9fe);color:#1e40af;font-weight:800;border-radius:4px;padding:.2rem .5rem}
.mock-2025{background:linear-gradient(135deg,#d1fae5,#a7f3d0);color:#065f46;font-weight:800;border-radius:4px;padding:.2rem .5rem}
.empty-msg{text-align:center;padding:3rem 1rem;color:var(--muted);font-size:1rem}
.legend{display:flex;flex-wrap:wrap;gap:.75rem;font-size:.78rem;margin-bottom:1rem}
.legend-item{display:flex;align-items:center;gap:.4rem}
.legend-dot{width:14px;height:14px;border-radius:3px}
.disclaimer{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:1rem 1.2rem;font-size:.8rem;color:#78350f;margin-top:1.5rem}
.disclaimer strong{color:#92400e}
footer{text-align:center;padding:2rem 1rem;color:var(--muted);font-size:.82rem;border-top:1px solid var(--border-c);margin-top:2rem}
footer .attr{font-weight:700;color:var(--text)}
.type-tabs{display:flex;gap:.5rem;margin-bottom:1rem;flex-wrap:wrap}
.tab-btn{padding:.5rem 1.2rem;border:2px solid var(--border-c);border-radius:8px;background:#fff;cursor:pointer;font-size:.9rem;font-weight:600;color:var(--muted);transition:.2s}
.tab-btn.active{border-color:var(--grad1);background:var(--grad1);color:#fff}
.info-badge{display:inline-block;padding:.15rem .55rem;border-radius:10px;font-size:.72rem;font-weight:700;margin-left:.4rem;background:#e0e7ff;color:#3730a3}
@media(max-width:600px){header{padding:1.2rem .75rem}.card{padding:1rem}.btn{width:100%}}
</style>
</head>
<body>

<header>
  <div class="college-header">SHRI SHARANABASAVESHWAR PU SCIENCE COLLEGE VIJAYAPURA</div>
  <h1>&#127891; KCET 2025 College Predictor</h1>
  <p class="sub">Engineering &bull; Agriculture &amp; Farm Science &bull; Veterinary &bull; Professional Courses</p>
  <div class="attribution">Created by <strong>Sumeet Birajadar</strong></div>
</header>

<div class="container">

  <!-- Course Type Selector -->
  <div class="card" style="padding:1rem 1.5rem">
    <label style="margin-bottom:.6rem">Select Course Type</label>
    <div class="type-tabs">
      <button class="tab-btn active" onclick="switchType('engg',this)">
        &#128187; Engineering<span class="info-badge">__ENGG_COUNT__ colleges</span>
      </button>
      <button class="tab-btn" onclick="switchType('agri',this)">
        &#127807; Agriculture &amp; Farm Science<span class="info-badge">__AGRI_COUNT__ colleges</span>
      </button>
      <button class="tab-btn" onclick="switchType('prof',this)">
        &#128009; Veterinary &amp; Professional<span class="info-badge">__PROF_COUNT__ colleges · 2025 Mock</span>
      </button>
    </div>
  </div>

  <!-- Input Card -->
  <div class="card">
    <div class="form-grid">
      <div>
        <label for="rank">Your KCET Rank</label>
        <input type="number" id="rank" placeholder="e.g. 5000" min="1" max="200000"/>
      </div>
      <div>
        <label for="branch" id="branch-label">Branch / Programme</label>
        <select id="branch">
          <option value="">-- Select Branch --</option>
          __ENGG_BRANCH_OPTS__
        </select>
      </div>
      <div>
        <label for="category">Reservation Category</label>
        <select id="category">
          __CAT_OPTS__
        </select>
      </div>
      <div>
        <button class="btn" onclick="predict()">&#128269; Predict Colleges</button>
      </div>
    </div>
  </div>

  <!-- Legend -->
  <div class="legend">
    <div class="legend-item"><div class="legend-dot" style="background:#dcfce7;border:1px solid #86efac"></div><span><strong>Green</strong> &#8211; Safe (rank &lt; 80% of cutoff)</span></div>
    <div class="legend-item"><div class="legend-dot" style="background:#fef9c3;border:1px solid #fcd34d"></div><span><strong>Yellow</strong> &#8211; Moderate (rank &lt; 95%)</span></div>
    <div class="legend-item"><div class="legend-dot" style="background:#fee2e2;border:1px solid #fca5a5"></div><span><strong>Red</strong> &#8211; Borderline (rank &lt; 120%)</span></div>
    <div class="legend-item"><div class="legend-dot" style="background:#f1f5f9;border:1px solid #cbd5e1"></div><span><strong>Grey</strong> &#8211; Long Shot</span></div>
  </div>

  <div id="results"></div>

  <div class="disclaimer">
    <strong>&#9888; Disclaimer:</strong> Engineering data: official KEA cutoffs 2022&#8211;2024 (9 rounds).
    Agriculture data: KEA 2024 rounds 1 &amp; 2. Veterinary &amp; Professional: UGCET-2025 mock allotment data.
    The &#8220;Est. 2025&#8221; is a weighted projection and is for reference only.
    Always verify with the official <strong>KEA Karnataka</strong> website before making decisions.
  </div>

</div>

<footer>
  <div class="attr">SHRI SHARANABASAVESHWAR PU SCIENCE COLLEGE VIJAYAPURA</div>
  <div>Created by <strong>Sumeet Birajadar</strong></div>
  <div style="margin-top:.4rem;color:#94a3b8">KCET 2025 College Predictor &bull; Data: Official KEA PDFs 2022&#8211;2024</div>
</footer>

<script>
const ENGG = __ENGG_DATA__;
const AGRI = __AGRI_DATA__;
const PROF = __PROF_DATA__;

const ENGG_ROUNDS = ['2022 R1','2022 R2','2022 Final','2023 R1','2023 R2','2023 Final','2024 R1','2024 R2','2024 Final'];
const AGRI_ROUNDS = ['2024 R1','2024 R2'];
const AGRI_ROUND_KEYS = ['2024_R1','2024_R2'];
const FINAL_IDX = [2,5,8]; // EXT rounds in engineering array

const ENGG_BRANCH_OPTS = `__ENGG_BRANCH_OPTS_JS__`;
const AGRI_BRANCH_OPTS = `__AGRI_BRANCH_OPTS_JS__`;
const PROF_BRANCH_OPTS = `__PROF_BRANCH_OPTS_JS__`;

let currentType = 'engg';

function switchType(type, btn) {
  currentType = type;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const sel = document.getElementById('branch');
  const opts = type === 'engg' ? ENGG_BRANCH_OPTS : type === 'agri' ? AGRI_BRANCH_OPTS : PROF_BRANCH_OPTS;
  sel.innerHTML = '<option value="">-- Select Course --</option>' + opts;
  document.getElementById('branch-label').textContent = type === 'engg' ? 'Branch / Programme' : 'Course';
  const rankLbl = document.querySelector('label[for="rank"]');
  if (type === 'prof') {
    rankLbl.textContent = 'Your UGCET Rank';
    document.getElementById('rank').placeholder = 'e.g. 2000';
  } else {
    rankLbl.textContent = 'Your KCET Rank';
    document.getElementById('rank').placeholder = 'e.g. 5000';
  }
  document.getElementById('results').innerHTML = '';
}

function weightedEst(arr) {
  const weights = [1,2,3];
  let wsum = 0, total = 0;
  FINAL_IDX.forEach((idx,i) => {
    const v = arr[idx];
    if (v && v > 0) { wsum += v * weights[i]; total += weights[i]; }
  });
  return total > 0 ? Math.round(wsum/total) : 0;
}

function getPrediction(rank, refVal) {
  if (!refVal || refVal <= 0) return 'unknown';
  if (rank < refVal * 0.80) return 'safe';
  if (rank < refVal * 0.95) return 'moderate';
  if (rank < refVal * 1.20) return 'borderline';
  return 'longshot';
}

function fmtCutoff(rank, cutoff) {
  if (!cutoff || cutoff === 0) return '<span class="cell-na">&#8212;</span>';
  const cls = rank < cutoff*0.80 ? 'green' : rank < cutoff*0.95 ? 'yellow' : rank < cutoff*1.20 ? 'red' : 'grey';
  return '<span class="cell-' + cls + '">' + cutoff.toLocaleString() + '</span>';
}

function badgeHtml(pred) {
  const m = {safe:['Safe','badge-safe'],moderate:['Moderate','badge-mod'],borderline:['Borderline','badge-border'],longshot:['Long Shot','badge-long'],unknown:['No Data','badge-long']};
  const [l,c] = m[pred]||m.unknown;
  return '<span class="badge ' + c + '">' + l + '</span>';
}

function predict() {
  const rank = parseFloat(document.getElementById('rank').value);
  const branch = document.getElementById('branch').value;
  const cat = document.getElementById('category').value;
  if (!rank || rank < 1) { alert('Please enter a valid rank.'); return; }
  if (!branch) { alert('Please select a course.'); return; }
  if (!cat) { alert('Please select a category.'); return; }

  if (currentType === 'engg') predictEngg(rank, branch, cat);
  else if (currentType === 'agri') predictAgri(rank, branch, cat);
  else predictProf(rank, branch, cat);
}

function predictEngg(rank, branch, cat) {
  const rows = [];
  for (const [code, col] of Object.entries(ENGG)) {
    const bData = col.b[branch];
    if (!bData) continue;
    const arr = bData[cat];
    if (!arr) continue;
    const finals = FINAL_IDX.map(i => arr[i]).filter(v => v > 0);
    const avgFinal = finals.length > 0 ? finals.reduce((a,b)=>a+b,0)/finals.length : Infinity;
    const pred = getPrediction(rank, avgFinal === Infinity ? 0 : avgFinal);
    rows.push({ code, name: col.n, loc: col.l, arr, pred, est: weightedEst(arr), avgFinal });
  }
  if (!rows.length) { showEmpty(branch,cat); return; }
  const ORDER = {safe:0,moderate:1,borderline:2,longshot:3,unknown:4};
  rows.sort((a,b) => (ORDER[a.pred]-ORDER[b.pred]) || (a.avgFinal-b.avgFinal));
  const counts = countPreds(rows);
  let html = buildStatsBar(rows.length, counts);
  html += '<div class="table-wrap"><table><thead><tr>';
  html += '<th class="col-name"># College</th><th class="col-loc">Location</th><th class="col-pred">Prediction</th>';
  ENGG_ROUNDS.forEach(l => { html += '<th>' + l + '</th>'; });
  html += '<th>Est.&nbsp;2025</th></tr></thead><tbody>';
  rows.forEach((r,i) => {
    html += '<tr><td class="col-name">' + (i+1) + '.&nbsp;' + r.name + '</td>';
    html += '<td class="col-loc">' + (r.loc||'&#8212;') + '</td>';
    html += '<td>' + badgeHtml(r.pred) + '</td>';
    r.arr.forEach(v => { html += '<td>' + fmtCutoff(rank,v) + '</td>'; });
    html += '<td>' + (r.est > 0 ? '<span class="est-2025">~'+r.est.toLocaleString()+'</span>' : '<span class="cell-na">&#8212;</span>') + '</td>';
    html += '</tr>';
  });
  html += '</tbody></table></div></div>';
  showResults(html);
}

function predictAgri(rank, branch, cat) {
  const rows = [];
  for (const [code, col] of Object.entries(AGRI)) {
    const bData = col.b[branch];
    if (!bData) continue;
    const vals = {};
    AGRI_ROUND_KEYS.forEach(rk => { vals[rk] = bData.r && bData.r[rk] ? bData.r[rk][cat] : null; });
    const r2 = vals['2024_R2'] || vals['2024_R1'];
    if (!r2 && !vals['2024_R1']) continue;
    const refVal = r2 || vals['2024_R1'] || 0;
    const pred = getPrediction(rank, refVal);
    rows.push({ code, name: col.n, loc: col.l, vals, pred, refVal });
  }
  if (!rows.length) { showEmpty(branch,cat); return; }
  const ORDER = {safe:0,moderate:1,borderline:2,longshot:3,unknown:4};
  rows.sort((a,b) => (ORDER[a.pred]-ORDER[b.pred]) || (a.refVal-b.refVal));
  const counts = countPreds(rows);
  let html = buildStatsBar(rows.length, counts);
  html += '<div class="table-wrap"><table><thead><tr>';
  html += '<th class="col-name"># College</th><th class="col-loc">Location</th><th class="col-pred">Prediction</th>';
  AGRI_ROUNDS.forEach(l => { html += '<th>' + l + '</th>'; });
  html += '<th>Est.&nbsp;2025</th></tr></thead><tbody>';
  rows.forEach((r,i) => {
    html += '<tr><td class="col-name">' + (i+1) + '.&nbsp;' + r.name + '</td>';
    html += '<td class="col-loc">' + (r.loc||'&#8212;') + '</td>';
    html += '<td>' + badgeHtml(r.pred) + '</td>';
    AGRI_ROUND_KEYS.forEach(rk => { html += '<td>' + fmtCutoff(rank, r.vals[rk]||0) + '</td>'; });
    const est = r.refVal > 0 ? '<span class="est-2025">~'+Math.round(r.refVal).toLocaleString()+'</span>' : '<span class="cell-na">&#8212;</span>';
    html += '<td>' + est + '</td>';
    html += '</tr>';
  });
  html += '</tbody></table></div></div>';
  showResults(html);
}

function predictProf(rank, branch, cat) {
  const rows = [];
  for (const [code, col] of Object.entries(PROF)) {
    const bData = col.b[branch];
    if (!bData) continue;
    const cutoff = bData.d ? bData.d[cat] : null;
    if (!cutoff) continue;
    const pred = getPrediction(rank, cutoff);
    rows.push({ code, name: col.n, loc: col.l, cutoff, pred });
  }
  if (!rows.length) { showEmpty(branch,cat); return; }
  const ORDER = {safe:0,moderate:1,borderline:2,longshot:3,unknown:4};
  rows.sort((a,b) => (ORDER[a.pred]-ORDER[b.pred]) || (a.cutoff-b.cutoff));
  const counts = countPreds(rows);
  let html = buildStatsBar(rows.length, counts);
  html += '<div class="table-wrap"><table><thead><tr>';
  html += '<th class="col-name"># College</th><th class="col-loc">Location</th><th class="col-pred">Prediction</th>';
  html += '<th>2025 Mock Cutoff</th></tr></thead><tbody>';
  rows.forEach((r,i) => {
    html += '<tr><td class="col-name">' + (i+1) + '.&nbsp;' + r.name + '</td>';
    html += '<td class="col-loc">' + (r.loc||'&#8212;') + '</td>';
    html += '<td>' + badgeHtml(r.pred) + '</td>';
    html += '<td><span class="mock-2025">' + r.cutoff.toLocaleString() + '</span></td>';
    html += '</tr>';
  });
  html += '</tbody></table></div></div>';
  showResults(html);
}

function countPreds(rows) {
  const c = {safe:0,moderate:0,borderline:0,longshot:0,unknown:0};
  rows.forEach(r => c[r.pred]++);
  return c;
}

function buildStatsBar(total, c) {
  let h = '<div class="card"><div class="stats-bar">';
  h += '<span>Showing <strong>' + total + '</strong> colleges &nbsp;</span>';
  if (c.safe)      h += '<span class="stat-chip chip-safe">&#10003; Safe: '+c.safe+'</span>';
  if (c.moderate)  h += '<span class="stat-chip chip-mod">~ Moderate: '+c.moderate+'</span>';
  if (c.borderline)h += '<span class="stat-chip chip-border">! Borderline: '+c.borderline+'</span>';
  if (c.longshot+c.unknown) h += '<span class="stat-chip chip-long">&#10007; Long Shot: '+(c.longshot+c.unknown)+'</span>';
  h += '</div>';
  return h;
}

function showEmpty(branch, cat) {
  document.getElementById('results').innerHTML =
    '<div class="card empty-msg">No data found for <strong>' + branch + '</strong> / <strong>' + cat +
    '</strong>.<br/>Try a different course or category combination.</div>';
}

function showResults(html) {
  document.getElementById('results').innerHTML = html;
  document.getElementById('results').scrollIntoView({behavior:'smooth', block:'start'});
}

document.getElementById('rank').addEventListener('keydown', e => { if(e.key==='Enter') predict(); });
</script>
</body>
</html>'''

# Inject data
engg_count = len(engg_js)
agri_count = len(agri_js)
prof_count = len(prof_js)

HTML = HTML.replace('__ENGG_COUNT__', str(engg_count))
HTML = HTML.replace('__AGRI_COUNT__', str(agri_count))
HTML = HTML.replace('__PROF_COUNT__', str(prof_count))
HTML = HTML.replace('__ENGG_BRANCH_OPTS__', engg_branch_opts)
HTML = HTML.replace('__CAT_OPTS__', cat_opts)
HTML = HTML.replace('__ENGG_DATA__', engg_js_str)
HTML = HTML.replace('__AGRI_DATA__', agri_js_str)
HTML = HTML.replace('__PROF_DATA__', prof_js_str)
# JS template literals for branch options (escape backticks)
HTML = HTML.replace('__ENGG_BRANCH_OPTS_JS__', engg_branch_opts.replace('`','\\`'))
HTML = HTML.replace('__AGRI_BRANCH_OPTS_JS__', agri_branch_opts.replace('`','\\`'))
HTML = HTML.replace('__PROF_BRANCH_OPTS_JS__', prof_branch_opts.replace('`','\\`'))

out_path = '/home/user/Sumeet-/kcet_college_predictor.html'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(HTML)

size_kb = os.path.getsize(out_path) / 1024
print(f'Generated: {out_path}')
print(f'File size: {size_kb:.1f} KB ({size_kb/1024:.2f} MB)')
print(f'Engineering: {engg_count} colleges')
print(f'Agriculture: {agri_count} colleges')
print(f'Professional/Vet: {prof_count} colleges')
