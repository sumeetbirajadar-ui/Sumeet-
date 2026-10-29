# usage: python3 gensummary.py   (reads data2016..2026.py; writes book/summary.tex and NEET_2016-2026_NCERT_summary.md)
import importlib.util,collections,re
B='/home/user/Sumeet-/neet-physics-papers/book/'
YEARS=range(2026,2015,-1)
def load(y):
    spec=importlib.util.spec_from_file_location('d',f'data{y}.py'); d=importlib.util.module_from_spec(spec); spec.loader.exec_module(d); return d
def base(t):
    t=t.split(' (')[0]
    for a,b in (('Doppler effect','Doppler effect'),('kinetic energy of rolling','rolling motion'),('radioactive decay law','radioactive decay law (half-life, mean life, activity)'),('sharpness','sharpness of resonance (Q-factor)'),('alpha-','alpha- and beta-decay'),('beta-','alpha- and beta-decay'),('Earth','Earth\'s magnetism (incl. angle of dip)'),('digital','digital electronics (logic gates)'),('Boolean','digital electronics (logic gates)'),('transistor','transistor (incl. amplifier)'),('antenna','communication systems (incl. antenna)'),('communication','communication systems (incl. antenna)'),('coercivity','hysteresis and coercivity'),('magnetic hysteresis','hysteresis and coercivity'),('resolving power','resolving power (telescope, microscope)')):
        if t.startswith(a): return b
    return t
rows=[];topics=collections.Counter();tot=collections.Counter();perq={};xby={}
NQ=0;NFIG=0
for y in YEARS:
    s=open(B+f'y{y}.tex').read().split('%%BEGIN-ANALYSIS')[0]
    qs=s.split('\\QQ{')[1:]; NQ+=len(qs); NFIG+=sum(1 for q in qs if '\\fig{' in q or 'tikzpicture' in q or 'circuitikz' in q or '\\gaxes' in q)
for y in YEARS:
    d=load(y); T=[l.split(None,3) if l.split()[0]!='X' else ['X',l.split(None,1)[1]] for l in d.TAGS.strip().splitlines()]
    D=[r for r in T if r[0]=='D']; A=[r for r in T if r[0]=='A']; X=[r for r in T if r[0]=='X']
    ex=sum(1 for r in D if len(r)>3 and r[3].startswith('Example')); er=sum(1 for r in D if len(r)>3 and r[3].startswith('Exercise'))
    for r in X: topics[base(r[1])]+=1
    an=len(D)+len(A)
    rows.append((y,len(D),len(D)-ex-er,ex,er,len(A),len(X),an))
    for k,v in zip(('D','txt','ex','er','A','X','an'),rows[-1][1:]): tot[k]+=v
    perq[y]=T; xby[y]=len(X)
