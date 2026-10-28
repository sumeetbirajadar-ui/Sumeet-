# Inject "Similar PYQ" lines and the analysis page into y2026.tex
import re,collections
BOOK='/home/user/Sumeet-/kcet-physics-papers/book/y2026.tex'
CH={'keph101':'Units \\& Measurement','keph102':'Motion in a Straight Line','keph103':'Motion in a Plane','keph104':'Laws of Motion',
'keph105':'Work, Energy \\& Power','keph106':'Rotational Motion','keph107':'Gravitation','keph201':'Mech.\\ Prop.\\ of Solids',
'keph202':'Mech.\\ Prop.\\ of Fluids','keph203':'Thermal Prop.\\ of Matter','keph204':'Thermodynamics','keph205':'Kinetic Theory',
'keph206':'Oscillations','keph207':'Waves','leph101':'Electric Charges \\& Fields','leph102':'Electrostatic Potential \\& Capacitance',
'leph103':'Current Electricity','leph104':'Moving Charges \\& Magnetism','leph105':'Magnetism \\& Matter','leph106':'Electromagnetic Induction',
'leph107':'Alternating Current','leph108':'Electromagnetic Waves','leph201':'Ray Optics','leph202':'Wave Optics','leph203':'Dual Nature',
'leph204':'Atoms','leph205':'Nuclei','leph206':'Semiconductor Electronics'}
NONE='None found in NEET/AIPMT/AIEEE/JEE papers, 2005--2026 (NCERT concept application)'
SRC={1:'JEE Main 2021 (25 Feb, Shift 1) -- match-the-list of dimensions ($h$, $E$, $V$, $p$)',
2:'NEET 2023 -- average speed, half distance at 8 and half at 20',
4:'JEE Main 2024 (1 Feb, Shift 2), $v=4\\sqrt{x}$; AIEEE 2006, $v=\\alpha\\sqrt{x}$ -- acceleration from $v(x)$',
6:'AIEEE 2006 -- mass on a string held by a horizontal force at $45^\\circ$',
7:'JEE Main 2021 (24 Feb, Shift 2) -- equal momentum, ratio of kinetic energies',
10:'JEE Main 2024 (6 Apr, Shift 1) -- earth\'s radius reduced, new length of day',
11:'NEET 2016 (Phase I) -- planet with radius and density twice that of earth',
13:'NEET 2023 -- ``The venturi-meter works on: Bernoulli\'s principle\'\'',
14:'JEE Main 2023 (30 Jan, Shift 2) -- elongation of wires of different diameter',
15:'AIEEE 2005 -- capillary tube in a freely falling elevator (20 cm tube, 8 cm rise)',
19:'NEET 2013 -- beats with 250 Hz; second harmonic gives beats with 513 Hz',
29:'JEE Main 2024 (6 Apr, Shift 2) -- electrons per second in a 110 W, 220 V filament',
55:'JEE Main 2015 (4 Apr) -- electron transition from excited to ground state',
57:'AIEEE 2006 -- ``which one of the diodes is reverse biased?\'\'',
59:'JEE Main 2021 (27 Jul, Shift 2) -- graph of deviation vs angle of incidence'}
DIFF=dict(zip(range(1,61),'M E E M E M E E E M M M E E M E E E M E E M M E M E E M E E E M M M E H E E E E E M E E H E M M M M E M E E E E M M M M'.split()))
s=open(BOOK).read()
def strip_nsrc(s):
    while True:
        j=s.find('\\nsrc{')
        if j<0: return s
        k=j+5;d=0
        while True:
            c=s[k]; d+=(c=='{')-(c=='}'); k+=1
            if d==0: break
        s=s[:j]+s[k:]
s=strip_nsrc(s)
s=re.sub(r'%%BEGIN-ANALYSIS.*?%%END-ANALYSIS\n?',lambda m:'\\end{multicols}\n',s,flags=re.S)
def parse(s):
    res=[];i=0
    while True:
        j=s.find('\\ntag{',i)
        if j<0: return res
        k=j+5;args=[]
        for _ in range(6):
            assert s[k]=='{'; d=0;st=k
            while True:
                c=s[k]; d+=(c=='{')-(c=='}'); k+=1
                if d==0: break
            args.append(s[st+1:k-1])
        res.append((j,k,args)); i=k
tags=parse(s)
assert len(tags)==60,len(tags)
info=[];out=[];i=0
for q,(j,k,a) in enumerate(tags,1):
    t,pg,f,ex=a[0],a[1],a[2],a[4]
    out.append(s[i:k])
    if t=='A': out.append('\\nsrc{'+SRC.get(q,NONE)+'}')
    i=k; info.append((q,t,f,ex))
