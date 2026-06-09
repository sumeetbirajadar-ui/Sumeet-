"""
Parser for Agriculture & Veterinary PDFs.
Two formats:
1. Agriculture cutoff PDFs (F/N-code colleges) — same layout as engineering
2. PROF_CODE PDFs (V/P/N-code) — tabular college:(code) format with decimal ranks
"""

import re, json, os, subprocess

UPLOAD_DIR = "/root/.claude/uploads/b267c34e-056e-5d11-ae49-35130eef1d76"

AGRI_FILES = {
    "2024_R1": "f95a2468-agri_cutoff_2024_r1_gen.pdf",
    "2024_R2": "e824c359-agri_cutoff_2024_gen_r2kannada.pdf",
}

PROF_FILES = {
    "V": "3591cda5-PROF_CODE_V_Rkannada.pdf",
    "P": "d933c834-PROF_CODE_P_Rkannada.pdf",
    "N": "3c685aff-PROF_CODE_N_Rkannada.pdf",
}

CATS = ["1G","1K","1R","2AG","2AK","2AR","2BG","2BK","2BR",
        "3AG","3AK","3AR","3BG","3BK","3BR","GM","GMK","GMR",
        "SCG","SCK","SCR","STG","STK","STR"]
N_CATS = len(CATS)

# Standardized branch code mapping — used across both agri and prof datasets
COURSE_KEY_MAP = {
    "b.sc.(hons) agriculture":          "AG",
    "b.sc.(hons)agriculture":           "AG",
    "bsc hons agriculture":             "AG",
    "b.sc.(hons)ag.busi.mng.":          "AM",
    "b.sc.(hons) ag. business mng.":    "AM",
    "b.sc.(hons)ag. busi. mng.":        "AM",
    "b.sc.(hons) agri business management": "AM",
    "b.tech (biotechnology)":           "AB",
    "b.tech(biotechnology)":            "AB",
    "b.tech (d.tech)":                  "DT",
    "b.tech.(food technology)":         "FT",
    "b.tech (food technology)":         "FT",
    "b.fisheries science":              "FH",
    "b.sc.(hons) horticulture":         "HT",
    "b.sc.(hons)horticulture":          "HT",
    "b.sc.(hons) nutr., diet":          "ND",
    "b.sc.(hons) nutrition & dietetics":"ND",
    "b.sc.(hons) food nutrition and dietetics": "FND",
    "b.sc.(hons) food nutrition dietetics":     "FND",
    "b.sc.(hons) food nutritionand dietetics":  "FND",
    "b.sc.(hons) sericulture":          "SR",
    "b.sc.(hons)sericulture":           "SR",
    "b.sc.(hons) forestry":             "FR",
    "b.sc.(hons) community sc.":        "HS",
    "b.tech(agricultural engg)":        "EA",
    "b.tech (agricultural engg)":       "EA",
    "b.v.sc and a.h":                   "VS",
    "b.v.sc and a.h.":                  "VS",
}

COURSE_FULL_NAMES = {
    "AG":  "B.Sc.(Hons) Agriculture",
    "AM":  "B.Sc.(Hons) Ag. Business Mng.",
    "AB":  "B.Tech (Biotechnology)",
    "DT":  "B.Tech (Dairy Technology)",
    "FH":  "B.Fisheries Science",
    "FT":  "B.Tech (Food Technology)",
    "HT":  "B.Sc.(Hons) Horticulture",
    "ND":  "B.Sc.(Hons) Nutrition & Dietetics",
    "FND": "B.Sc.(Hons) Food Nutrition & Dietetics",
    "SR":  "B.Sc.(Hons) Sericulture",
    "FR":  "B.Sc.(Hons) Forestry",
    "HS":  "B.Sc.(Hons) Community Science",
    "EA":  "B.Tech (Agricultural Engg)",
    "VS":  "B.V.Sc and A.H",
}


def normalize_course_name(name):
    return re.sub(r'\s+', ' ', name.strip().lower())


