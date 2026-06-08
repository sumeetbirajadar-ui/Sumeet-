"""
KCET PDF Parser v4 — sequential token extraction.
Each branch row has exactly 24 values (numbers or "--") after the branch name.
We tokenize them in order and map to the 24 category columns.
"""

import re, json, os, subprocess

UPLOAD_DIR = "/root/.claude/uploads/b267c34e-056e-5d11-ae49-35130eef1d76"

FILES = {
    "2022_R1":  "7c93e18d-engg_cutoff_gen.pdf",
    "2022_R2":  "75e6b375-engg_cutoff_gen_2.pdf",
    "2022_EXT": "2b212d45-engg_cutoff_gen_1.pdf",
    "2023_R1":  "cca2c153-ENGG_CUTOFF_2023_GENenglish.pdf",
    "2023_R2":  "2f092070-ENGG_CUTOFF_2023_R2english.pdf",
    "2023_EXT": "c12f2ebd-ENR2_CUTGENenglish.pdf",
    "2024_R1":  "333ebb74-ENGG_CUTOFF_2024_GEN_R1english.pdf",
    "2024_R2":  "2fcae969-ENGG_CUTOFF_2024_GEN_R2_FIN.pdf",
    "2024_EXT": "1db1b88f-ENGG_CUTOFF_2024_GEN_EXT_RNDenglish.pdf",
}

CATS = ["1G","1K","1R","2AG","2AK","2AR","2BG","2BK","2BR",
        "3AG","3AK","3AR","3BG","3BK","3BR","GM","GMK","GMR",
        "SCG","SCK","SCR","STG","STK","STR"]
N_CATS = len(CATS)

BRANCH_FULL = {
    "AD":"CS - AI & Data Sc","AE":"Aeronautical Engg","AI":"AI & Machine Learning",
    "AR":"Architecture","AS":"Aerospace","AT":"Automation","AU":"Automobile",
    "BT":"Bio Technology","CA":"CS (AI/ML)","CB":"CS & Business Sys",
    "CD":"CS & Design","CE":"Civil","CH":"Chemical","CS":"Computer Science",
    "CV":"Civil","CY":"CS - Cyber Security","DS":"Data Science",
    "EC":"Electronics & Comm","EE":"Electrical & Electronics",
    "EI":"Electronics & Instr","ET":"Electronics Telecomm",
    "FD":"Food Technology","IE":"Information Science",
    "II":"Instrumentation Tech","IM":"Industrial Engg & Mgmt",
    "IN":"Instrumentation","IO":"Internet of Things",
    "MA":"Mechatronics","MD":"Medical Electronics","ME":"Mechanical",
    "MN":"Mining","PE":"Petroleum","PT":"Polymer",
    "RI":"Robotics & IoT","RO":"Robotics","SE":"Aerospace Engg",
    "ST":"Silk Technology","TX":"Textiles","TC":"Telecomm",
}

# Category codes that shouldn't be treated as branch codes
CAT_CODES = set(CATS) | {"1G","1K","1R","SCG","SCK","SCR","STG","STK","STR"}

def tokenize_data_portion(line):
    """
    From a branch data line, extract the numeric portion as a list of tokens.
    Each token is either an int or None (for "--" / "-" / blank).

    Strategy: find where the first number or "--" appears (after branch code+name),
    then extract all such tokens from that point.
    """
    # Find first occurrence of a standalone number or "--"
    # Numbers start after approximately column 20 in the layout
    # Use regex to find: from position where we see space+digits or space+--
    m = re.search(r'\s+((?:\d+|--)\s)', line)
    if not m:
        return []
    start = m.start()
    data_portion = line[start:]

    # Find all tokens: either digits or "--" or "-"
    tokens = re.findall(r'\d+|--(?!\w)|-(?!\w|-)', data_portion)

    result = []
    for t in tokens:
        t = t.strip()
        if t in ("--", "-"):
            result.append(None)
        elif t.isdigit():
            result.append(int(t))
    return result


