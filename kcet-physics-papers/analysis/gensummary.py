# usage: python3 gensummary.py   (reads data2016..2026.py; writes book/summary.tex and KCET_2016-2026_NCERT_summary.md)
import importlib.util,collections
YEARS=range(2026,2015,-1)
def load(y):
    spec=importlib.util.spec_from_file_location('d',f'data{y}.py'); d=importlib.util.module_from_spec(spec); spec.loader.exec_module(d); return d
def base(t):
    t=t.split(' (')[0]
    for a,b in (('Doppler effect','Doppler effect'),('kinetic energy of rolling','rolling motion'),('radioactive decay law','radioactive decay law (half-life, mean life, activity)'),('sharpness','sharpness of resonance (Q-factor)'),('alpha-','alpha- and beta-decay'),('beta-','alpha- and beta-decay'),('Earth','Earth\'s magnetism (incl. angle of dip)'),('digital','digital electronics (logic gates)'),('Boolean','digital electronics (logic gates)'),('transistor','transistor (incl. amplifier)'),('antenna','communication systems (incl. antenna)'),('communication','communication systems (incl. antenna)'),('coercivity','hysteresis and coercivity'),('magnetic hysteresis','hysteresis and coercivity')):
        if t.startswith(a): return b
    return t
rows=[];topics=collections.Counter();tot=collections.Counter();perq={}
for y in YEARS:
    d=load(y); T=[l.split(None,3) if l.split()[0]!='X' else ['X',l.split(None,1)[1]] for l in d.TAGS.strip().splitlines()]
    D=[r for r in T if r[0]=='D']; A=[r for r in T if r[0]=='A']; X=[r for r in T if r[0]=='X']
    ex=sum(1 for r in D if len(r)>3 and r[3].startswith('Example')); er=sum(1 for r in D if len(r)>3 and r[3].startswith('Exercise'))
    for r in X: topics[base(r[1])]+=1
    an=len(D)+len(A)
    rows.append((y,len(D),len(D)-ex-er,ex,er,len(A),len(X),an))
    for k,v in zip(('D','txt','ex','er','A','X','an'),rows[-1][1:]): tot[k]+=v
    perq[y]=T
