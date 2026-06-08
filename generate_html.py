"""
Generates the final KCET predictor HTML with real KEA data embedded.
"""

import json, re

with open("/home/user/Sumeet-/kcet_data.json") as f:
    raw = json.load(f)

ROUNDS = ["2022_R1","2022_R2","2022_EXT","2023_R1","2023_R2","2023_EXT","2024_R1","2024_R2","2024_EXT"]
ROUND_LABELS = ["2022 R-1","2022 R-2","2022 Final","2023 R-1","2023 R-2","2023 Final","2024 R-1","2024 R-2","2024 Final"]

# Category key in PDF → (dropdown value, label)
# Showing only G (general), R (rural), K (Kannada medium) variants
CAT_MAP = {
    "GM":  ("GM",    "GM – General Merit"),
    "GMR": ("GMR",   "GM-R – General Merit (Rural)"),
    "GMK": ("GMK",   "KM – Kannada Medium (GM)"),
    "1G":  ("1G",    "CAT-1 – Category I"),
    "1R":  ("1R",    "CAT-1-R – Category I (Rural)"),
    "2AG": ("2AG",   "2A – OBC 2A"),
    "2AR": ("2AR",   "2A-R – OBC 2A (Rural)"),
    "2BG": ("2BG",   "2B – OBC 2B"),
    "2BR": ("2BR",   "2B-R – OBC 2B (Rural)"),
    "3AG": ("3AG",   "3A – OBC 3A"),
    "3AR": ("3AR",   "3A-R – OBC 3A (Rural)"),
    "3BG": ("3BG",   "3B – OBC 3B"),
    "3BR": ("3BR",   "3B-R – OBC 3B (Rural)"),
    "SCG": ("SCG",   "SC – Scheduled Caste"),
    "SCR": ("SCR",   "SC-R – Scheduled Caste (Rural)"),
    "SCK": ("SCK",   "SC-KM – SC Kannada Medium"),
    "STG": ("STG",   "ST – Scheduled Tribe"),
    "STR": ("STR",   "ST-R – Scheduled Tribe (Rural)"),
    "STK": ("STK",   "ST-KM – ST Kannada Medium"),
    "1K":  ("1K",    "CAT-1-KM – Category I (Kannada Medium)"),
    "2AK": ("2AK",   "2A-KM – OBC 2A (Kannada Medium)"),
    "2BK": ("2BK",   "2B-KM – OBC 2B (Kannada Medium)"),
    "3AK": ("3AK",   "3A-KM – OBC 3A (Kannada Medium)"),
    "3BK": ("3BK",   "3B-KM – OBC 3B (Kannada Medium)"),
}

BRANCH_DISPLAY = {
    "AI":"AI & Machine Learning","CA":"CS (AI/ML)","AD":"CS-AI & Data Sc",
    "CS":"Computer Science","CY":"CS-Cyber Security","DS":"Data Science",
    "CB":"CS & Business Sys","CD":"CS & Design","IE":"Information Science",
    "EC":"Electronics & Comm","EE":"Electrical & Electronics",
    "EI":"Electronics & Instr","ET":"Electronics Telecomm",
    "ME":"Mechanical","CE":"Civil","CH":"Chemical",
    "BT":"Bio Technology","AU":"Automobile","AE":"Aeronautical",
    "SE":"Aerospace","IM":"Industrial Engg & Mgmt",
    "MA":"Mechatronics","MD":"Medical Electronics",
    "RI":"Robotics & IoT","TX":"Textiles","ST":"Silk Technology",
    "IO":"IoT","FD":"Food Technology","MN":"Mining",
    "PE":"Petroleum","PT":"Polymer","RO":"Robotics",
    "IN":"Instrumentation","II":"Instrumentation Tech",
    "TC":"Telecomm","TT":"Transport Tech",
    "AT":"Automation","CB":"CS & Business","CV":"Civil",
}