pct=lambda a,b:round(100*a/b) if b else 0
# --- LaTeX page
L=[r'''\clearpage\gdef\curyear{2016--2026 \textperiodcentered{} Summary}
\begin{center}{\pgfornament[width=5cm,color=gilt]{87}}\par
{\fontsize{20}{24}\selectfont\color{navy}\scshape NEET 2016--2026 \textperiodcentered{} Summary}\par
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
{\small '''+f'''Of the {NQ} questions, \\textbf{{{tot["an"]}}} are within the present syllabus. Of these, \\textbf{{{tot["D"]}}} ({pct(tot["D"],tot["an"])}\\%) are direct from the NCERT textbook and {tot["A"]} ({pct(tot["A"],tot["an"])}\\%) are applications of NCERT concepts. \\textbf{{{tot["X"]}}} questions ({pct(tot["X"],NQ)}\\% of all {NQ}) are from deleted portions; {sum(xby[y] for y in range(2016,2022))} of them are in the papers of 2016--2021, set before the rationalised syllabus, and only {xby[2025]+xby[2026]} in 2025 and 2026.'''+r'''}\par\medskip
{\small\textbf{\color{crimson}Deleted portions asked, 2016--2026} (number of questions):\par\smallskip
\begin{multicols}{2}\raggedright
''')
L.append(';\\\\\n'.join(f'{t[0].upper()+t[1:]} ({n})' for t,n in sorted(topics.items(),key=lambda z:(-z[1],z[0].lower())))+'.')
L.append(r'''\end{multicols}}
''')
# --- most repeated topics (present syllabus), from keys/k<year>.txt topic labels
CH={'keph101':'Units \\& Measurement','keph102':'Motion in a Straight Line','keph103':'Motion in a Plane','keph104':'Laws of Motion','keph105':'Work, Energy \\& Power','keph106':'Rotational Motion','keph107':'Gravitation','keph201':'Mech.\\ Prop.\\ of Solids','keph202':'Mech.\\ Prop.\\ of Fluids','keph203':'Thermal Prop.\\ of Matter','keph204':'Thermodynamics','keph205':'Kinetic Theory','keph206':'Oscillations','keph207':'Waves','leph101':'Electric Charges \\& Fields','leph102':'Electrostatic Potential \\& Capacitance','leph103':'Current Electricity','leph104':'Moving Charges \\& Magnetism','leph105':'Magnetism \\& Matter','leph106':'Electromagnetic Induction','leph107':'Alternating Current','leph108':'Electromagnetic Waves','leph201':'Ray Optics','leph202':'Wave Optics','leph203':'Dual Nature','leph204':'Atoms','leph205':'Nuclei','leph206':'Semiconductor Electronics'}
MERGE={"Conductors, Gauss's law and electric flux":"Gauss's law and electric flux"}
tq=collections.Counter();ty=collections.defaultdict(set);tch=collections.defaultdict(collections.Counter);tqs=collections.defaultdict(list)
for y in YEARS:
    for (n,rest),r in zip((l.split(None,1) for l in open(f'keys/k{y}.txt').read().strip().splitlines()),perq[y]):
        t=rest.split(None,1)[1].split(' | ')[0]; t=MERGE.get(t,t)
        if t=='X': continue
        tq[t]+=1; ty[t].add(y); tch[t][r[2]]+=1; tqs[t].append(f"{str(y)[2:]}/{n}")
top=sorted(tq,key=lambda t:(-tq[t],-len(ty[t]),t))[:15]
yrs=lambda t:' '.join(("\\textbf{"+str(y)[2:]+"}") if y in ty[t] else r'{\color{gray!45}'+str(y)[2:]+'}' for y in range(2016,2027))
L.append(r'''\clearpage
\begin{center}{\pgfornament[width=5cm,color=gilt]{87}}\par
{\fontsize{20}{24}\selectfont\color{navy}\scshape The 15 Most Repeated Topics}\par
{\color{gilt}\pgfornament[width=5cm,color=gilt,symmetry=h]{87}}\end{center}\label{ptopics}
\vspace{4pt}
{\small Every in-syllabus question of 2016--2026 was given one topic label while the answer keys were solved. The table counts the questions on each topic over the eleven papers (deleted portions left out; ties are ordered by the number of years in which the topic appeared). Years in bold are the years the topic was asked.}\par\medskip
{\small\renewcommand{\arraystretch}{1.3}
\begin{tabularx}{\linewidth}{@{}r@{\hspace{6pt}}>{\raggedright\arraybackslash}Xlcc@{\hspace{6pt}}l@{}}\toprule
\# & Topic & NCERT chapter & Qs & Years & 2016 $\rightarrow$ 2026\\\midrule
''')
for i,t in enumerate(top,1):
    f=tch[t].most_common(1)[0][0]
    L.append(f'{i} & {t} & {CH[f]} ({"XI" if f.startswith("keph") else "XII"}) & \\textbf{{{tq[t]}}} & {len(ty[t])} & {{\\scriptsize {yrs(t)}}}\\\\')