pct=lambda a,b:round(100*a/b) if b else 0
# --- LaTeX page
L=[r'''\clearpage\gdef\curyear{2016--2026 \textperiodcentered{} Summary}
\begin{center}{\pgfornament[width=5cm,color=gilt]{87}}\par
{\fontsize{20}{24}\selectfont\color{navy}\scshape KCET 2016--2026 \textperiodcentered{} Summary}\par
{\color{gilt}\pgfornament[width=5cm,color=gilt,symmetry=h]{87}}\end{center}\label{psummary}
\vspace{6pt}
{\small Every question of the eleven papers was checked one by one against the four 2026-27 NCERT Physics books (Class XI Part 1 \& 2, Class XII Part 1 \& 2). \textsc{Direct}: the answer is stated in the textbook (text, summary, table or figure), or the question is an NCERT solved Example or Exercise (same or changed numbers), or it needs only one printed formula. \textsc{Applied}: the concept is in the textbook but the question needs several steps or a new situation. \textsc{Deleted portion}: the topic was removed from the rationalised syllabus; such questions are not analysed. Percentages are of the analysed questions.}\par\medskip
\begin{center}\small
\begin{tabular}{@{}crrrrrrrr@{}}\toprule
Year & \multicolumn{4}{c}{Direct} & Applied & Analysed & Deleted & Direct\\
\cmidrule(lr){2-5}
 & Total & Text & Example & Exercise & & & portion & \%\\\midrule
''']
for y,D,t,e,r,A,X,an in rows: L.append(f'{y} & \\textbf{{{D}}} & {t} & {e} & {r} & {A} & {an} & {X} & {pct(D,an)}\\%\\\\')
L.append(r'\midrule'+f'\\textbf{{Total}} & \\textbf{{{tot["D"]}}} & {tot["txt"]} & {tot["ex"]} & {tot["er"]} & {tot["A"]} & {tot["an"]} & \\textbf{{{tot["X"]}}} & {pct(tot["D"],tot["an"])}\\%\\\\'+r'''\bottomrule
\end{tabular}\end{center}\medskip
{\small '''+f'''Of the 660 questions, \\textbf{{{tot["an"]}}} are within the present syllabus. Of these, \\textbf{{{tot["D"]}}} ({pct(tot["D"],tot["an"])}\\%) are direct from the NCERT textbook and {tot["A"]} ({pct(tot["A"],tot["an"])}\\%) are applications of NCERT concepts. \\textbf{{{tot["X"]}}} questions ({pct(tot["X"],660)}\\% of all 660) are from deleted portions; most of them are in the papers of 2016--2024, which were set before the rationalised syllabus was fully followed. KCET 2025 and 2026 have no question from a deleted portion.'''+r'''}\par\medskip
{\small\textbf{\color{crimson}Deleted portions asked, 2016--2026} (number of questions):\par\smallskip
\begin{multicols}{2}\raggedright
''')
L.append(';\\\\\n'.join(f'{t[0].upper()+t[1:]} ({n})' for t,n in sorted(topics.items(),key=lambda z:(-z[1],z[0].lower())))+'.')
L.append(r'''\end{multicols}}
''')
open('/home/user/Sumeet-/kcet-physics-papers/book/summary.tex','w').write('\n'.join(L))
# --- Markdown
M=['# KCET Physics 2016–2026: NCERT analysis summary','',
'Every question was checked one by one against the four official 2026-27 NCERT Physics textbooks (Class XI Parts 1–2, Class XII Parts 1–2, Reprint 2026-27, downloaded from ncert.nic.in). Each chapter was read in full and its examples, exercises, summary, tables and points to ponder were noted before the questions were tagged. No third-party analysis was used.','',
'- **Direct**: the answer is stated in the textbook (text, summary, table or figure), or the question is an NCERT solved Example or Exercise (same or changed numbers), or it needs only one printed formula.',
'- **Applied**: the concept is in the textbook, but the question needs several steps or a new situation.',
'- **Deleted portion**: the topic was removed from the rationalised syllabus (2022-23 onwards). These questions are only labelled and are not analysed.','',
'| Year | Direct | – text | – Example | – Exercise | Applied | Analysed | Deleted portion | Direct % |','|---|---|---|---|---|---|---|---|---|']
for y,D,t,e,r,A,X,an in rows: M.append(f'| {y} | **{D}** | {t} | {e} | {r} | {A} | {an} | {X} | {pct(D,an)}% |')
M.append(f'| **Total** | **{tot["D"]}** | {tot["txt"]} | {tot["ex"]} | {tot["er"]} | {tot["A"]} | {tot["an"]} | **{tot["X"]}** | {pct(tot["D"],tot["an"])}% |')
M+=['',f'Of the 660 questions, {tot["an"]} are within the present syllabus: {tot["D"]} ({pct(tot["D"],tot["an"])}%) direct and {tot["A"]} ({pct(tot["A"],tot["an"])}%) applied. **{tot["X"]} questions are from deleted portions.**','',
'## Deleted portions asked (number of questions)','']+[f'- {t[0].upper()+t[1:]}: {n}' for t,n in sorted(topics.items(),key=lambda z:(-z[1],z[0].lower()))]
M+=['','## Question-wise tags','','Format: type, printed NCERT page, chapter file (keph = Class XI, leph = Class XII; e.g. leph201 = XII Part 2 Ch 9), note. Chapter PDF: `https://ncert.nic.in/textbook/pdf/<file>.pdf`.','']
for y in YEARS:
    M.append(f'### KCET {y}'); M.append('')
    M.append(' · '.join(f'Q{i} {"Deleted ("+r[1]+")" if r[0]=="X" else r[0]+" p"+r[1]+" "+r[2]+((" "+r[3]) if len(r)>3 else "")}' for i,r in enumerate(perq[y],1)))
    M.append('')
M.append('Difficulty and similar-PYQ sources for applied questions are in `data<year>.py` and in the book.')
open('KCET_2016-2026_NCERT_summary.md','w').write('\n'.join(M)+'\n')
print(rows,dict(tot))
