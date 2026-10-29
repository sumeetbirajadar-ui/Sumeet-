# usage: python3 genchapter.py   (run after genyear.py for every year and after gensummary.py)
# Builds the chapter-wise book from the year files: book/c_chapters.tex, book/ctoc.tex, book/ccover.tex
# Each question keeps its year-book source (stem, options, NCERT tag); questions are regrouped by the
# NCERT chapter in TAGS, by topic (keys/k<year>.txt) inside a chapter, newest year first inside a topic.
import re,collections,importlib.util
B='/home/user/Sumeet-/neet-physics-papers/book/'
YEARS=range(2026,2015,-1)
CH=[('keph101','Units and Measurements'),('keph102','Motion in a Straight Line'),('keph103','Motion in a Plane'),('keph104','Laws of Motion'),('keph105','Work, Energy and Power'),('keph106','System of Particles and Rotational Motion'),('keph107','Gravitation'),('keph201','Mechanical Properties of Solids'),('keph202','Mechanical Properties of Fluids'),('keph203','Thermal Properties of Matter'),('keph204','Thermodynamics'),('keph205','Kinetic Theory'),('keph206','Oscillations'),('keph207','Waves'),
    ('leph101','Electric Charges and Fields'),('leph102','Electrostatic Potential and Capacitance'),('leph103','Current Electricity'),('leph104','Moving Charges and Magnetism'),('leph105','Magnetism and Matter'),('leph106','Electromagnetic Induction'),('leph107','Alternating Current'),('leph108','Electromagnetic Waves'),('leph201','Ray Optics and Optical Instruments'),('leph202','Wave Optics'),('leph203','Dual Nature of Radiation and Matter'),('leph204','Atoms'),('leph205','Nuclei'),('leph206','Semiconductor Electronics')]
CHN=dict(CH)
chap=lambda f:int(f[-2:])+(7 if f.startswith('keph2') else 8 if f.startswith('leph2') else 0)
cls=lambda f:'XI' if f.startswith('keph') else 'XII'
MERGE={"Conductors, Gauss's law and electric flux":"Gauss's law and electric flux"}
def base(t):   # same grouping of deleted topics as gensummary.py
    t=t.split(' (')[0]
    for a,b in (('Doppler effect','Doppler effect'),('kinetic energy of rolling','rolling motion'),('radioactive decay law','radioactive decay law (half-life, mean life, activity)'),('sharpness','sharpness of resonance (Q-factor)'),('alpha-','alpha- and beta-decay'),('beta-','alpha- and beta-decay'),('Earth','Earth\'s magnetism (incl. angle of dip)'),('digital','digital electronics (logic gates)'),('Boolean','digital electronics (logic gates)'),('transistor','transistor (incl. amplifier)'),('antenna','communication systems (incl. antenna)'),('communication','communication systems (incl. antenna)'),('coercivity','hysteresis and coercivity'),('magnetic hysteresis','hysteresis and coercivity'),('resolving power','resolving power (telescope, microscope)')):
        if t.startswith(a): return b
    return t
def load(y):
    spec=importlib.util.spec_from_file_location('d',f'data{y}.py'); d=importlib.util.module_from_spec(spec); spec.loader.exec_module(d); return d
def grp(s,m):
    while s[m]!='{': m+=1
    e=m+1;dd=1
    while dd: c=s[e]; dd+=(c=='{')-(c=='}'); e+=1
    return e
# ---- collect every question
Q=[]
for y in YEARS:
    s=open(B+f'y{y}.tex').read(); num='\\numoptstrue' in s; d=load(y)
    T=[l.split(None,3) if l.split()[0]!='X' else ['X',l.split(None,1)[1]] for l in d.TAGS.strip().splitlines()]
    K=[l.split(' | ') for l in open(f'keys/k{y}.txt').read().strip().splitlines()]
    DF=d.DIFF.split(); i=0; n=0
    while True:
        j=s.find('\\QQ{',i)
        if j<0: break
        e=grp(s,grp(s,j)); n+=1
        t=T[n-1]; k=K[n-1]; topic=k[0].split(None,2)[2]; topic=MERGE.get(topic,topic)
        Q.append(dict(y=y,n=int(k[0].split()[0]),src=s[j:e],num=num,typ=t[0],file=t[2] if t[0]!='X' else None,page=int(t[1]) if t[0]!='X' else 0,
             tnote=t[3] if len(t)>3 else '',dtopic=base(t[1]) if t[0]=='X' else None,topic=topic,ans=k[0].split()[1],
             knote=k[1] if len(k)>1 else '',diff=DF[n-1]))
        i=e
    assert n==len(K)==len(T)==len(DF),(y,n)