L.append(r'''\bottomrule\end{tabularx}}\par\medskip
{\small These 15 topics carry \textbf{'''+str(sum(tq[t] for t in top))+r'''} of the '''+str(tot["an"])+r''' in-syllabus questions ('''+str(pct(sum(tq[t] for t in top),tot["an"]))+r'''\%), about '''+str(round(sum(tq[t] for t in top)/11))+r''' questions in every paper. '''+(lambda n:f'{"None One Two Three Four Five Six Seven Eight Nine Ten Eleven Twelve Thirteen Fourteen Fifteen".split()[n]} of them are Class XI topics and {15-n} are Class XII topics: NEET weighs the two years almost equally.')(sum(1 for t in top if tch[t].most_common(1)[0][0].startswith('keph')))+r'''}\par\medskip
{\small\textbf{\color{crimson}Questions asked again, almost word for word} (in the present syllabus)\par\smallskip
\begin{tabularx}{\linewidth}{@{}l>{\raggedright\arraybackslash}X@{}}
2016 Q26, 2019 Q45, 2021 Q26, 2022 Q42 & field inside and outside a thick wire (Example 4.7)\\
2019 Q16, 2020 Q143, 2025 Q32 & weight of a body inside or above the earth (Exercises 7.15, 7.16)\\
2016 Q38, 2017 Q168, 2023 Q11 & series limits of the hydrogen spectrum\\
2021 Q24 $\approx$ 2022 Q13 & Galileo's law of odd numbers (Example 2.5)\\
2018 Q10 $\approx$ 2021 Q18 & telescope objective: large focal length and large aperture\\
2018 Q11 $\approx$ 2019 Q27 & kinetic and total energy in a Bohr orbit ($K=-E$)\\
2020 Q148 $\approx$ 2022 Q14 & centre of mass of two masses on a light rod\\
2020 Q154 $\approx$ 2024 Q38 & current through a capacitor on 50\,Hz ac (Example 7.4)\\
2020 Q155 $\approx$ 2026 Q2 & mean free path $l=1/(\sqrt2\,n\pi d^2)$\\
\end{tabularx}}\par
''')
# --- preparation plan, built from the numbers above
cls=collections.Counter();dif=collections.Counter();sim=0
for y in YEARS:
    d=load(y); DF=d.DIFF.split()
    for i,r in enumerate(perq[y],1):
        if r[0]=='X': continue
        cls['XI' if r[2].startswith('keph') else 'XII']+=1; dif[DF[i-1]]+=1
