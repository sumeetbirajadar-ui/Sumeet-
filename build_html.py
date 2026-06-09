#!/usr/bin/env python3
"""
build_html.py
Generates kcet_college_predictor.html from kcet_data.json.
"""

import json
import os

# ── Load source data ──────────────────────────────────────────────────────────
with open('/home/user/Sumeet-/kcet_data.json', 'r') as f:
    raw = json.load(f)

ROUNDS = ['2022_R1', '2022_R2', '2022_EXT', '2023_R1', '2023_R2', '2023_EXT', '2024_R1', '2024_R2', '2024_EXT']
CATS   = ['1G','1K','1R','2AG','2AK','2AR','2BG','2BK','2BR',
          '3AG','3AK','3AR','3BG','3BK','3BR','GM','GMK','GMR',
          'SCG','SCK','SCR','STG','STK','STR']

# ── Build compact JS data object ──────────────────────────────────────────────
# Structure: { college_code: { n: name, l: location, b: { branch: { cat: [9 values] } } } }
js_data = {}
for code, college in raw.items():
    branches_out = {}
    for branch, rounds_data in college.get('branches', {}).items():
        cats_out = {}
        for cat in CATS:
            arr = []
            has_any = False
            for rnd in ROUNDS:
                val = rounds_data.get(rnd, {})
                if isinstance(val, dict):
                    v = val.get(cat, None)
                else:
                    v = None
                if v is not None:
                    has_any = True
                arr.append(v if v is not None else 0)
            if has_any:
                cats_out[cat] = arr
        if cats_out:
            branches_out[branch] = cats_out
    if branches_out:
        js_data[code] = {
            'n': college['name'],
            'l': college.get('location', ''),
            'b': branches_out
        }

js_data_str = json.dumps(js_data, separators=(',', ':'), ensure_ascii=False)

