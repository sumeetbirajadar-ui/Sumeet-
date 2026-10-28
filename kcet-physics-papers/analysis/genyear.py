# usage: python3 genyear.py 2025   (reads data<year>.py; injects NCERT tags, similar-PYQ lines, analysis page)
import re,sys,collections,importlib.util
Y=sys.argv[1]
spec=importlib.util.spec_from_file_location('d',f'data{Y}.py'); d=importlib.util.module_from_spec(spec); spec.loader.exec_module(d)
BOOK=f'/home/user/Sumeet-/kcet-physics-papers/book/y{Y}.tex'
START={'keph101':1,'keph102':13,'keph103':27,'keph104':49,'keph105':71,'keph106':92,'keph107':127,'keph201':167,'keph202':180,'keph203':202,'keph204':226,'keph205':244,'keph206':259,'keph207':278,'leph101':1,'leph102':45,'leph103':81,'leph104':107,'leph105':136,'leph106':154,'leph107':177,'leph108':201,'leph201':221,'leph202':255,'leph203':274,'leph204':290,'leph205':306,'leph206':323}
CH={'keph101':'Units \\& Measurement','keph102':'Motion in a Straight Line','keph103':'Motion in a Plane','keph104':'Laws of Motion','keph105':'Work, Energy \\& Power','keph106':'Rotational Motion','keph107':'Gravitation','keph201':'Mech.\\ Prop.\\ of Solids','keph202':'Mech.\\ Prop.\\ of Fluids','keph203':'Thermal Prop.\\ of Matter','keph204':'Thermodynamics','keph205':'Kinetic Theory','keph206':'Oscillations','keph207':'Waves','leph101':'Electric Charges \\& Fields','leph102':'Electrostatic Potential \\& Capacitance','leph103':'Current Electricity','leph104':'Moving Charges \\& Magnetism','leph105':'Magnetism \\& Matter','leph106':'Electromagnetic Induction','leph107':'Alternating Current','leph108':'Electromagnetic Waves','leph201':'Ray Optics','leph202':'Wave Optics','leph203':'Dual Nature','leph204':'Atoms','leph205':'Nuclei','leph206':'Semiconductor Electronics'}
LAB={'keph1':('XI','Part 1'),'keph2':('XI','Part 2'),'leph1':('XII','Part 1'),'leph2':('XII','Part 2')}
chap=lambda f:int(f[-2:])+(7 if f.startswith('keph2') else 8 if f.startswith('leph2') else 0)
NONE='None found in NEET/AIPMT/AIEEE/JEE papers, 2005--2026 (NCERT concept application)'
def strip(s,name):
    while True:
        j=s.find('\\'+name+'{')
        if j<0: return s
        k=j+len(name)+1; n=1 if name=='nsrc' else 6
        for _ in range(n):
            dd=0
            while True:
                c=s[k]; dd+=(c=='{')-(c=='}'); k+=1
                if dd==0: break
        s=s[:j]+s[k:]
s=open(BOOK).read()
s=re.sub(r'%%BEGIN-ANALYSIS.*?%%END-ANALYSIS\n?',lambda m:'\\end{multicols}\n',s,flags=re.S)
s=strip(s,'nsrc'); s=strip(s,'ntag')
T=[l.split() for l in d.TAGS.strip().splitlines()]; assert len(T)==60,len(T)
out=[];i=0;n=0;info=[]
while True:
    j=s.find('\\QQ{',i)
    if j<0: out.append(s[i:]);break
    k=j+4;dd=1
    while dd: c=s[k]; dd+=(c=='{')-(c=='}'); k+=1
    t,pg,f,*ex=T[n]; pg=int(pg); n+=1
    c,pt=LAB[f[:5]]
    extra=f' \\textperiodcentered{{}} Exemplar Q{ex[0][1:]}' if ex else ''
    tag=f'\\ntag{{{t}}}{{{pg}}}{{{f}}}{{{pg-START[f]+1}}}{{{extra}}}{{Class {c} {pt} \\textperiodcentered{{}} Ch {chap(f)}}}'
    OUT=getattr(d,'OUT',{})
    if n in OUT: tag+='\\nsrc{'+d.SRC.get(n,'None found in NEET/AIPMT/AIEEE/JEE papers, 2005--2026')+'. \\textit{Note: '+OUT[n]+' is not in the 2026-27 NCERT textbook.}}'
    elif t=='A': tag+='\\nsrc{'+d.SRC.get(n,NONE)+'}'
    out.append(s[i:k-1]+tag); i=k-1; info.append((n,t,f,bool(ex)))