lab=lambda q,a:'--' if a=='-' else (a if q['num'] else 'ABCD'[int(a)-1])
def fixnote(q,t):
    return t if q['num'] else re.sub(r'([Oo]ptions?) \((\d)\)',lambda m:m.group(1)+' ('+lab(q,m.group(2))+')',t)
yrs=lambda ys:' '.join(("\\textbf{"+str(y)[2:]+"}") if y in ys else r'{\color{gray!45}'+str(y)[2:]+'}' for y in range(2016,2027))
def question(q,i):
    flag=r'\numoptstrue' if q['num'] else r'\numoptsfalse'
    return flag+'\n'+q['src'].replace('\\QQ{','\\QQ{\\qsrc{'+str(q['y'])+'}{'+str(q['n'])+'}',1)+'\n'
def keyblock(title,qs):
    cells=[]
    for i,q in enumerate(qs,1):
        c=r'\textbf{'+str(i)+r'}\,('+lab(q,q['ans'])+')'+(r'$^{*}$' if q['knote'] else '')
        cells.append(c)
    while len(cells)%8: cells.append('')
    rows='\\\\\n'.join(' & '.join(cells[r:r+8]) for r in range(0,len(cells),8))
    notes=[(i,q) for i,q in enumerate(qs,1) if q['knote']]
    return (r'''\par\needspace{12\baselineskip}\vspace{12pt}
\begin{center}{\pgfornament[width=3.2cm,color=gilt]{87}}\par
{\large\color{navy}\scshape '''+title+r''' \textperiodcentered{} Answer Key}\end{center}
{\small\setlength{\tabcolsep}{1pt}\renewcommand{\arraystretch}{1.5}
\begin{tabularx}{\linewidth}{@{}*{8}{>{\centering\arraybackslash}X}@{}}\toprule
'''+rows+r'''\\\bottomrule\end{tabularx}}\par\smallskip
{\footnotesize Answers of 2021, 2022, 2023, 2025 and 2026 are from the official NTA final keys (checked by the editor); answers of 2016--2020 and 2024 were solved by the editor.'''+(r' --: question dropped by NTA.' if any(q['ans']=='-' for q in qs) else '')+(r' $^{*}$: see note.' if notes else '')+'\n'
      +''.join(r'\par\smallskip\textbf{'+str(i)+r'.} (NEET '+str(q['y'])+' Q'+str(q['n'])+') '+fixnote(q,q['knote'])+'\n' for i,q in notes)+'}\\par\n')