def course_to_key(name):
    n = normalize_course_name(name)
    if n in COURSE_KEY_MAP:
        return COURSE_KEY_MAP[n]
    for pattern, key in COURSE_KEY_MAP.items():
        if n.startswith(pattern) or pattern.startswith(n[:20]):
            return key
    initials = re.sub(r'[^a-z]', '', n)[:6].upper()
    return initials or "UNK"


# ── Agriculture PDF parser (F/N-code colleges, same layout as engineering) ────

def tokenize_data(line):
    m = re.search(r'\s+((?:\d+|--)\s)', line)
    if not m:
        return []
    data_portion = line[m.start():]
    tokens = re.findall(r'[\d]+|--(?!\w)', data_portion)
    result = []
    for t in tokens:
        if t == "--":
            result.append(None)
        else:
            try:
                result.append(int(t))
            except ValueError:
                pass
    return result


def parse_agri_pdf(filepath):
    r = subprocess.run(["pdftotext", "-layout", filepath, "-"], capture_output=True, text=True)
    lines = r.stdout.splitlines()

    colleges = {}
    current_code = None
    pending_bcode = None
    pending_tokens = []
    pending_name_raw = ""

    def flush_pending():
        nonlocal pending_bcode, pending_tokens, pending_name_raw
        if pending_bcode and current_code and len(pending_tokens) >= N_CATS:
            tokens = pending_tokens[:N_CATS]
            bd = {CATS[i]: tokens[i] for i in range(N_CATS)}
            full_name = pending_name_raw.strip() if pending_name_raw else COURSE_FULL_NAMES.get(pending_bcode, pending_bcode)
            col = colleges[current_code]
            key = course_to_key(full_name) if pending_name_raw else pending_bcode
            if key and key not in col["branches"]:
                col["branches"][key] = {"name": full_name, "data": bd}
        pending_bcode = None
        pending_tokens = []
        pending_name_raw = ""

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # College header: "  N  F001  Name   Location"
        m = re.match(r'^\s*\d+\s+([FN]\d{3,4})\s+(.*)', line)
        if m:
            flush_pending()
            code = m.group(1)
            rest = m.group(2).strip()
            parts = re.split(r'\s{3,}', rest)
            name = parts[0].strip() if parts else rest
            location = parts[-1].strip() if len(parts) > 1 else ""
            if code not in colleges:
                colleges[code] = {"name": name, "location": location, "branches": {}}
            else:
                if len(name) > len(colleges[code]["name"]):
                    colleges[code]["name"] = name
                if location and not colleges[code]["location"]:
                    colleges[code]["location"] = location
            current_code = code
            continue

        if current_code is None:
            continue

        # Category header — skip
        if re.search(r'\b1G\b.*\bGM\b.*\bSCG\b', stripped):
            flush_pending()
            continue

        # Report headers — skip
        if re.search(r'AGRICULTURE|CUTOFF RANK|UGCET|AUG-24|SEP-24', stripped):
            continue

        # Branch data row: 2-letter code at start
        m2 = re.match(r'^\s*([A-Z]{2,3})\s', line)
        if m2:
            bcode = m2.group(1)
            if bcode in ("1G","1K","1R","SCG","SCK","SCR","STG","STK","STR"):
                continue
            if bcode != pending_bcode:
                flush_pending()
                pending_bcode = bcode
                pending_tokens = []
                # Extract course name portion (between code and first number)
                name_m = re.match(r'^\s*[A-Z]{2,3}\s+((?:[A-Za-z./()&\-,.\s]+?))\s+(?:\d+|--)', line)
                pending_name_raw = name_m.group(1).strip() if name_m else ""
            tokens = tokenize_data(line)
            pending_tokens.extend(tokens)
            continue

        # Continuation: text-only line or line with more data tokens
        if pending_bcode:
            if not re.match(r'^\s*\d+\s+[FN]', line):
                tokens = tokenize_data(line)
                if tokens:
                    pending_tokens.extend(tokens)
                elif stripped and len(stripped) < 50 and not re.search(r'\d', stripped):
                    # Course name continuation
                    pending_name_raw = (pending_name_raw + " " + stripped).strip()

    flush_pending()
    return colleges