def parse_pdf(filepath):
    r = subprocess.run(["pdftotext", "-layout", filepath, "-"], capture_output=True, text=True)
    text = r.stdout
    lines = text.splitlines()

    colleges = {}
    current_code = None
    # We accumulate tokens for a branch across continuation lines
    pending_bcode = None
    pending_tokens = []

    def flush_pending():
        nonlocal pending_bcode, pending_tokens
        if pending_bcode and current_code and len(pending_tokens) >= N_CATS:
            tokens = pending_tokens[:N_CATS]
            bd = {CATS[i]: tokens[i] for i in range(N_CATS)}
            col = colleges[current_code]
            if pending_bcode not in col["branches"]:
                col["branches"][pending_bcode] = bd
        pending_bcode = None
        pending_tokens = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # ── College header ──
        m = re.match(r'^\s*\d+\s+(E\d{3,4})\s+(.*)', line)
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

        # ── Branch header line (contains 1G ... STR) — skip ──
        if re.search(r'\b1G\b.*\bGM\b.*\bSCG\b', stripped):
            flush_pending()
            continue

        # ── Page/report header lines — skip ──
        if re.search(r'ENGINEERING CUTOFF|ALLOTMENT|AM$|PM$', stripped):
            continue

        # ── Branch data row ──
        m2 = re.match(r'^\s*([A-Z]{2,3})\s', line)
        if m2:
            bcode = m2.group(1)
            # Skip if this is a category code used in headers
            if bcode in ("1G","1K","1R","SCG","SCK","SCR","STG","STK","STR"):
                continue
            # Flush previous branch if different
            if bcode != pending_bcode:
                flush_pending()
                pending_bcode = bcode
                pending_tokens = []
            # Extract tokens from this line
            tokens = tokenize_data_portion(line)
            pending_tokens.extend(tokens)
            continue

        # ── Continuation line (branch name continuation or overflow data) ──
        if pending_bcode:
            # If line starts with a lowercase/mixed word (branch name continuation),
            # extract any numbers from it
            if not re.match(r'^\s*[A-Z]{2,3}\s', line) and not re.match(r'^\s*\d+\s+E', line):
                tokens = tokenize_data_portion(line)
                if tokens:
                    pending_tokens.extend(tokens)

    flush_pending()
    return colleges


# ── Run all files ─────────────────────────────────────────────────────
all_parsed = {}
for yr_key, fname in FILES.items():
    fpath = os.path.join(UPLOAD_DIR, fname)
    print(f"Parsing {yr_key} ...", end=" ", flush=True)
    colleges = parse_pdf(fpath)
    valid = sum(1 for c in colleges.values() if c["branches"])
    all_parsed[yr_key] = colleges
    print(f"{len(colleges)} colleges, {valid} with branches")

# ── Merge ─────────────────────────────────────────────────────────────
master = {}
for yr_key, colleges in all_parsed.items():
    for code, cdata in colleges.items():
        if not cdata["branches"]:
            continue
        if code not in master:
            master[code] = {"name": cdata["name"], "location": cdata["location"], "branches": {}}
        if len(cdata["name"]) > len(master[code]["name"]):
            master[code]["name"] = cdata["name"]
        if cdata["location"] and not master[code]["location"]:
            master[code]["location"] = cdata["location"]
        for bcode, bdata in cdata["branches"].items():
            if bcode not in master[code]["branches"]:
                master[code]["branches"][bcode] = {}
            master[code]["branches"][bcode][yr_key] = bdata

out_path = "/home/user/Sumeet-/kcet_data.json"
with open(out_path, "w") as f:
    json.dump(master, f, indent=2)

print(f"\n=== Saved {len(master)} colleges to {out_path} ===")

# ── Verify key colleges ────────────────────────────────────────────────
checks = [
    ("E001","CS","UVCE CS",        {"2024_R1":"GM~3649","2024_EXT":"GM~3649"}),
    ("E005","CS","RVCE CS",        {"2024_R1":"GM~290","2024_EXT":"GM~?"}),
    ("E006","CS","MSRIT CS",       {"2024_R1":"GM~1254"}),
    ("E003","EC","BMSCE EC",       {"2024_R1":"GM~1873"}),
]
for code, branch, label, expected in checks:
    print(f"\n--- {label} ({code}) ---")
    if code in master and branch in master[code]["branches"]:
        col = master[code]
        print(f"  {col['name']} | {col['location']}")
        bdata = col["branches"][branch]
        for yr in sorted(bdata.keys()):
            d = bdata[yr]
            print(f"  {yr}: GM={d.get('GM')}  SCG={d.get('SCG')}  STG={d.get('STG')}  2AG={d.get('2AG')}  GMR={d.get('GMR')}")
    else:
        avail = list(master.get(code,{}).get("branches",{}).keys())
        print(f"  Branch '{branch}' not found in {code}. Available: {avail}")