# ── Branch name mapping ───────────────────────────────────────────────────────
BRANCH_NAMES = {
    'AD': 'Aeronautical Engineering',
    'AE': 'Agricultural Engineering',
    'AI': 'Artificial Intelligence & ML',
    'AM': 'Aerospace Manufacturing',
    'AR': 'Architecture',
    'AT': 'Automation & Robotics',
    'AU': 'Automobile Engineering',
    'BA': 'Biomedical & Allied Sc',
    'BB': 'Biomedical Engineering',
    'BD': 'Bio-Design',
    'BF': 'Biotechnology & Food Technology',
    'BG': 'Bioinformatics & Genomics',
    'BH': 'Biochemical Engineering',
    'BJ': 'Biotechnology',
    'BK': 'Blockchain Technology',
    'BL': 'Business Analytics',
    'BM': 'Biomedical Engineering',
    'BN': 'Biochem Engineering',
    'BO': 'Business Operations',
    'BP': 'Bioinformatics',
    'BQ': 'Bio-Technology',
    'BR': 'Robotics Engineering',
    'BT': 'Biotechnology Engineering',
    'BU': 'Built Environment',
    'BV': 'Bioinformatics',
    'BW': 'Big Data Analytics',
    'BX': 'Business Excellence',
    'BY': 'Battery Technology',
    'BZ': 'BioTech & Bioinformatics',
    'CA': 'Computer Applications',
    'CB': 'Cloud Computing & Big Data',
    'CC': 'Computer and Communication Engg',
    'CD': 'Computer Science (Data Science)',
    'CE': 'Civil Engineering',
    'CF': 'Computer Science (AI & Forensics)',
    'CG': 'Computer Science (Gaming)',
    'CH': 'Chemical Engineering',
    'CI': 'Computer Science (IoT)',
    'CK': 'Computer Science (Blockchain)',
    'CL': 'Computer Science (Full Stack)',
    'CM': 'Computer Science (ML)',
    'CN': 'Construction Engineering',
    'CO': 'Computer Science (Operations Research)',
    'CQ': 'Computer Science (Quantum Computing)',
    'CR': 'Computer Science (Robotics)',
    'CS': 'Computer Science Engineering',
    'CT': 'Computer Science & Tech',
    'CU': 'Computer Science (UI/UX)',
    'CV': 'Computer Science (VR/AR)',
    'CW': 'Computer Science & Engineering (AI)',
    'CX': 'Cyber Security',
    'CY': 'Computer Science (Cyber Security)',
    'CZ': 'Computer Science (Cloud Computing)',
    'DA': 'Data Analytics',
    'DB': 'Data Science',
    'DC': 'Design Computing',
    'DD': 'Digital Design',
    'DE': 'Defence Technology',
    'DF': 'Data Science & AI',
    'DG': 'Digital Engineering',
    'DH': 'Data Science (Healthcare)',
    'DI': 'Digital Innovation',
    'DJ': 'DevOps Engineering',
    'DK': 'Design & Manufacturing',
    'DM': 'Data Management',
    'DN': 'Drone Technology',
    'DS': 'Data Science Engineering',
    'EA': 'Electronics & Communication (AI)',
    'EB': 'Electronics & Biomed',
    'EC': 'Electronics & Communication Engg',
    'EE': 'Electrical & Electronics Engg',
    'EG': 'Environmental Engineering',
    'EI': 'Electronics & Instrumentation Engg',
    'EL': 'Electrical Engineering',
    'EN': 'Energy Engineering',
    'ER': 'Environmental Science',
    'ES': 'Embedded Systems',
    'ET': 'Electronics & Telecom Engg',
    'EV': 'Electric Vehicle Technology',
    'EZ': 'Electronics (IoT)',
    'IB': 'Industrial Biotechnology',
    'IC': 'Information Science Engineering',
    'IE': 'Industrial Engineering & Management',
    'IG': 'Industrial IoT',
    'II': 'Industrial IoT (AI)',
    'IM': 'Industrial Management',
    'IO': 'Internet of Things (IoT)',
    'IP': 'Industrial Production Engineering',
    'IY': 'Intelligent Automation',
    'IZ': 'Information Technology (AI)',
    'LA': 'Landscape Architecture',
    'LC': 'Life Sciences Computing',
    'LD': 'LNG & Distribution',
    'LE': 'Liberal Engineering',
    'LF': 'Logistics & Supply Chain',
    'LG': 'Lean Manufacturing',
    'LH': 'Leather Technology',
    'LJ': 'LNG Engineering',
    'LK': 'Logistics & Kindle',
    'MC': 'Mechanical (Core)',
    'MD': 'Mechatronics & Design',
    'ME': 'Mechanical Engineering',
    'MI': 'Mining Engineering',
    'MK': 'Medical Knowledge Engineering',
    'MM': 'Manufacturing & Management',
    'MN': 'Mineral Engineering',
    'MR': 'Marine Engineering',
    'MT': 'Mechatronics',
    'OP': 'Optical Engineering',
    'OT': 'Ocean Technology',
    'PL': 'Polymer Technology',
    'PT': 'Petroleum Technology',
    'RA': 'Robotics and Automation',
    'RB': 'Robotics & AI',
    'RI': 'Robotics & Industrial IoT',
    'RM': 'Robotics & Manufacturing',
    'RO': 'Robotics Engineering',
    'SA': 'Space Applications',
    'SE': 'Software Engineering',
    'SS': 'Space Science',
    'ST': 'Structural Engineering',
    'TC': 'Textile Chemistry',
    'TI': 'Textile & Infrastructure',
    'TX': 'Textile Engineering',
    'UP': 'Urban Planning',
    'UR': 'Urban & Regional Planning',
    'YA': 'Yoga & Allied Sciences',
    'YC': 'Yoga & Counselling',
    'YE': 'Yoga Education',
    'YF': 'Yoga & Fitness',
    'YH': 'Yoga & Healthcare',
    'YI': 'Yoga & Integrative Medicine',
    'ZA': 'Agricultural Engineering (ADV)',
    'ZC': 'Computer Science & Design',
    'ZH': 'Hybrid Vehicle Technology',
    'ZL': 'Electrical (EV)',
    'ZM': 'Materials Engineering',
    'ZN': 'Nano Technology',
    'ZT': 'Aerospace Technology',
    'ZU': 'Urban Technology',
    'ZV': 'EV & Energy Systems',
    'ZW': 'Water Technology',
}