# ── PROF_CODE PDF parser (decimal ranks, tabular format) ──────────────────────

def parse_value_line(line, positions):
    """Extract 24 values from a data line using column positions."""
    vals = {}
    n = len(positions)
    for i, (pos, cat) in enumerate(positions):
        start = max(0, pos - 4)
        end = (positions[i+1][0] - 3) if i + 1 < n else pos + 14
        segment = line[start:min(end, len(line))] if len(line) > start else ""
        m = re.search(r'[\d.]+|--', segment)
        if m:
            t = m.group()
            if t == "--":
                vals[cat] = None
            else:
                try:
                    v = float(t)
                    vals[cat] = int(v) if v == int(v) else round(v, 2)
                except ValueError:
                    vals[cat] = None
        else:
            vals[cat] = None
    return vals


def line_has_data(line, positions):
    """Check if a line has data values at the expected column positions."""
    count = 0
    for pos, _ in positions[:4]:
        start = max(0, pos - 4)
        end = pos + 12
        seg = line[start:min(end, len(line))]
        if re.search(r'[\d.]+|--', seg):
            count += 1
    return count >= 2


def parse_prof_pdf(filepath):
    r = subprocess.run(["pdftotext", "-layout", filepath, "-"], capture_output=True, text=True)
    lines = r.stdout.splitlines()

    colleges = {}
    current_code = None
    cat_positions = None

    pending_name_parts = []
    pending_vals = None

    skip_keywords = re.compile(
        r'KARNATAKA EXAMINATIONS|Non-Interactive|UGCET-2025|Seat Type:|'
        r'Generated on|Session-|Provisional Allotment'
    )

    def flush_course():
        nonlocal pending_name_parts, pending_vals
        if pending_vals is not None and pending_name_parts and current_code in colleges:
            full_name = " ".join(pending_name_parts).strip()
            if full_name:
                key = course_to_key(full_name)
                colleges[current_code]["branches"][key] = {
                    "name": full_name,
                    "data": pending_vals,
                }
        pending_name_parts = []
        pending_vals = None

    for line in lines:
        stripped = line.strip()

        # College header: "College: (V001)Name, Location"
        m = re.match(r'College:\s*\(([A-Z]\d+)\)(.*)', stripped)
        if m:
            flush_course()
            current_code = m.group(1)
            rest = m.group(2).strip()
            parts = rest.rsplit(",", 1)
            cname = parts[0].strip().rstrip(",")
            cloc = parts[1].strip() if len(parts) > 1 else ""
            if current_code not in colleges:
                colleges[current_code] = {"name": cname, "location": cloc, "branches": {}}
            cat_positions = None
            continue

        if current_code is None:
            continue

        if not stripped:
            # Empty line might separate courses; only flush if we have a complete name+vals
            if pending_vals is not None and len(pending_name_parts) > 1:
                flush_course()
            continue

        # Skip header/footer lines
        if skip_keywords.search(stripped):
            continue

        # Category header
        if re.search(r'\b1G\b.*\b1K\b.*\bGM\b', stripped):
            flush_course()
            cat_positions = []
            for cat in CATS:
                idx = line.find(cat)
                if idx >= 0:
                    cat_positions.append((idx, cat))
            cat_positions.sort(key=lambda x: x[0])
            continue

        if cat_positions is None:
            continue

        # Check if this line has data at expected column positions
        if line_has_data(line, cat_positions):
            # New course data line
            flush_course()
            # Extract course name prefix (text before first value column)
            first_pos = max(0, cat_positions[0][0] - 5)
            name_part = line[:first_pos].strip()
            pending_vals = parse_value_line(line, cat_positions)
            pending_name_parts = [name_part] if name_part else []
        elif stripped and pending_vals is not None:
            # Text continuation of course name
            pending_name_parts.append(stripped)

    flush_course()
    return colleges