pct=lambda a,b:round(100*a/b) if b else 0
ANALYSED=[q for q in Q if q['typ']!='X']
def summary(f,qs,topics):
    name=CHN[f]; N=len(qs); D=[q for q in qs if q['typ']=='D']; A=[q for q in qs if q['typ']=='A']
    ex=[q for q in D if q['tnote'].startswith('Example')]; er=[q for q in D if q['tnote'].startswith('Exercise')]
    idx={(q['y'],q['n']):i for i,q in enumerate(qs,1)}
    byy=collections.Counter(q['y'] for q in qs)
    dc=collections.Counter(q['diff'] for q in qs)
    hard=[q for q in qs if q['diff']=='H']
    pages=collections.Counter(q['page'] for q in qs)
    rep=[(p,c) for p,c in pages.most_common() if c>=3][:6]
    allrank=sorted({q['file'] for q in ANALYSED},key=lambda g:-sum(1 for q in ANALYSED if q['file']==g))
    rank=allrank.index(f)+1
    ty=lambda t:{q['y'] for q in topics[t]}
    every=[t for t in topics if len(ty(t))>=8]
    top=max(topics,key=lambda t:(len(topics[t]),len(ty(t))))
    lst=lambda xs:', '.join(xs)
    ref=lambda q:f"{idx[(q['y'],q['n'])]}"
    trows='\n'.join(f"{t} & \\textbf{{{len(topics[t])}}} & {sum(1 for q in topics[t] if q['typ']=='D')} & {len(ty(t))} & {{\\scriptsize {yrs(ty(t))}}}\\\\" for t in topics)
    yrow=' & '.join(str(byy.get(y,0)) for y in range(2016,2027))
    pts=[]
    pts.append(f"{N} questions in 11 papers, about {N/11:.1f} per paper; rank {rank} of 28 chapters by number of questions.")
    pts.append(f"Most asked topic: \\textbf{{{top}}} ({len(topics[top])} questions, in {len(ty(top))} of the 11 years).")
    if every: pts.append("Asked in 8 or more of the 11 years: "+lst(every)+".")
    if ex or er: pts.append(f"{len(ex)+len(er)} questions are NCERT solved Examples or Exercises: "+lst([f"{q['tnote'].split(' (')[0]} (Q {ref(q)})" for q in ex+er])+". Work these by hand.")
    if rep: pts.append("NCERT pages that gave three or more questions: "+lst([f"page {p} ({c} questions)" for p,c in rep])+". Read these pages line by line.")
    pts.append(f"Difficulty: {dc['E']} easy, {dc['M']} moderate, {dc['H']} hard"+(f" (hard: Q {lst([ref(q) for q in hard])})" if hard else '')+".")
    if A: pts.append(f"{len(A)} applied questions: practise these after the NCERT Examples and Exercises of the chapter.")
    return r'''\par\needspace{18\baselineskip}\vspace{14pt}
\begin{center}{\pgfornament[width=3.2cm,color=gilt]{87}}\par
{\large\color{navy}\scshape Chapter Summary \textperiodcentered{} '''+name+r'''}\end{center}
{\small\setlength{\tabcolsep}{3.5pt}
\begin{tabular*}{\linewidth}{@{\extracolsep{\fill}}l*{11}{c}c@{}}\toprule
Year & 2016 & 2017 & 2018 & 2019 & 2020 & 2021 & 2022 & 2023 & 2024 & 2025 & 2026 & Total\\\midrule
Questions & '''+yrow+r''' & \textbf{'''+str(N)+r'''}\\\bottomrule\end{tabular*}}\par\medskip
{\small\textbf{\color{crimson}Topic-wise} (in textbook order)\par\smallskip
\begin{tabularx}{\linewidth}{@{}>{\raggedright\arraybackslash}Xrrrl@{}}\toprule
Topic & Qs & Direct & Years & 2016 $\rightarrow$ 2026\\\midrule
'''+trows+r'''
\bottomrule\end{tabularx}}\par\medskip
\begin{minipage}[t]{0.34\linewidth}{\small\textbf{\color{crimson}Direct vs Applied}\par\smallskip
\begin{tabular}{@{}lrr@{}}\toprule
Direct from NCERT & \textbf{'''+str(len(D))+r'''} & '''+str(pct(len(D),N))+r'''\%\\
\quad text, table, figure & '''+str(len(D)-len(ex)-len(er))+r''' &\\
\quad solved Example & '''+str(len(ex))+r''' &\\
\quad Exercise & '''+str(len(er))+r''' &\\
Applied & \textbf{'''+str(len(A))+r'''} & '''+str(pct(len(A),N))+r'''\%\\\midrule
Easy / Mod. / Hard & \multicolumn{2}{r}{'''+f"{dc['E']} / {dc['M']} / {dc['H']}"+r'''}\\\bottomrule
\end{tabular}}\end{minipage}\hfill
\begin{minipage}[t]{0.63\linewidth}{\small\textbf{\color{crimson}What to focus on}\par\smallskip
\begin{itemize}[leftmargin=1.1em,itemsep=1pt,topsep=0pt]
'''+'\n'.join('\\item '+p for p in pts)+r'''
\end{itemize}}\end{minipage}\par
'''
# ---- chapters
out=[];toc=[];chrows=[]
for f,name in CH:
    qs=[q for q in ANALYSED if q['file']==f]
    if not qs: continue
    topics=collections.defaultdict(list)
    for q in qs: topics[q['topic']].append(q)
    order=sorted(topics,key=lambda t:(min(q['page'] for q in topics[t]),t))
    topics={t:sorted(topics[t],key=lambda q:(-q['y'],q['n'])) for t in order}
    flat=[q for t in topics for q in topics[t]]
    lbl='c'+f
    out.append(r'\chapterpaper{Class '+cls(f)+r' \textperiodcentered{} Chapter '+str(chap(f))+'}{'+name+'}{'+str(len(flat))+' questions \\textperiodcentered{} '+str(len(topics))+' topics \\textperiodcentered{} NEET 2016--2026}{'+lbl+'}{'+cls(f)+'.'+str(chap(f))+' '+name+'}\n\\begin{multicols}{2}\n')
    i=0
    for t in topics:
        out.append('\\topichead{'+t+'}{'+str(len(topics[t]))+'}\n')
        for q in topics[t]: i+=1; out.append(question(q,i))
    out.append('\\end{multicols}\n'+keyblock(name,flat)+summary(f,flat,topics))
    toc.append((cls(f),chap(f),name,lbl,len(flat)))
    chrows.append((f,name,flat))