# ── Build sorted branch list for dropdown ─────────────────────────────────────
all_branches_in_data = set()
for college in raw.values():
    for branch in college.get('branches', {}):
        all_branches_in_data.add(branch)

# Priority branches first, then rest alphabetically
priority = ['CS','EC','ME','CE','EE','IE','AI','CA','DS','IC','AD','AE','AR','AU','BT','CH','CY','CD','CB','CW','DB','DS','ET','EI','IO','MT','RA','SE','RO']
branch_list = []
for b in priority:
    if b in all_branches_in_data:
        branch_list.append(b)
for b in sorted(all_branches_in_data):
    if b not in branch_list:
        branch_list.append(b)

branch_options_html = ''
for b in branch_list:
    label = BRANCH_NAMES.get(b, b)
    branch_options_html += f'<option value="{b}">{b} - {label}</option>\n'

# ── Category dropdown HTML ────────────────────────────────────────────────────
CAT_LABELS = {
    'GM':  'GM - General Merit',
    'GMR': 'GMR - GM Rural',
    'GMK': 'GMK - GM Kannada Medium',
    '1G':  '1G - Category I',
    '1K':  '1K - Category I (Kannada Medium)',
    '1R':  '1R - Category I (Rural)',
    '2AG': '2AG - OBC 2A',
    '2AK': '2AK - OBC 2A (Kannada Medium)',
    '2AR': '2AR - OBC 2A (Rural)',
    '2BG': '2BG - OBC 2B',
    '2BK': '2BK - OBC 2B (Kannada Medium)',
    '2BR': '2BR - OBC 2B (Rural)',
    '3AG': '3AG - OBC 3A',
    '3AK': '3AK - OBC 3A (Kannada Medium)',
    '3AR': '3AR - OBC 3A (Rural)',
    '3BG': '3BG - OBC 3B',
    '3BK': '3BK - OBC 3B (Kannada Medium)',
    '3BR': '3BR - OBC 3B (Rural)',
    'SCG': 'SCG - Scheduled Caste',
    'SCK': 'SCK - SC (Kannada Medium)',
    'SCR': 'SCR - SC (Rural)',
    'STG': 'STG - Scheduled Tribe',
    'STK': 'STK - ST (Kannada Medium)',
    'STR': 'STR - ST (Rural)',
}
cat_options_html = ''
for cat, label in CAT_LABELS.items():
    cat_options_html += f'<option value="{cat}">{label}</option>\n'