# ── Run parsers ───────────────────────────────────────────────────────────────
all_agri = {}
for yr_key, fname in AGRI_FILES.items():
    fpath = os.path.join(UPLOAD_DIR, fname)
    print(f"Parsing agriculture {yr_key} ...", end=" ", flush=True)
    colleges = parse_agri_pdf(fpath)
    valid = sum(1 for c in colleges.values() if c["branches"])
    print(f"{len(colleges)} colleges, {valid} with branches")
    all_agri[yr_key] = colleges

# Merge agriculture
agri_master = {}
for yr_key, colleges in all_agri.items():
    for code, cdata in colleges.items():
        if not cdata["branches"]:
            continue
        if code not in agri_master:
            agri_master[code] = {"name": cdata["name"], "location": cdata["location"], "branches": {}}
        if len(cdata["name"]) > len(agri_master[code]["name"]):
            agri_master[code]["name"] = cdata["name"]
        if cdata["location"] and not agri_master[code]["location"]:
            agri_master[code]["location"] = cdata["location"]
        for bcode, bdata in cdata["branches"].items():
            if bcode not in agri_master[code]["branches"]:
                agri_master[code]["branches"][bcode] = {"name": bdata["name"], "rounds": {}}
            agri_master[code]["branches"][bcode]["rounds"][yr_key] = bdata["data"]

# Parse PROF_CODE
prof_master = {}
for fkey, fname in PROF_FILES.items():
    fpath = os.path.join(UPLOAD_DIR, fname)
    print(f"Parsing PROF_CODE {fkey} ...", end=" ", flush=True)
    colleges = parse_prof_pdf(fpath)
    valid = sum(1 for c in colleges.values() if c["branches"])
    print(f"{len(colleges)} colleges, {valid} with branches")
    for code, cdata in colleges.items():
        if not cdata["branches"]:
            continue
        if code not in prof_master:
            prof_master[code] = {"name": cdata["name"], "location": cdata["location"], "branches": {}}
        if len(cdata["name"]) > len(prof_master[code]["name"]):
            prof_master[code]["name"] = cdata["name"]
        if cdata["location"] and not prof_master[code]["location"]:
            prof_master[code]["location"] = cdata["location"]
        for bcode, bdata in cdata["branches"].items():
            if bcode not in prof_master[code]["branches"]:
                prof_master[code]["branches"][bcode] = {"name": bdata["name"], "data": {}}
            prof_master[code]["branches"][bcode]["data"].update(bdata["data"])

# Save
out = {"agriculture": agri_master, "professional": prof_master}
out_path = "/home/user/Sumeet-/agri_data.json"
with open(out_path, "w") as f:
    json.dump(out, f, indent=2)

print(f"\n=== Agriculture: {len(agri_master)} colleges ===")
print(f"=== Professional/Vet: {len(prof_master)} colleges ===")

# Verification
print("\n--- Agriculture sample ---")
for code in list(agri_master.keys())[:3]:
    c = agri_master[code]
    print(f"  {code}: {c['name']} | {c['location']}")
    for bk, bv in c["branches"].items():
        rnds = list(bv["rounds"].keys())
        gm_r2 = bv["rounds"].get("2024_R2", {}).get("GM")
        print(f"    {bk} ({bv['name'][:35]}) | rounds={rnds} | 2024_R2 GM={gm_r2}")

print("\n--- Professional sample ---")
for code in list(prof_master.keys())[:6]:
    c = prof_master[code]
    print(f"  {code}: {c['name']}")
    for bk, bv in c["branches"].items():
        print(f"    {bk} ({bv['name'][:35]}) | GM={bv['data'].get('GM')} SCG={bv['data'].get('SCG')}")