# ---- deleted portions
X=[q for q in Q if q['typ']=='X']
dt=collections.defaultdict(list)
for q in X: dt[q['dtopic']].append(q)
dorder=sorted(dt,key=lambda t:(-len(dt[t]),t.lower()))
out.append(r'\chapterpaper{Outside the 2026-27 Syllabus}{Deleted Portions}{'+str(len(X))+r' questions \textperiodcentered{} topics removed from the rationalised NCERT}{cdeleted}{Deleted Portions}'+'\n')
out.append(r'''{\small These questions were asked on topics that are no longer in the 2026-27 NCERT textbooks; '''+str(sum(1 for q in X if q['y']>=2025))+r''' of them are from 2025 and 2026. They are kept here for completeness; a student following the present syllabus can skip this section. Topics are in order of how often they were asked.}\par\medskip
\begin{multicols}{2}
''')
dflat=[]
for t in dorder:
    out.append('\\topichead{'+t[0].upper()+t[1:]+'}{'+str(len(dt[t]))+'}\n')
    for q in sorted(dt[t],key=lambda q:(-q['y'],q['n'])): dflat.append(q); out.append(question(q,len(dflat)))
out.append('\\end{multicols}\n'+keyblock('Deleted Portions',dflat))
byy=collections.Counter(q['y'] for q in X)
out.append(r'''\par\medskip{\small\setlength{\tabcolsep}{3.5pt}
\begin{tabular*}{\linewidth}{@{\extracolsep{\fill}}l*{11}{c}c@{}}\toprule
Year & 2016 & 2017 & 2018 & 2019 & 2020 & 2021 & 2022 & 2023 & 2024 & 2025 & 2026 & Total\\\midrule
Deleted-portion questions & '''+' & '.join(str(byy.get(y,0)) for y in range(2016,2027))+r''' & \textbf{'''+str(len(X))+r'''}\\\bottomrule\end{tabular*}}\par
''')
# ---- overall chapter-wise weightage (before the eleven-year summary pages)
wrows=[]
for f,name,flat in chrows:
    byy=collections.Counter(q['y'] for q in flat); D=sum(1 for q in flat if q['typ']=='D')
    wrows.append(f"{cls(f)}.{chap(f)} & {name} & "+' & '.join(str(byy.get(y,0)) for y in range(2016,2027))+f" & \\textbf{{{len(flat)}}} & {pct(D,len(flat))}\\%\\\\")
    if f=='keph207': wrows.append(r'\midrule')