# Build compact JS data
# Format: DATA[code] = {n:name, l:location, b:{branch:{cat:[v0..v8]}}}
# v0..v8 correspond to ROUNDS
def build_js_data():
    entries = []
    for code, col in sorted(raw.items()):
        if not col["branches"]:
            continue
        name = col["name"]
        location = col["location"]
        # Clean up names
        name = re.sub(r'\s+', ' ', name).strip()
        location = re.sub(r'\s+', ' ', location).strip()

        branches_js = {}
        for bcode, byears in col["branches"].items():
            cats_js = {}
            for cat_key in CAT_MAP.keys():
                vals = []
                has_any = False
                for rnd in ROUNDS:
                    yr_data = byears.get(rnd, {})
                    if yr_data:
                        v = yr_data.get(cat_key)
                        vals.append(v)
                        if v: has_any = True
                    else:
                        vals.append(None)
                if has_any:
                    cats_js[cat_key] = vals
            if cats_js:
                branches_js[bcode] = cats_js
        if branches_js:
            entries.append((code, name, location, branches_js))

    # Serialize
    lines = []
    lines.append("const DATA={")
    for code, name, location, branches in entries:
        b_parts = []
        for bcode, cats in branches.items():
            c_parts = []
            for cat, vals in cats.items():
                # Compact: replace None with 0
                v_str = "[" + ",".join(str(v) if v else "0" for v in vals) + "]"
                c_parts.append(f'"{cat}":{v_str}')
            b_parts.append(f'"{bcode}":{{{",".join(c_parts)}}}')
        # Escape quotes in name
        n_esc = name.replace('"', '\\"')
        l_esc = location.replace('"', '\\"')
        lines.append(f'"{code}":'  + '{' + f'n:"{n_esc}",l:"{l_esc}",b:{{{",".join(b_parts)}}}' + '},')
    lines.append("};")
    return "\n".join(lines)

js_data = build_js_data()
print(f"JS data size: {len(js_data):,} bytes ({len(js_data)//1024} KB)")

# Build category options HTML
cat_options = []
cat_options.append('<optgroup label="── General Merit ──">')
for k in ["GM","GMR","GMK"]:
    v,l = CAT_MAP[k]
    cat_options.append(f'<option value="{v}">{l}</option>')
cat_options.append('</optgroup>')
cat_options.append('<optgroup label="── Category I ──">')
for k in ["1G","1R","1K"]:
    v,l = CAT_MAP[k]
    cat_options.append(f'<option value="{v}">{l}</option>')
cat_options.append('</optgroup>')
cat_options.append('<optgroup label="── OBC 2A ──">')
for k in ["2AG","2AR","2AK"]:
    v,l = CAT_MAP[k]
    cat_options.append(f'<option value="{v}">{l}</option>')
cat_options.append('</optgroup>')
cat_options.append('<optgroup label="── OBC 2B ──">')
for k in ["2BG","2BR","2BK"]:
    v,l = CAT_MAP[k]
    cat_options.append(f'<option value="{v}">{l}</option>')
cat_options.append('</optgroup>')
cat_options.append('<optgroup label="── OBC 3A ──">')
for k in ["3AG","3AR","3AK"]:
    v,l = CAT_MAP[k]
    cat_options.append(f'<option value="{v}">{l}</option>')
cat_options.append('</optgroup>')
cat_options.append('<optgroup label="── OBC 3B ──">')
for k in ["3BG","3BR","3BK"]:
    v,l = CAT_MAP[k]
    cat_options.append(f'<option value="{v}">{l}</option>')
cat_options.append('</optgroup>')
cat_options.append('<optgroup label="── SC / ST ──">')
for k in ["SCG","SCR","SCK","STG","STR","STK"]:
    v,l = CAT_MAP[k]
    cat_options.append(f'<option value="{v}">{l}</option>')
cat_options.append('</optgroup>')
cat_options_html = "\n".join(cat_options)

# Build branch options
branch_entries = sorted(BRANCH_DISPLAY.items(), key=lambda x: x[1])
branch_options = '\n'.join(
    f'<option value="{k}">{v} ({k})</option>'
    for k,v in branch_entries
)

