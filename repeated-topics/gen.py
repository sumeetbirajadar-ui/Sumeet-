import importlib.util,collections
R='/home/user/Sumeet-/'
CH=dict([('keph101','Units and Measurements'),('keph102','Motion in a Straight Line'),('keph103','Motion in a Plane'),('keph104','Laws of Motion'),('keph105','Work, Energy and Power'),('keph106','System of Particles and Rotational Motion'),('keph107','Gravitation'),('keph201','Mechanical Properties of Solids'),('keph202','Mechanical Properties of Fluids'),('keph203','Thermal Properties of Matter'),('keph204','Thermodynamics'),('keph205','Kinetic Theory'),('keph206','Oscillations'),('keph207','Waves'),('leph101','Electric Charges and Fields'),('leph102','Electrostatic Potential and Capacitance'),('leph103','Current Electricity'),('leph104','Moving Charges and Magnetism'),('leph105','Magnetism and Matter'),('leph106','Electromagnetic Induction'),('leph107','Alternating Current'),('leph108','Electromagnetic Waves'),('leph201','Ray Optics and Optical Instruments'),('leph202','Wave Optics'),('leph203','Dual Nature of Radiation and Matter'),('leph204','Atoms'),('leph205','Nuclei'),('leph206','Semiconductor Electronics')])
cls=lambda f:'XI' if f.startswith('keph') else 'XII'
chn=lambda f:int(f[-2:])+(7 if f.startswith('keph2') else 8 if f.startswith('leph2') else 0)
MERGE={"Conductors, Gauss's law and electric flux":"Gauss's law and electric flux"}
Y=list(range(2016,2027))
def load(ex):
    Q=[];tot=collections.Counter();dele=collections.Counter()
    for y in Y:
        sp=importlib.util.spec_from_file_location('d',f'{R}{ex}-physics-papers/analysis/data{y}.py'); d=importlib.util.module_from_spec(sp); sp.loader.exec_module(d)
        T=[l.split() for l in d.TAGS.strip().splitlines()]
        K=[l.split(' | ')[0].split(None,2) for l in open(f'{R}{ex}-physics-papers/analysis/keys/k{y}.txt').read().strip().splitlines()]
        assert len(T)==len(K)
        for t,k in zip(T,K):
            tot[y]+=1
            if t[0]=='X': dele[y]+=1; continue
            Q.append((y,t[2],MERGE.get(k[2],k[2])))
    return Q,tot,dele
def esc(s): return s.replace('&','\\&').replace("'","'")
def table(Q,key,n,label,kind):
    c=collections.Counter(key(q) for q in Q); by=collections.defaultdict(collections.Counter)
    for q in Q: by[key(q)][q[0]]+=1
    yrs=lambda k:sum(1 for y in Y if by[k][y])
    top=sorted(c,key=lambda k:(-c[k],-yrs(k),k))[:n]
    tot=len(Q)
    rows=[]
    for i,k in enumerate(top,1):
        name=(f"{CH[k]} {{\\scriptsize({cls(k)}-{chn(k)})}}" if kind=='ch' else esc(k))
        cells=' & '.join((f"\\textbf{{{by[k][y]}}}" if by[k][y] else '{\\color{gray!60}--}') for y in Y)
        rows.append(f"{i} & {name} & {cells} & \\textbf{{{c[k]}}} & {yrs(k)}/11 & {100*c[k]/tot:.1f}\\%\\\\")
    head=' & '.join(f"'{str(y)[2:]}" for y in Y)
    return (r"\begin{tabularx}{\linewidth}{@{}r>{\raggedright\arraybackslash}X*{11}{c}ccc@{}}\toprule"+"\n"
      +f"\\# & {label} & {head} & Total & Years & Share\\\\\\midrule\n"+'\n'.join(rows)+"\n\\bottomrule\\end{tabularx}"),top,c,by,yrs