# ── HTML template (using string concatenation to avoid f-string brace issues) ─
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
  --bg:#f8faff;--card:#fff;--text:#1e293b;--muted:#64748b;
  --border-c:#e2e8f0;
}
body{font-family:'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
header{background:linear-gradient(135deg,var(--grad1),var(--grad2),var(--grad3));color:#fff;padding:2rem 1rem;text-align:center}
header h1{font-size:clamp(1.4rem,4vw,2.2rem);font-weight:800;letter-spacing:-0.5px}
header p.sub{font-size:.95rem;opacity:.88;margin-top:.4rem}
.attribution{font-size:.82rem;opacity:.78;margin-top:.7rem;font-style:italic}
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
.chip-safe{background:var(--safe)}
.chip-mod{background:var(--mod)}
.chip-border{background:var(--border)}
.chip-long{background:var(--long)}
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
.badge-safe{background:var(--safe)}
.badge-mod{background:var(--mod)}
.badge-border{background:var(--border)}
.badge-long{background:var(--long)}
.est-2025{background:linear-gradient(135deg,#dbeafe,#ede9fe);color:#1e40af;font-weight:800;border-radius:4px;padding:.2rem .5rem}
.empty-msg{text-align:center;padding:3rem 1rem;color:var(--muted);font-size:1rem}
.legend{display:flex;flex-wrap:wrap;gap:.75rem;font-size:.78rem;margin-bottom:1rem}
.legend-item{display:flex;align-items:center;gap:.4rem}
.legend-dot{width:14px;height:14px;border-radius:3px}
.disclaimer{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:1rem 1.2rem;font-size:.8rem;color:#78350f;margin-top:1.5rem}
.disclaimer strong{color:#92400e}
footer{text-align:center;padding:2rem 1rem;color:var(--muted);font-size:.82rem;border-top:1px solid var(--border-c);margin-top:2rem}
footer .attr{font-weight:700;color:var(--text)}
@media(max-width:600px){
  header{padding:1.2rem .75rem}
  .card{padding:1rem}
  .btn{width:100%}
}
</style>
</head>
<body>

<header>
  <h1>&#127891; KCET 2025 College Predictor</h1>
  <p class="sub">Predict your college admission chances based on official KEA cutoff data (2022–2024)</p>
  <div class="attribution">Created by <strong>Srishna Dhanvasageshwara</strong> &nbsp;|&nbsp;
    Shri Sharanabasaveshwara PU Science College, Vijayapura &nbsp;|&nbsp; Department of Physics</div>
</header>

<div class="container">

  <!-- Input Card -->
  <div class="card">
    <div class="form-grid">
      <div>
        <label for="rank">Your KCET Rank</label>
        <input type="number" id="rank" placeholder="e.g. 5000" min="1" max="200000"/>
      </div>
      <div>
        <label for="branch">Branch / Programme</label>
        <select id="branch">
          <option value="">-- Select Branch --</option>
          BRANCH_OPTIONS_PLACEHOLDER
        </select>
      </div>
      <div>
        <label for="category">Reservation Category</label>
        <select id="category">
          CAT_OPTIONS_PLACEHOLDER
        </select>
      </div>
      <div>
        <button class="btn" onclick="predict()">&#128269; Predict Colleges</button>
      </div>
    </div>
  </div>

  <!-- Legend -->
  <div class="legend">
    <div class="legend-item"><div class="legend-dot" style="background:#dcfce7;border:1px solid #86efac"></div><span><strong>Green</strong> – Safe (rank &lt; 80% of cutoff)</span></div>
    <div class="legend-item"><div class="legend-dot" style="background:#fef9c3;border:1px solid #fcd34d"></div><span><strong>Yellow</strong> – Moderate (rank &lt; 95% of cutoff)</span></div>
    <div class="legend-item"><div class="legend-dot" style="background:#fee2e2;border:1px solid #fca5a5"></div><span><strong>Red</strong> – Borderline (rank &lt; 120% of cutoff)</span></div>
    <div class="legend-item"><div class="legend-dot" style="background:#f1f5f9;border:1px solid #cbd5e1"></div><span><strong>Grey</strong> – Long Shot (rank &gt; 120% of cutoff)</span></div>
  </div>

  <!-- Results -->
  <div id="results"></div>

  <!-- Disclaimer -->
  <div class="disclaimer">
    <strong>&#9888; Disclaimer:</strong> This tool uses official KEA KCET cutoff data from 2022–2024 general counselling rounds.
    Actual 2025 cutoffs may vary due to changes in seat availability, applicant pool, and college policies.
    The "Est. 2025 Final" column is a <em>weighted projection</em> (2022:2023:2024 = 1:2:3) and is for reference only.
    Always verify with the official <strong>KEA Karnataka</strong> website before making decisions.
    Data source: Official KEA published PDFs.
  </div>

</div>

<footer>
  <div class="attr">Srishna Dhanvasageshwara</div>
  <div>Shri Sharanabasaveshwara PU Science College, Vijayapura &nbsp;|&nbsp; Department of Physics</div>
  <div style="margin-top:.4rem;color:#94a3b8">KCET 2025 College Predictor &bull; Data: Official KEA PDFs 2022&ndash;2024</div>
</footer>

<script>
// ── Embedded data ─────────────────────────────────────────────────────────────
const DATA = JS_DATA_PLACEHOLDER;

// Round indices: 0=2022_R1,1=2022_R2,2=2022_EXT,3=2023_R1,4=2023_R2,5=2023_EXT,6=2024_R1,7=2024_R2,8=2024_EXT
const FINAL_IDX = [2, 5, 8]; // Final/EXT rounds
const ROUND_LABELS = ['2022 R1','2022 R2','2022 Final','2023 R1','2023 R2','2023 Final','2024 R1','2024 R2','2024 Final'];

function weightedEst(arr) {
  // weights 1:2:3 for indices 2,5,8
  const weights = [1, 2, 3];
  let wsum = 0, total = 0;
  FINAL_IDX.forEach((idx, i) => {
    const v = arr[idx];
    if (v && v > 0) { wsum += v * weights[i]; total += weights[i]; }
  });
  return total > 0 ? Math.round(wsum / total) : 0;
}

function getPrediction(rank, arr) {
  const finals = FINAL_IDX.map(i => arr[i]).filter(v => v && v > 0);
  if (finals.length === 0) return 'unknown';
  const avg = finals.reduce((a,b)=>a+b,0) / finals.length;
  if (rank < avg * 0.80) return 'safe';
  if (rank < avg * 0.95) return 'moderate';
  if (rank < avg * 1.20) return 'borderline';
  return 'longshot';
}

function cellClass(rank, cutoff) {
  if (!cutoff || cutoff === 0) return 'na';
  if (rank < cutoff * 0.80) return 'green';
  if (rank < cutoff * 0.95) return 'yellow';
  if (rank < cutoff * 1.20) return 'red';
  return 'grey';
}

function fmtCutoff(rank, cutoff) {
  if (!cutoff || cutoff === 0) return '<span class="cell-na">—</span>';
  const cls = cellClass(rank, cutoff);
  return '<span class="cell-' + cls + '">' + cutoff.toLocaleString() + '</span>';
}

function badgeHtml(pred) {
  const map = {
    safe: ['Safe','badge-safe'],
    moderate: ['Moderate','badge-mod'],
    borderline: ['Borderline','badge-border'],
    longshot: ['Long Shot','badge-long'],
    unknown: ['No Data','badge-long']
  };
  const [label, cls] = map[pred] || map.unknown;
  return '<span class="badge ' + cls + '">' + label + '</span>';
}

function predict() {
  const rank = parseInt(document.getElementById('rank').value);
  const branch = document.getElementById('branch').value;
  const cat = document.getElementById('category').value;

  if (!rank || rank < 1) { alert('Please enter a valid KCET rank.'); return; }
  if (!branch) { alert('Please select a branch.'); return; }
  if (!cat) { alert('Please select a category.'); return; }

  // Collect matching colleges
  const rows = [];
  for (const [code, college] of Object.entries(DATA)) {
    const bData = college.b[branch];
    if (!bData) continue;
    const catArr = bData[cat];
    if (!catArr) continue;
    const pred = getPrediction(rank, catArr);
    const est = weightedEst(catArr);
    const finals = FINAL_IDX.map(i => catArr[i]).filter(v => v > 0);
    const avgFinal = finals.length > 0 ? finals.reduce((a,b)=>a+b,0)/finals.length : Infinity;
    rows.push({ code, name: college.n, loc: college.l, arr: catArr, pred, est, avgFinal });
  }

  if (rows.length === 0) {
    document.getElementById('results').innerHTML =
      '<div class="card empty-msg">No data found for <strong>' + branch + '</strong> / <strong>' + cat +
      '</strong>.<br/>Try a different branch or category combination.</div>';
    return;
  }

  // Sort: Safe first, then moderate, borderline, longshot/unknown; within group by avgFinal asc
  const ORDER = { safe:0, moderate:1, borderline:2, longshot:3, unknown:4 };
  rows.sort((a,b) => {
    const od = ORDER[a.pred] - ORDER[b.pred];
    if (od !== 0) return od;
    return a.avgFinal - b.avgFinal;
  });

  // Count badges
  const counts = { safe:0, moderate:0, borderline:0, longshot:0, unknown:0 };
  rows.forEach(r => counts[r.pred]++);

  let html = '<div class="card">';
  html += '<div class="stats-bar">';
  html += '<span>Showing <strong>' + rows.length + '</strong> colleges &nbsp;</span>';
  if (counts.safe)      html += '<span class="stat-chip chip-safe">&#10003; Safe: ' + counts.safe + '</span>';
  if (counts.moderate)  html += '<span class="stat-chip chip-mod">~ Moderate: ' + counts.moderate + '</span>';
  if (counts.borderline)html += '<span class="stat-chip chip-border">! Borderline: ' + counts.borderline + '</span>';
  if (counts.longshot+counts.unknown) html += '<span class="stat-chip chip-long">&#10007; Long Shot: ' + (counts.longshot+counts.unknown) + '</span>';
  html += '</div>';
  html += '<div class="table-wrap"><table>';
  html += '<thead><tr>';
  html += '<th class="col-name">#&nbsp; College Name</th>';
  html += '<th class="col-loc">Location</th>';
  html += '<th class="col-pred">Prediction</th>';
  ROUND_LABELS.forEach(function(lbl){ html += '<th>' + lbl + '</th>'; });
  html += '<th>Est.&nbsp;2025</th>';
  html += '</tr></thead><tbody>';

  rows.forEach(function(r, idx) {
    html += '<tr>';
    html += '<td class="col-name">' + (idx+1) + '.&nbsp;' + r.name + '</td>';
    html += '<td class="col-loc">' + (r.loc || '—') + '</td>';
    html += '<td>' + badgeHtml(r.pred) + '</td>';
    r.arr.forEach(function(v) { html += '<td>' + fmtCutoff(rank, v) + '</td>'; });
    const estVal = r.est > 0 ? '<span class="est-2025">~' + r.est.toLocaleString() + '</span>' : '<span class="cell-na">—</span>';
    html += '<td>' + estVal + '</td>';
    html += '</tr>';
  });

  html += '</tbody></table></div></div>';
  document.getElementById('results').innerHTML = html;
  document.getElementById('results').scrollIntoView({behavior:'smooth', block:'start'});
}

// Allow Enter key on rank input
document.getElementById('rank').addEventListener('keydown', function(e){
  if (e.key === 'Enter') predict();
});
</script>
</body>
</html>'''

# ── Inject dynamic parts ──────────────────────────────────────────────────────
HTML = HTML.replace('BRANCH_OPTIONS_PLACEHOLDER', branch_options_html)
HTML = HTML.replace('CAT_OPTIONS_PLACEHOLDER', cat_options_html)
HTML = HTML.replace('JS_DATA_PLACEHOLDER', js_data_str)

# ── Write output ──────────────────────────────────────────────────────────────
out_path = '/home/user/Sumeet-/kcet_college_predictor.html'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(HTML)

size_kb = os.path.getsize(out_path) / 1024
print(f'Generated: {out_path}')
print(f'File size: {size_kb:.1f} KB ({size_kb/1024:.2f} MB)')
print('Done.')