out.append(s[i:]); s=''.join(out)
# analysis
D=[x for x in info if x[1]=='D' and not x[3]]; E=[x for x in info if x[1]=='D' and x[3]]; A=[x for x in info if x[1]=='A']
ApS=[x for x in A if x[0] in SRC]; ApN=[x for x in A if x[0] not in SRC]
xi=[x for x in info if x[2].startswith('keph')]; 
cnt=collections.Counter(x[2] for x in info); dirc=collections.Counter(x[2] for x in info if x[1]=='D')
dc=collections.Counter(DIFF.values())
exams=collections.Counter(('NEET' if 'NEET' in v else 'AIEEE' if 'AIEEE' in v else 'JEE Main') for k,v in SRC.items())
L=lambda xs:', '.join(str(x[0]) for x in xs)
rows='\n'.join(f'{CH[f]} & {"XI" if f.startswith("keph") else "XII"} & {n} & {dirc.get(f,0)} & {n-dirc.get(f,0)}\\\\' for f,n in sorted(cnt.items(),key=lambda z:(not z[0].startswith('keph'),z[0])))
page=r'''%%BEGIN-ANALYSIS
\end{multicols}
\clearpage
\begin{center}{\pgfornament[width=5cm,color=gilt]{87}}\par
{\fontsize{20}{24}\selectfont\color{navy}\scshape KCET 2026 \textperiodcentered{} Paper Analysis}\par
{\color{gilt}\pgfornament[width=5cm,color=gilt,symmetry=h]{87}}\end{center}
\vspace{4pt}
\begin{multicols}{2}
\textbf{\color{crimson}1. Direct vs Applied}\par\smallskip
\begin{tabular}{@{}lr@{}}\toprule
Direct from NCERT textbook (2026-27) & '''+str(len(D))+r'''\\
Direct from NCERT Exemplar & '''+str(len(E))+r'''\\
Applied (concept in NCERT) & '''+str(len(A))+r'''\\\midrule
\textbf{Total} & \textbf{60}\\\bottomrule\end{tabular}\par\smallskip
{\footnotesize Direct: Q '''+L(D)+r'''.\\ Exemplar: Q '''+L(E)+r'''.}\par\medskip
\textbf{\color{crimson}2. Where the applied questions resemble earlier exams}\par\smallskip
Of the '''+str(len(A))+r''' applied questions, \textbf{'''+str(len(ApS))+r'''} closely resemble a question from an earlier national exam:
NEET/AIPMT '''+str(exams['NEET'])+r''', JEE Main '''+str(exams['JEE Main'])+r''', AIEEE '''+str(exams['AIEEE'])+r'''.
The other '''+str(len(ApN))+r''' (Q '''+L(ApN)+r''') had no close match in the NEET, AIPMT, AIIMS, AIEEE and JEE papers of 2005--2026 that were searched; they are straightforward applications of NCERT concepts.\par
{\footnotesize Strongest repeats: Q15 (AIEEE 2005, same capillary set-up), Q19 (NEET 2013, same beats structure), Q57 (AIEEE 2006, same diode figure type), Q10 and Q29 (JEE Main 2024), Q2 and Q13 (NEET 2023).}\par\medskip
\textbf{\color{crimson}3. Difficulty level}\par\smallskip
\begin{tabular}{@{}lr@{}}\toprule
Easy & '''+str(dc['E'])+r'''\\ Moderate & '''+str(dc['M'])+r'''\\ Hard & '''+str(dc['H'])+r'''\\\bottomrule\end{tabular}\par\smallskip
{\footnotesize Hard: Q36 (resultant field of two inclined loops), Q45 (power-line loss). Overall: \textbf{easy to moderate}. About two-thirds of the paper can be answered straight from NCERT text, examples and formulae; the rest needs one or two steps of application. Class XI: '''+str(len(xi))+r''' questions, Class XII: '''+str(60-len(xi))+r'''.}\par\medskip
\columnbreak
\textbf{\color{crimson}4. Chapter-wise distribution}\par\smallskip
{\footnotesize\begin{tabular}{@{}p{3.6cm}c@{\,}r@{\,}r@{\,}r@{}}\toprule
Chapter & Cl. & Qs & Dir & App\\\midrule
'''+rows+r'''
\bottomrule\end{tabular}}\par\medskip
\textbf{\color{crimson}5. Teaching takeaways}\par\smallskip
{\footnotesize\begin{itemize}[leftmargin=1em,nosep]
\item Read NCERT text line by line: lists such as irreversible processes (p.\,236), Table 5.2 (p.\,147) and Bohr's postulates (p.\,299) were asked almost verbatim.
\item Solved NCERT examples reappear with the same data (Example 1.7, Example 7.1).
\item NCERT Exemplar is worth practising (Q22, Q48 identical).
\item Old NEET/AIEEE PYQs on beats, capillarity and diodes recur with new numbers.
\end{itemize}}
\end{multicols}
%%END-ANALYSIS
'''
s=s.replace('\\end{multicols}',page,1) if s.count('\\end{multicols}')==1 else s
open(BOOK,'w').write(s)
print(len(D),len(E),len(A),len(ApS),len(ApN),dc,exams)