def section(title,Q,tot,dele,note):
    t1,topc,cc,byc,yc=table(Q,lambda q:q[1],10,'Chapter (NCERT 2026-27)','ch')
    t2,topt,ct,byt,yt=table(Q,lambda q:q[2],21,'Topic','tp')
    allyrs_c=[CH[k] for k in sorted(cc,key=lambda k:-cc[k]) if yc(k)==11]
    allyrs_t=[esc(k) for k in sorted(ct,key=lambda k:-ct[k]) if yt(k)==11]
    s10=sum(cc[k] for k in topc); s21=sum(ct[k] for k in topt); N=len(Q)
    qrow=' & '.join(str(tot[y]) for y in Y); xrow=' & '.join(str(dele[y]) for y in Y); arow=' & '.join(str(tot[y]-dele[y]) for y in Y)
    return rf"""\section*{{{title}}}
{{\small {note}}}\par\medskip
\begin{{tabular*}}{{\linewidth}}{{@{{\extracolsep{{\fill}}}}l*{{11}}{{c}}c@{{}}}}\toprule
Year & {' & '.join(str(y) for y in Y)} & Total\\\midrule
Physics questions & {qrow} & {sum(tot.values())}\\
On deleted topics & {xrow} & {sum(dele.values())}\\
\textbf{{Counted here}} & {arow} & \textbf{{{N}}}\\\bottomrule\end{{tabular*}}\par\bigskip
\subsection*{{Top 10 most repeated chapters}}
{{\small Number of questions from each chapter in each year. ``Years'' = in how many of the 11 papers the chapter was asked; ``Share'' = share of all {N} counted questions.}}\par\smallskip
{{\footnotesize\setlength{{\tabcolsep}}{{2.6pt}}\renewcommand{{\arraystretch}}{{1.25}}
{t1}}}\par\smallskip
{{\small These 10 chapters gave \textbf{{{s10}}} of the {N} questions ({100*s10/N:.0f}\%).
Chapters asked in \textbf{{every one}} of the 11 years: {', '.join(allyrs_c) if allyrs_c else 'none'}.}}\par\clearpage
\subsection*{{Top 21 most repeated topics}}
{{\small Each question was given one topic when the answer key was prepared. Counts per year as above.}}\par\smallskip
{{\footnotesize\setlength{{\tabcolsep}}{{2.6pt}}\renewcommand{{\arraystretch}}{{1.2}}
{t2}}}\par\smallskip
{{\small These 21 topics gave \textbf{{{s21}}} of the {N} questions ({100*s21/N:.0f}\%), about {s21/11:.0f} questions in every paper.
Topics asked in \textbf{{every one}} of the 11 years: {', '.join(allyrs_t) if allyrs_t else 'none'}.}}
"""
nQ,nt,nd=load('neet'); kQ,kt,kd=load('kcet')
cQ=nQ+kQ; ct=collections.Counter(); cd=collections.Counter()
for y in Y: ct[y]=nt[y]+kt[y]; cd[y]=nd[y]+kd[y]
body=[section('1. NEET (UG) Physics, 2016--2026',nQ,nt,nd,"Main paper of each year (2026: re-examination of 21 June). 45 questions in 2016--2020 and 2025--2026; 50 in 2021--2024."),
 section('2. KCET Physics, 2016--2026',kQ,kt,kd,"60 questions in each paper."),
 section('3. NEET and KCET together, 2016--2026',cQ,ct,cd,"Both exams added year by year; useful for a student writing both.")]
doc=r"""\documentclass[10pt,a4paper]{article}
\usepackage[a4paper,margin=1.5cm]{geometry}
\usepackage[T1]{fontenc}\usepackage{crimson}\usepackage{booktabs,tabularx,xcolor}
\usepackage{titlesec}\titleformat*{\section}{\Large\bfseries}\titleformat*{\subsection}{\large\bfseries}
\pagestyle{plain}\setlength{\parindent}{0pt}
\begin{document}
\begin{center}{\LARGE\bfseries Most Repeated Chapters and Topics in Physics}\\[4pt]
{\large NEET (UG) and KCET \textperiodcentered{} 11 years of papers, 2016--2026}\end{center}\medskip
{\small \textbf{Data used.} Every Physics question of the 11 NEET papers and 11 KCET papers from 2016 to 2026 (1175 questions) was read and tagged with its 2026-27 NCERT chapter and one topic. Questions on topics deleted from the rationalised NCERT syllabus are left out of the rankings, so every count below is a question a student can still prepare from the present textbook. In the tables, a number is the count of questions asked in that year; ``--'' means none was asked. Ties are ordered by the number of years in which the chapter or topic was asked.}\par\medskip
"""+"\n\\clearpage\n".join(body)+"\n\\end{document}\n"
open('repeated.tex','w').write(doc)
print(len(nQ),len(kQ),sum(nt.values()),sum(kt.values()))