ROUND_LABELS_JS = json.dumps(ROUND_LABELS)

HTML = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>KCET College Predictor — Official KEA Data 2022–2024</title>
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:linear-gradient(135deg,#0d47a1,#4a148c);min-height:100vh;padding:14px}}

/* Attribution */
.attr-strip{{max-width:1400px;margin:0 auto;background:linear-gradient(90deg,#0a2d78,#380d6e);color:#fff;border-radius:14px 14px 0 0;padding:12px 30px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}}
.attr-name{{font-size:1.15em;font-weight:700;letter-spacing:.3px}}
.attr-college{{font-size:.88em;opacity:.88;font-style:italic;margin-top:2px}}
.attr-dept{{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:20px;padding:4px 14px;font-size:.84em;font-weight:600;white-space:nowrap}}

/* Container */
.container{{max-width:1400px;margin:0 auto;background:#fff;border-radius:0 0 18px 18px;box-shadow:0 25px 70px rgba(0,0,0,.4);overflow:hidden}}

/* Header */
.hdr{{background:linear-gradient(135deg,#0d47a1,#4a148c);color:#fff;padding:26px 36px 22px;text-align:center}}
.hdr h1{{font-size:1.9em;font-weight:700}}
.hdr p{{font-size:.94em;opacity:.85;margin-top:6px}}
.hdr .badge{{display:inline-block;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.32);border-radius:20px;padding:3px 14px;font-size:.78em;margin-top:8px}}

/* Form */
.form-sec{{padding:22px 30px 18px;background:#f4f6fb;border-bottom:2px solid #e3e8f0}}
.form-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;align-items:end}}
.fg{{display:flex;flex-direction:column}}
label{{font-weight:600;font-size:.85em;margin-bottom:5px;color:#455a64}}
input,select{{padding:11px 13px;border:2px solid #cfd8dc;border-radius:9px;font-size:.95em;transition:border-color .2s;background:#fff}}
input:focus,select:focus{{outline:none;border-color:#3949ab;box-shadow:0 0 0 3px rgba(57,73,171,.1)}}
.btn-go{{background:linear-gradient(135deg,#0d47a1,#4a148c);color:#fff;border:none;padding:12px 20px;border-radius:9px;font-size:.97em;font-weight:700;cursor:pointer;transition:transform .2s,box-shadow .2s}}
.btn-go:hover{{transform:translateY(-2px);box-shadow:0 8px 22px rgba(13,71,161,.45)}}
.btn-reset{{background:#eceff1;color:#546e7a;border:2px solid #b0bec5;padding:11px 16px;border-radius:9px;font-size:.92em;font-weight:600;cursor:pointer}}
.btn-reset:hover{{background:#cfd8dc}}
.note{{font-size:.74em;color:#90a4ae;margin-top:3px}}

/* Results */
.res-sec{{padding:24px 30px}}
.res-title{{font-size:1.1em;color:#263238;margin-bottom:14px}}
.res-title span{{color:#0d47a1;font-weight:700}}

/* Stats */
.stats{{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:16px}}
.stat{{text-align:center;padding:12px 8px;border-radius:10px;color:#fff;box-shadow:0 3px 10px rgba(0,0,0,.12)}}
.s-total{{background:#3949ab}}.s-safe{{background:#2e7d32}}.s-mod{{background:#f57f17}}.s-risk{{background:#c62828}}
.s-num{{font-size:1.8em;font-weight:700}}.s-lbl{{font-size:.75em;margin-top:2px;opacity:.9}}

/* Legend */
.legend{{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:14px;padding:10px 14px;background:#f9f9fb;border-radius:9px;border:1px solid #e0e4f0;font-size:.83em;color:#37474f}}
.li{{display:flex;align-items:center;gap:6px}}
.ld{{width:11px;height:11px;border-radius:50%;flex-shrink:0}}

/* Table */
.tbl-wrap{{overflow-x:auto;border-radius:10px;border:1px solid #e3e8f0}}
table{{width:100%;border-collapse:collapse;font-size:.82em}}
thead th{{background:linear-gradient(135deg,#0d47a1,#4a148c);color:#fff;padding:10px 12px;text-align:center;font-weight:600;white-space:nowrap;font-size:.82em}}
thead th:first-child,thead th:nth-child(2),thead th:nth-child(3){{text-align:left}}
thead .yr-grp{{background:#1565c0;font-size:.72em;opacity:.9}}
tbody tr{{transition:background .12s}}
tbody tr:nth-child(even){{background:#f8f9fc}}
tbody tr:hover{{background:#e8eaf6}}
td{{padding:9px 11px;border-bottom:1px solid #e3e8f0;vertical-align:middle;text-align:center;font-size:.83em}}
td:first-child,td:nth-child(2),td:nth-child(3){{text-align:left}}
.cn{{font-weight:600;color:#0d47a1;font-size:.82em;min-width:200px}}
.lc{{display:inline-block;background:#e8eaf6;color:#3949ab;border-radius:5px;padding:1px 6px;font-size:.75em;font-weight:600;white-space:nowrap}}

/* Cutoff cell styling */
.v-safe{{background:#e8f5e9;color:#1b5e20;font-weight:600}}
.v-mod {{background:#fff8e1;color:#e65100;font-weight:600}}
.v-risk{{background:#fce4ec;color:#b71c1c;font-weight:600}}
.v-long{{background:#eceff1;color:#546e7a}}
.v-na  {{color:#bdbdbd;font-size:.75em}}

/* Badge */
.badge{{display:inline-block;padding:3px 10px;border-radius:16px;font-size:.76em;font-weight:700;white-space:nowrap}}
.b-safe{{background:#e8f5e9;color:#1b5e20;border:1px solid #a5d6a7}}
.b-mod {{background:#fff8e1;color:#e65100;border:1px solid #ffcc80}}
.b-risk{{background:#fce4ec;color:#b71c1c;border:1px solid #ef9a9a}}
.b-long{{background:#eceff1;color:#546e7a;border:1px solid #cfd8dc}}

/* Prediction cell */
.pred-cell{{min-width:90px}}
.pred-val{{font-size:.78em;color:#546e7a;margin-top:2px}}

/* Year group header */
.yr-hdr{{text-align:center;font-size:.78em;font-weight:700;padding:5px;background:#1565c0;color:#fff;border-bottom:1px solid rgba(255,255,255,.2)}}

/* Filter info */
.finfo{{background:#e8eaf6;border-radius:7px;padding:8px 12px;font-size:.85em;color:#3949ab;margin-bottom:14px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}}
.fchip{{background:#fff;border:1px solid #9fa8da;border-radius:16px;padding:2px 10px;font-weight:600;font-size:.82em}}

/* Disclaimer */
.disc{{background:#fff8e1;border-left:5px solid #ffc107;border-radius:7px;padding:12px 16px;margin-top:20px;font-size:.82em;color:#5d4037;line-height:1.6}}
.disc strong{{color:#bf360c}}

/* No results */
.no-res{{text-align:center;padding:40px;color:#90a4ae}}

/* Footer */
.footer{{text-align:center;padding:14px;font-size:.78em;color:#90a4ae;border-top:1px solid #e3e8f0;background:#f9f9fb}}

@media(max-width:768px){{
  .hdr h1{{font-size:1.4em}}
  .form-sec,.res-sec{{padding:14px}}
  table{{font-size:.74em}}
  td,th{{padding:7px 8px}}
  .attr-strip{{padding:8px 14px;border-radius:10px 10px 0 0}}
}}
</style>
</head>
<body>

<!-- Attribution -->
<div class="attr-strip">
  <div>
    <div class="attr-name">Srishna Dhanvasageshwara</div>
    <div class="attr-college">Shri Sharanabasaveshwara PU Science College, Vijayapura</div>
  </div>
  <div class="attr-dept">&#128300; Department of Physics</div>
</div>

<div class="container">

<!-- Header -->
<div class="hdr">
  <h1>&#127979; KCET College Predictor — Karnataka Engineering</h1>
  <p>Real official KEA cutoff data &bull; 2022, 2023, 2024 &bull; All 3 Rounds each year</p>
  <div class="badge">260 Colleges &bull; 24 Reservation Categories &bull; 9 Counselling Rounds &bull; Official KEA Data</div>
</div>

<!-- Form -->
<div class="form-sec">
  <div class="form-grid">
    <div class="fg">
      <label for="rank">Your KCET Rank</label>
      <input type="number" id="rank" placeholder="e.g. 5000" min="1" max="250000"/>
    </div>
    <div class="fg">
      <label for="branch">Branch</label>
      <select id="branch">
        <option value="">-- Select Branch --</option>
        {branch_options}
      </select>
    </div>
    <div class="fg">
      <label for="cat">Reservation Category</label>
      <select id="cat">
        <option value="">-- Select Category --</option>
        {cat_options_html}
      </select>
      <span class="note">* Data from official KEA General category PDFs. HK data is in separate KEA PDFs.</span>
    </div>
    <div class="fg" style="flex-direction:row;gap:8px">
      <button class="btn-go" onclick="go()" style="flex:1">&#128269; Predict</button>
      <button class="btn-reset" onclick="rst()">&#8635;</button>
    </div>
  </div>
</div>

<!-- Results -->
<div class="res-sec" id="res" style="display:none"></div>

<!-- Footer -->
<div class="footer">
  Prepared by <strong>Srishna Dhanvasageshwara</strong> &nbsp;|&nbsp;
  Shri Sharanabasaveshwara PU Science College, Vijayapura &nbsp;|&nbsp;
  Department of Physics &nbsp;|&nbsp;
  Data Source: Official KEA (Karnataka Examinations Authority) PDFs
</div>

</div><!-- /.container -->

<script>
const ROUNDS={rounds};
const ROUND_LABELS={rl};
// Year group spans for table headers
const YR_GROUPS=[["2022",3],["2023",3],["2024",3]];

{js_data}

const BRANCH_FULL={{
  AI:"AI & Machine Learning",CA:"CS (AI/ML)",AD:"CS-AI & Data Sc",
  CS:"Computer Science",CY:"CS-Cyber Security",DS:"Data Science",
  CB:"CS & Business Sys",CD:"CS & Design",IE:"Information Science",
  EC:"Electronics & Comm",EE:"Electrical & Electronics",
  EI:"Electronics & Instr",ET:"Electronics Telecomm",
  ME:"Mechanical",CE:"Civil",CH:"Chemical",
  BT:"Bio Technology",AU:"Automobile",AE:"Aeronautical",
  SE:"Aerospace",IM:"Industrial Engg & Mgmt",
  MA:"Mechatronics",MD:"Medical Electronics",
  RI:"Robotics & IoT",TX:"Textiles",ST:"Silk Technology",
  IO:"IoT",FD:"Food Technology",MN:"Mining",
  PE:"Petroleum",PT:"Polymer",RO:"Robotics",
  IN:"Instrumentation",AT:"Automation",
}};

function getStatus(rank, vals){{
  // Use the 3 final-round values (indices 2,5,8)
  const finals = [vals[2],vals[5],vals[8]].filter(v=>v&&v>0);
  if(!finals.length) return null;
  const maxF = Math.max(...finals);
  const minF = Math.min(...finals);
  if(rank<=minF*0.80) return {{label:"Safe",        badge:"b-safe", rowcls:""}};
  if(rank<=maxF*0.95) return {{label:"Moderate",    badge:"b-mod",  rowcls:""}};
  if(rank<=maxF*1.20) return {{label:"Borderline",  badge:"b-risk", rowcls:""}};
  return               {{label:"Long Shot",   badge:"b-long", rowcls:""}};
}}

function cellCls(rank, val){{
  if(!val||val===0) return "v-na";
  if(rank<=val*0.80) return "v-safe";
  if(rank<=val*0.95) return "v-mod";
  if(rank<=val*1.20) return "v-risk";
  return "v-long";
}}

function predict2025(vals){{
  // Simple: average of the 3 final-round values weighted toward 2024
  const f2022=vals[2]||0, f2023=vals[5]||0, f2024=vals[8]||0;
  const ws = [[f2022,1],[f2023,2],[f2024,3]].filter(x=>x[0]>0);
  if(!ws.length) return null;
  const sum = ws.reduce((a,x)=>a+x[0]*x[1],0);
  const wt  = ws.reduce((a,x)=>a+x[1],0);
  return Math.round(sum/wt);
}}

function go(){{
  const rank = parseInt(document.getElementById('rank').value);
  const branch = document.getElementById('branch').value;
  const cat = document.getElementById('cat').value;
  if(!rank||!branch||!cat){{ toast("Please fill all three fields."); return; }}

  // Collect matching rows
  const rows = [];
  for(const [code, col] of Object.entries(DATA)){{
    if(!col.b[branch]) continue;
    const bdata = col.b[branch][cat];
    if(!bdata) continue;
    const st = getStatus(rank, bdata);
    if(!st) continue;
    const p2025 = predict2025(bdata);
    rows.push({{code, name:col.n, loc:col.l, vals:bdata, st, p2025}});
  }}

  if(!rows.length){{
    document.getElementById('res').innerHTML=`<div class="no-res"><div style="font-size:2.5em">&#128269;</div><p style="margin-top:10px"><strong>No data found</strong> for the selected branch + category combination.</p><p style="margin-top:6px;font-size:.9em;color:#bbb">Try a different branch or category.</p></div>`;
    document.getElementById('res').style.display='block';
    return;
  }}

  // Sort: Safe first, then by avg of finals ascending
  const order={{Safe:0,Moderate:1,Borderline:2,"Long Shot":3}};
  rows.sort((a,b)=>{{
    const od=order[a.st.label]-order[b.st.label];
    if(od) return od;
    const avgA=(a.vals[2]||0)+(a.vals[5]||0)+(a.vals[8]||0);
    const avgB=(b.vals[2]||0)+(b.vals[5]||0)+(b.vals[8]||0);
    return avgA-avgB;
  }});

  let safe=0,mod=0,border=0,ls=0;
  rows.forEach(r=>{{
    if(r.st.label==="Safe") safe++;
    else if(r.st.label==="Moderate") mod++;
    else if(r.st.label==="Borderline") border++;
    else ls++;
  }});

  const catLabel = document.getElementById('cat').options[document.getElementById('cat').selectedIndex].text;
  const branchLabel = document.getElementById('branch').options[document.getElementById('branch').selectedIndex].text;

  // Year group header row
  const yrHeaders = YR_GROUPS.map(([yr,span])=>
    `<th class="yr-grp" colspan="${{span}}">${{yr}}</th>`
  ).join('');
  const roundHeaders = ROUND_LABELS.map(l=>`<th>${{l}}</th>`).join('');

  // Table rows
  const tableRows = rows.map(r=>{{
    const cells = r.vals.map((v,i)=>{{
      if(!v||v===0) return `<td class="v-na">–</td>`;
      const cls=cellCls(rank,v);
      return `<td class="${{cls}}">${{v.toLocaleString('en-IN')}}</td>`;
    }}).join('');
    const p = r.p2025 ? r.p2025.toLocaleString('en-IN') : "N/A";
    return `<tr>
      <td class="cn">${{r.name}}</td>
      <td><span class="lc">${{r.loc}}</span></td>
      <td><span class="badge ${{r.st.badge}}">${{r.st.label}}</span></td>
      ${{cells}}
      <td class="pred-cell"><span class="badge b-long">~${{p}}</span></td>
    </tr>`;
  }}).join('');

  const html = `
    <h2 class="res-title">
      Rank: <span>${{rank.toLocaleString('en-IN')}}</span>
      &nbsp;|&nbsp; Branch: <span>${{branchLabel}}</span>
      &nbsp;|&nbsp; Category: <span>${{catLabel}}</span>
    </h2>

    <div class="finfo">
      <span>&#128200; Summary:</span>
      <span class="fchip">&#9989; ${{safe}} Safe</span>
      <span class="fchip">&#128993; ${{mod}} Moderate</span>
      <span class="fchip">&#128997; ${{border}} Borderline</span>
      <span class="fchip">&#9888;&#65039; ${{ls}} Long Shot</span>
      <span class="fchip">${{rows.length}} colleges found</span>
    </div>

    <div class="stats">
      <div class="stat s-total"><div class="s-num">${{rows.length}}</div><div class="s-lbl">Colleges</div></div>
      <div class="stat s-safe"><div class="s-num">${{safe}}</div><div class="s-lbl">Safe Admission</div></div>
      <div class="stat s-mod"><div class="s-num">${{mod}}</div><div class="s-lbl">Moderate Chance</div></div>
      <div class="stat s-risk"><div class="s-num">${{border+ls}}</div><div class="s-lbl">Borderline / Long Shot</div></div>
    </div>

    <div class="legend">
      <div class="li"><div class="ld" style="background:#2e7d32"></div><strong>Safe</strong> — rank well inside all 3 years' final cutoffs</div>
      <div class="li"><div class="ld" style="background:#f57f17"></div><strong>Moderate</strong> — rank near final cutoff; good chance</div>
      <div class="li"><div class="ld" style="background:#c62828"></div><strong>Borderline</strong> — slightly over; try in later rounds</div>
      <div class="li"><div class="ld" style="background:#90a4ae"></div><strong>Long Shot</strong> — rank significantly over cutoff</div>
      <div class="li"><span style="font-size:.75em;font-weight:600">R-1/R-2/Final = KCET Round 1 / Round 2 / Extended Round closing ranks</span></div>
    </div>

    <div class="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th rowspan="2" style="min-width:200px;text-align:left">College</th>
            <th rowspan="2" style="text-align:left">Location</th>
            <th rowspan="2">Prediction</th>
            ${{yrHeaders}}
            <th rowspan="2">Est. 2025<br><small>Final</small></th>
          </tr>
          <tr>${{roundHeaders}}</tr>
        </thead>
        <tbody>${{tableRows}}</tbody>
      </table>
    </div>

    <div class="disc">
      <strong>&#9888; Data Source:</strong>
      This tool uses <strong>official KEA (Karnataka Examinations Authority)</strong> cutoff rank data
      from the published PDFs for General category allotments — 3 rounds each for 2022, 2023, and 2024.
      The <strong>2025 estimate</strong> is a weighted projection based on the 3-year trend; actual 2025 cutoffs
      may vary. Always verify with the official KEA website <em>(cetonline.karnataka.gov.in)</em>
      before making final college decisions.
    </div>
  `;

  const el = document.getElementById('res');
  el.innerHTML = html;
  el.style.display = 'block';
  el.scrollIntoView({{behavior:'smooth', block:'start'}});
}}

function rst(){{
  ['rank','branch','cat'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('res').style.display='none';
  window.scrollTo({{top:0,behavior:'smooth'}});
}}

function toast(msg){{
  const old=document.getElementById('_t'); if(old) old.remove();
  const t=document.createElement('div');
  t.id='_t';
  t.style.cssText='position:fixed;top:18px;left:50%;transform:translateX(-50%);background:#b71c1c;color:#fff;padding:11px 26px;border-radius:8px;font-weight:600;z-index:9999;box-shadow:0 4px 14px rgba(0,0,0,.3);font-size:.92em;';
  t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),3000);
}}

document.addEventListener('keydown',e=>{{if(e.key==='Enter')go();}});
</script>
</body>
</html>"""

# Fix template placeholders
HTML = HTML.replace("{rounds}", json.dumps(ROUNDS))
HTML = HTML.replace("{rl}", ROUND_LABELS_JS)

out = "/home/user/Sumeet-/kcet_college_predictor.html"
with open(out, "w", encoding="utf-8") as f:
    f.write(HTML)

size_kb = len(HTML) // 1024
print(f"Generated HTML: {size_kb} KB → {out}")