xi=sum(len(fl) for f,_,fl in chrows if f.startswith('keph')); xii=sum(len(fl) for f,_,fl in chrows if f.startswith('leph'))
top6=sorted(chrows,key=lambda r:-len(r[2]))[:6]
out.append(r'''\clearpage\gdef\curyear{Overall Summary}
\phantomsection\addcontentsline{toc}{section}{Overall Summary}\label{coverall}
\begin{center}{\pgfornament[width=5cm,color=gilt]{87}}\par
{\fontsize{20}{24}\selectfont\color{navy}\scshape Chapter-wise Weightage, 2016--2026}\par
{\color{gilt}\pgfornament[width=5cm,color=gilt,symmetry=h]{87}}\end{center}
\vspace{2pt}
{\small Number of in-syllabus questions from each 2026-27 NCERT chapter in every paper. Dir\,\%: share of the chapter's questions that are direct from the NCERT textbook.}\par\medskip
{\footnotesize\setlength{\tabcolsep}{2.6pt}\renewcommand{\arraystretch}{1.12}
\begin{tabularx}{\linewidth}{@{}l>{\raggedright\arraybackslash}X*{11}{c}rr@{}}\toprule
Ch & Chapter & 16 & 17 & 18 & 19 & 20 & 21 & 22 & 23 & 24 & 25 & 26 & Total & Dir\\\midrule
'''+'\n'.join(wrows)+r'''
\midrule & Class XI total & \multicolumn{11}{c}{} & \textbf{'''+str(xi)+r'''} & \\
& Class XII total & \multicolumn{11}{c}{} & \textbf{'''+str(xii)+r'''} & \\\bottomrule
\end{tabularx}}\par\medskip
{\small Class XII gives '''+str(pct(xii,xi+xii))+r'''\% of the in-syllabus questions and Class XI '''+str(pct(xi,xi+xii))+r'''\%. The six heaviest chapters, '''+', '.join(f"{n} ({len(fl)})" for _,n,fl in top6)+r''', together give '''+str(sum(len(fl) for _,_,fl in top6))+r''' questions, '''+str(pct(sum(len(fl) for _,_,fl in top6),xi+xii))+r'''\% of the total. The pages that follow give the year-wise summary, the most repeated topics and the preparation plan.}\par
\input{summary}
''')
open(B+'c_chapters.tex','w').write(''.join(out))
# ---- contents
T=[r'''\thispagestyle{plain}
\begin{center}
{\color{gilt}\pgfornament[width=5cm]{87}}\par\vspace{4pt}
{\fontsize{24}{28}\selectfont\color{navy}\scshape Contents}\par\vspace{4pt}
{\color{gilt}\pgfornament[width=5cm,symmetry=h]{87}}
\end{center}
\vspace{0.1cm}
{\small\renewcommand{\arraystretch}{1.12}
\begin{tabularx}{\linewidth}{@{}r>{\raggedright\arraybackslash}Xrr@{\hspace{1.4em}}r>{\raggedright\arraybackslash}Xrr@{}}\toprule
\multicolumn{2}{@{}l}{\color{navy}\scshape Class XI} & Qs & Page & \multicolumn{2}{l}{\color{navy}\scshape Class XII} & Qs & Page\\\midrule
''']
xi_=[r for r in toc if r[0]=='XI']; xii_=[r for r in toc if r[0]=='XII']
cellr=lambda r:f"{r[1]}. & {r[2]} & {r[4]} & {{\\color{{crimson}}\\pageref{{{r[3]}}}}}" if r else ' & & & '
for i in range(max(len(xi_),len(xii_))):
    T.append(cellr(xi_[i] if i<len(xi_) else None)+' & '+cellr(xii_[i] if i<len(xii_) else None)+'\\\\\n')
T.append(r'''\midrule
 & Deleted Portions & '''+str(len(X))+r''' & {\color{crimson}\pageref{cdeleted}} & & Overall Summary & & {\color{crimson}\pageref{coverall}}\\\bottomrule
\end{tabularx}}
\vfill
\begin{center}
\begin{minipage}{0.84\textwidth}\centering\small
\textbf{\color{navy}About this book.} The '''+str(len(Q))+r''' questions of NEET (UG) Physics 2016--2026 are arranged by the 28 chapters of the 2026-27 NCERT textbooks (Class XI, then Class XII). Inside a chapter the questions are grouped by topic, in the order the topics appear in the textbook, newest year first; each question shows the year and question number of the original paper (Q 136--180 in 2017 and 2020) and keeps its original option labels. Every question carries its NCERT tag (\textsc{Direct} or \textsc{Applied}, with the page and a link to the official chapter PDF). Each chapter ends with its answer key (official NTA final keys for 2021, 2022, 2023, 2025 and 2026; solved by the editor for the other years) and a chapter summary: questions per year, topic-wise counts, direct and applied split and what to focus on. Questions on deleted portions are collected in their own section. The book ends with an overall summary and a preparation plan.\\[8pt]
{\color{gilt}\pgfornament[width=2.5cm]{15}}\\[4pt]
{\itshape Prepared by Sumeet Birajadar for Science Monk online classes.}
\end{minipage}
\end{center}
\clearpage
''')
open(B+'ctoc.tex','w').write(''.join(T))
# ---- cover: the year-wise cover with the chapter-wise title line
c=open(B+'cover.tex').read()
c=c.replace('Previous Year Question Papers','Chapter-wise Previous Year Questions').replace(r'2016 \textendash{} 2026 \enspace\textperiodcentered\enspace Eleven Years \enspace\textperiodcentered\enspace '+str(len(Q))+' Questions',r'28 NCERT Chapters \enspace\textperiodcentered\enspace 2016 \textendash{} 2026 \enspace\textperiodcentered\enspace '+str(len(Q))+' Questions')
assert 'Chapter-wise' in c and '28 NCERT' in c
open(B+'ccover.tex','w').write(c)
print(len(Q),len(ANALYSED),len(X),[(n,k) for c_,n_,n,l,k in toc][:3],xi,xii)