s=''.join(out)
D=[x for x in info if x[1]=='D' and not x[3]]; E=[x for x in info if x[3]]; A=[x for x in info if x[1]=='A']
ApS=[x for x in A if x[0] in d.SRC]; ApN=[x for x in A if x[0] not in d.SRC]
xi=[x for x in info if x[2].startswith('keph')]
cnt=collections.Counter(x[2] for x in info); dirc=collections.Counter(x[2] for x in info if x[1]=='D')
DIFF=dict(zip(range(1,61),d.DIFF.split())); dc=collections.Counter(DIFF.values())
ex=collections.Counter(('NEET' if re.search('NEET|AIPMT|AIIMS',v) else 'AIEEE' if 'AIEEE' in v else 'JEE') for k,v in d.SRC.items() if k in {x[0] for x in A})
L=lambda xs:', '.join(str(x[0]) for x in xs)
rows='\n'.join(f'{CH[f]} & {"XI" if f.startswith("keph") else "XII"} & {m} & {dirc.get(f,0)} & {m-dirc.get(f,0)}\\\\' for f,m in sorted(cnt.items(),key=lambda z:(not z[0].startswith('keph'),z[0])))
hard=[k for k,v in DIFF.items() if v=='H']
page=r'''%%BEGIN-ANALYSIS
\end{multicols}
\clearpage
\begin{center}{\pgfornament[width=5cm,color=gilt]{87}}\par
{\fontsize{20}{24}\selectfont\color{navy}\scshape KCET '''+Y+r''' \textperiodcentered{} Paper Analysis}\par
{\color{gilt}\pgfornament[width=5cm,color=gilt,symmetry=h]{87}}\end{center}
\vspace{4pt}
\begin{multicols}{2}
\textbf{\color{crimson}1. Direct vs Applied}\par\smallskip
\begin{tabular}{@{}lr@{}}\toprule
Direct from NCERT textbook (2026-27) & '''+str(len(D))+r'''\\
Direct from NCERT Exemplar & '''+str(len(E))+r'''\\
Applied (concept in NCERT) & '''+str(len(A))+r'''\\\midrule
\textbf{Total} & \textbf{60}\\\bottomrule\end{tabular}\par\smallskip
{\footnotesize Direct: Q '''+L(D)+r'''.'''+(r'\\ Exemplar: Q '+L(E)+'.' if E else '')+r'''}\par\medskip
\textbf{\color{crimson}2. Where the applied questions resemble earlier exams}\par\smallskip
Of the '''+str(len(A))+r''' applied questions, \textbf{'''+str(len(ApS))+r'''} closely resemble a question from an earlier national exam:
NEET/AIPMT/AIIMS '''+str(ex['NEET'])+r''', JEE Main/Advanced '''+str(ex['JEE'])+r''', AIEEE '''+str(ex['AIEEE'])+r'''.
The other '''+str(len(ApN))+r''' (Q '''+L(ApN)+r''') had no close match in the NEET, AIPMT, AIIMS, AIEEE and JEE papers of 2005--2026 that were searched; they are straightforward applications of NCERT concepts.'''+((r' \textbf{'+str(len(d.OUT))+r'} questions (Q '+', '.join(map(str,d.OUT))+r') test topics no longer in the 2026-27 NCERT textbook.') if getattr(d,'OUT',None) else '')+r'''\par
{\footnotesize Strongest repeats: '''+d.STRONG+r'''}\par\medskip
\textbf{\color{crimson}3. Difficulty level}\par\smallskip
\begin{tabular}{@{}lr@{}}\toprule
Easy & '''+str(dc['E'])+r'''\\ Moderate & '''+str(dc['M'])+r'''\\ Hard & '''+str(dc['H'])+r'''\\\bottomrule\end{tabular}\par\smallskip
{\footnotesize '''+(('Hard: Q '+', '.join(map(str,hard))+'. ') if hard else '')+d.OVERALL+r''' Class XI: '''+str(len(xi))+r''' questions, Class XII: '''+str(60-len(xi))+r'''. (Difficulty is the editor's assessment.)}\par\medskip
\columnbreak
\textbf{\color{crimson}4. Chapter-wise distribution}\par\smallskip
{\footnotesize\begin{tabular}{@{}p{3.6cm}c@{\,}r@{\,}r@{\,}r@{}}\toprule
Chapter & Cl. & Qs & Dir & App\\\midrule
'''+rows+r'''
\bottomrule\end{tabular}}\par\medskip
\textbf{\color{crimson}5. Teaching takeaways}\par\smallskip
{\footnotesize\begin{itemize}[leftmargin=1em,nosep]
'''+'\n'.join('\\item '+x for x in d.TAKE)+r'''
\end{itemize}}
\end{multicols}
%%END-ANALYSIS
'''
assert s.count('\\end{multicols}')==1
s=s.replace('\\end{multicols}',page,1)
open(BOOK,'w').write(s)
print(Y,'direct',len(D),'exemplar',len(E),'applied',len(A),'similar',len(ApS),dc)