chc=collections.Counter(r[2] for y in YEARS for r in perq[y] if r[0]!='X')
topch=', '.join(f'{CH[f]} ({n})' for f,n in chc.most_common(6))
L.append(r'''\clearpage
\begin{center}{\pgfornament[width=5cm,color=gilt]{87}}\par
{\fontsize{20}{24}\selectfont\color{navy}\scshape How to Prepare for NEET Physics}\par
{\color{gilt}\pgfornament[width=5cm,color=gilt,symmetry=h]{87}}\end{center}\label{pplan}
\vspace{2pt}
{\small Every point below comes from the question-by-question analysis of the eleven papers in this book.}\par\medskip
\begin{multicols}{2}
\textbf{\color{crimson}1. What the papers show}\par\smallskip
\begin{itemize}[leftmargin=1.1em,itemsep=2pt,topsep=0pt]
\item \textbf{'''+str(pct(tot["D"],tot["an"]))+r'''\%} of the in-syllabus questions ('''+str(tot["D"])+r''' of '''+str(tot["an"])+r''') are direct from the NCERT textbook; the rest ('''+str(tot["A"])+r''') apply NCERT concepts.
\item '''+str(tot["ex"])+r''' questions are NCERT solved Examples and '''+str(tot["er"])+r''' are NCERT Exercises, often with the same numbers.
\item Class XII gives \textbf{'''+str(pct(cls["XII"],tot["an"]))+r'''\%} of the questions, Class XI '''+str(pct(cls["XI"],tot["an"]))+r'''\%.
\item Heaviest chapters (questions in 11 years): '''+topch+r'''.
\item Difficulty: '''+str(dif["E"])+r''' easy, '''+str(dif["M"])+r''' moderate, only '''+str(dif["H"])+r''' hard. NEET rewards clear concepts and careful arithmetic more than tricks.
\item '''+str(tot["X"])+r''' old questions are on deleted topics, but only '''+str(xby[2025]+xby[2026])+r''' in 2025 and 2026. The rationalised NCERT is the syllabus now.
\item Questions do come back (see the previous page), so the old papers are worth solving fully.
\end{itemize}\medskip
\textbf{\color{crimson}2. What to study from}\par\smallskip
\begin{enumerate}[leftmargin=1.3em,itemsep=2pt,topsep=0pt]
\item \textbf{NCERT Physics 2026-27} (XI Parts 1--2, XII Parts 1--2): the main book. Read every line, including the boxes, tables, figures, Summary and Points to Ponder.
\item \textbf{NCERT solved Examples and Exercises}: work all of them by hand. They are the single biggest source of numerical questions.
\item \textbf{NCERT Exemplar Physics}: for the applied questions; the MCQ and short-answer sections are enough.
\item \textbf{NCERT Lab Manual}: NEET 2020, 2021, 2025 and 2026 asked screw-gauge, vernier and optical-bench questions from it.
\item \textbf{NEET papers 2016--2026} (this book), solved under time, with the answer keys.
\item One standard reference for extra MCQ practice only after NCERT is complete. Do not start a new book in the last month.
\end{enumerate}\medskip
\textbf{\color{crimson}3. How to work}\par\smallskip
\begin{itemize}[leftmargin=1.1em,itemsep=2pt,topsep=0pt]
\item Make a one-page formula and fact sheet for each chapter while reading NCERT. Revise from these sheets.
\item Keep an error notebook: every wrong or guessed question, the reason, and the right idea. Read it every week.
\item Practise the graph, circuit and ray-diagram questions; '''+f'about one question in {round(NQ/NFIG)} has a figure ({NFIG} of {NQ}).'+r'''
\item Learn units, dimensions, standard values ($e$, $h$, $c$, $m_e$, 13.6\,eV, $1\,\mathrm u = 931.5$\,MeV) and the ratio and proportion short cuts; they save time in nearly every paper.
\item Check every old question against the present syllabus; skip the ones marked \textsc{Deleted Portion}.
\end{itemize}
\columnbreak
\textbf{\color{crimson}4. Plan of action}\par\smallskip
{\small\renewcommand{\arraystretch}{1.25}
\begin{tabularx}{\linewidth}{@{}l>{\raggedright\arraybackslash}X@{}}\toprule
Phase & Work\\\midrule
1. Foundation & NCERT chapter by chapter, Class XII (about half the marks): text, Examples, Exercises, formula sheet.\\
2. Class XI & The same for Class XI (the other half), with more time on Units and Measurement, Rotational Motion, Thermodynamics, Kinetic Theory and Oscillations.\\
3. Topic drills & Solve this book topic by topic; start with the 15 most repeated topics. Then Exemplar MCQs on the same topics.\\
4. Full papers & One complete NEET Physics section every two days: 45 questions in 50 minutes. Check with the key and update the error notebook.\\
5. Last 2 weeks & Only revision: formula sheets, NCERT Summaries, error notebook, and a paper on alternate days. No new material.\\
\bottomrule\end{tabularx}}\par\medskip
\textbf{\color{crimson}5. In the examination hall}\par\smallskip
\begin{itemize}[leftmargin=1.1em,itemsep=2pt,topsep=0pt]
\item NEET gives about one minute per question over all three subjects; aim to finish Physics in 50 minutes. First pass: answer every direct NCERT question at once (about a third of the paper).
\item Second pass: the numericals; leave any question that takes more than two minutes and come back.
\item Each correct answer gives 4 marks and each wrong answer costs 1. Answer a doubtful question only when two options can be ruled out.
\item Fill the OMR as you go, not at the end.
\end{itemize}\medskip
\textbf{\color{crimson}6. A weekly rhythm}\par\smallskip
{\small Five days of NCERT and practice, one day of a timed paper, one day of revision and the error notebook. A steady 2--3 hours of Physics a day, kept up for months, beats long sessions before the exam.}\par
\end{multicols}
''')
open(B+'summary.tex','w').write('\n'.join(L))
# --- Markdown
M=['# NEET (UG) Physics 2016–2026: NCERT analysis summary','',
'Every question was checked one by one against the four official 2026-27 NCERT Physics textbooks (Class XI Parts 1–2, Class XII Parts 1–2, Reprint 2026-27, downloaded from ncert.nic.in). Each chapter was read in full and its examples, exercises, summary, tables and points to ponder were noted before the questions were tagged. No third-party analysis was used.','',
'- **Direct**: the answer is stated in the textbook (text, summary, table or figure), or the question is an NCERT solved Example or Exercise (same or changed numbers), or it needs only one printed formula.',
'- **Applied**: the concept is in the textbook, but the question needs several steps or a new situation.',
'- **Deleted portion**: the topic was removed from the rationalised syllabus (2022-23 onwards). These questions are only labelled and are not analysed.','',
'| Year | Direct | – text | – Example | – Exercise | Applied | Analysed | Deleted portion | Direct % |','|---|---|---|---|---|---|---|---|---|']
for y,D,t,e,r,A,X,an in rows: M.append(f'| {y} | **{D}** | {t} | {e} | {r} | {A} | {an} | {X} | {pct(D,an)}% |')
M.append(f'| **Total** | **{tot["D"]}** | {tot["txt"]} | {tot["ex"]} | {tot["er"]} | {tot["A"]} | {tot["an"]} | **{tot["X"]}** | {pct(tot["D"],tot["an"])}% |')
M+=['',f'Of the {NQ} questions, {tot["an"]} are within the present syllabus: {tot["D"]} ({pct(tot["D"],tot["an"])}%) direct and {tot["A"]} ({pct(tot["A"],tot["an"])}%) applied. **{tot["X"]} questions are from deleted portions.**','',
'## Deleted portions asked (number of questions)','']+[f'- {t[0].upper()+t[1:]}: {n}' for t,n in sorted(topics.items(),key=lambda z:(-z[1],z[0].lower()))]
M+=['','## Question-wise tags','','Format: type, printed NCERT page, chapter file (keph = Class XI, leph = Class XII; e.g. leph201 = XII Part 2 Ch 9), note. Chapter PDF: `https://ncert.nic.in/textbook/pdf/<file>.pdf`.','']
for y in YEARS:
    M.append(f'### NEET {y}'); M.append('')
    QN=[l.split()[0] for l in open(f'keys/k{y}.txt')]
    M.append(' · '.join(f'Q{QN[i-1]} {"Deleted ("+r[1]+")" if r[0]=="X" else r[0]+" p"+r[1]+" "+r[2]+((" "+r[3]) if len(r)>3 else "")}' for i,r in enumerate(perq[y],1)))
    M.append('')
M.append('Difficulty levels are in `data<year>.py` and in the book.')
M+=['','## The 15 most repeated topics (present syllabus, 2016–2026)','','| # | Topic | NCERT chapter | Questions | Years asked |','|---|---|---|---|---|']+[f'| {i} | {t} | {CH[tch[t].most_common(1)[0][0]].replace(chr(92)+"&","&").replace(chr(92)+" "," ")} | {tq[t]} | {len(ty[t])} |' for i,t in enumerate(top,1)]
M+=['',f'These 15 topics carry {sum(tq[t] for t in top)} of the {tot["an"]} in-syllabus questions. Asked again: Example 4.7 (2016, 2019, 2021, 2022); weight inside/above the earth (2019, 2020, 2025); series limits (2016, 2017, 2023); Example 2.5 (2021, 2022); 2018 Q10 ≈ 2021 Q18; 2018 Q11 ≈ 2019 Q27; 2020 Q148 ≈ 2022 Q14; 2020 Q154 ≈ 2024 Q38; 2020 Q155 ≈ 2026 Q2.','',
'## How to prepare (from this analysis)','',
f'- {pct(tot["D"],tot["an"])}% of the in-syllabus questions are direct from NCERT; {tot["ex"]} are NCERT Examples and {tot["er"]} NCERT Exercises. Class XII gives {pct(cls["XII"],tot["an"])}% of the questions.',
'- Study from: NCERT 2026-27 textbooks (every line, Examples, Exercises, Summary, Points to Ponder); NCERT Exemplar MCQs; NCERT Lab Manual; the NEET papers 2016–2026 with keys.',
'- Phases: Class XII NCERT → Class XI NCERT → topic drills starting with the 15 most repeated topics → full timed Physics sections (45 questions, 50 minutes) → last two weeks revision only.',
'- Keep a one-page formula sheet per chapter and an error notebook; skip questions marked Deleted Portion.']
open('NEET_2016-2026_NCERT_summary.md','w').write('\n'.join(M)+'\n')
print(rows,dict(tot))
