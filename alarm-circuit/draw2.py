import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle, Polygon, FancyBboxPatch
R,B,K,BL='#d62728','#1f4fd1','#111','#1f4fd1'
fig,ax=plt.subplots(figsize=(17,9.5)); ax.set_xlim(-0.5,28.5); ax.set_ylim(-1.8,11.6); ax.axis('off'); ax.set_aspect('equal')
def L(pts,c=K,w=2.2): xs,ys=zip(*pts); ax.plot(xs,ys,color=c,lw=w,solid_capstyle='round',zorder=2)
def dot(x,y,c=K): ax.add_patch(Circle((x,y),0.11,color=c,zorder=5))
def T(x,y,s,**k): k.setdefault('fontsize',11); ax.text(x,y,s,zorder=6,**k)
def vcc(x,y):  # +4.5V symbol, wire comes from below
    L([(x,y),(x,y+0.45)],R); L([(x-0.35,y+0.45),(x+0.35,y+0.45)],R,3); T(x,y+0.6,'+4.5V',color=R,ha='center',fontsize=9,weight='bold')
def gnd(x,y):  # wire comes from above
    L([(x,y),(x,y-0.4)]); 
    for i,wd in enumerate([0.4,0.26,0.12]): L([(x-wd,y-0.4-i*0.14),(x+wd,y-0.4-i*0.14)],K,2)
def res_v(x,y1,y2,lab,c=K):  # vertical resistor
    m=(y1+y2)/2; L([(x,y1),(x,m-0.6)],c); L([(x,m+0.6),(x,y2)],c)
    ax.add_patch(Rectangle((x-0.2,m-0.6),0.4,1.2,fill=False,lw=2,ec=K,zorder=3)); T(x+0.35,m,lab,va='center',fontsize=10)
def res_h(x1,x2,y,lab):
    m=(x1+x2)/2; L([(x1,y),(m-0.6,y)]); L([(m+0.6,y),(x2,y)])
    ax.add_patch(Rectangle((m-0.6,y-0.2),1.2,0.4,fill=False,lw=2,ec=K,zorder=3)); T(m,y+0.35,lab,ha='center',fontsize=10)
def cap_v(x,y1,y2,lab,pol=False):
    m=(y1+y2)/2; L([(x,y1),(x,m+0.12)]); L([(x,m-0.12),(x,y2)])
    L([(x-0.4,m+0.12),(x+0.4,m+0.12)],K,3); L([(x-0.4,m-0.12),(x+0.4,m-0.12)],K,3)
    if pol: T(x-0.6,m+0.2,'+',fontsize=12)
    T(x+0.5,m,lab,va='center',fontsize=10)
def box(x,y,w,h,title,fc):
    ax.add_patch(FancyBboxPatch((x,y),w,h,boxstyle='round,pad=0.05',fc=fc,ec=K,lw=2,zorder=1)); T(x+w/2,y+h/2,title,ha='center',va='center',fontsize=11,weight='bold')
def pin(x,y,name,side='r'):
    T(x-0.12 if side=='r' else x+0.12,y,name,ha='right' if side=='r' else 'left',va='center',fontsize=10)

T(14,11.2,'CORRECTED: piezo press  OR  IR detection  →  555 timer  →  buzzer rings ~3 s',ha='center',fontsize=15,weight='bold')

# ---------- power ----------
L([(1,2.4),(1,4.2)]); L([(1,5.0),(1,8)])
for i,(wd,yy) in enumerate([(0.55,5.0),(0.3,4.75),(0.55,4.5),(0.3,4.25)]): L([(1-wd,yy),(1+wd,yy)],K,3)
T(1.7,4.6,'4.5 V\n3×AA',fontsize=10,va='center'); T(0.25,5.1,'+',fontsize=12,color=R)
gnd(1,2.4)
L([(1,8),(1.6,8)]); ax.add_patch(Circle((1.7,8),0.1,fill=False,lw=2)); ax.add_patch(Circle((2.7,8),0.1,fill=False,lw=2))
L([(1.78,8.05),(2.6,8.5)]); T(2.2,8.7,'ON/OFF\nrocker',ha='center',fontsize=9)
L([(2.8,8),(3.3,8)],R); vcc(3.3,8)

# ---------- IR module ----------
box(4.6,6.0,3.4,3.4,'IR obstacle\nmodule',"#dfe8fb")
for yy,nm in [(8.8,'VCC'),(7.7,'OUT'),(6.6,'GND')]: pin(8.0,yy,nm)
L([(8,8.8),(8.8,8.8)],R); vcc(8.8,8.8)
L([(8,6.6),(8.8,6.6)]); gnd(8.8,6.6)
T(6.3,5.6,'OUT goes LOW on detection',ha='center',fontsize=9,style='italic')
# diode (cathode toward IR OUT): line, triangle pointing left
L([(8,7.7),(9.6,7.7)],BL); ax.add_patch(Polygon([(10.4,7.35),(10.4,8.05),(9.75,7.7)],fc='white',ec=K,lw=2,zorder=3)); L([(9.72,7.35),(9.72,8.05)],K,3)
L([(10.4,7.7),(14,7.7)],BL); T(10.05,8.25,'D1 1N4148',ha='center',fontsize=10); T(10.05,7.0,'band → IR side',ha='center',fontsize=8)

# ---------- piezo module + disc ----------
box(4.6,1.2,3.4,3.4,'Piezo\nmodule',"#dfe8fb")
for yy,nm in [(4.0,'+'),(2.9,'S'),(1.8,'–')]: pin(8.0,yy,nm)
L([(8,4.0),(8.8,4.0)],R); vcc(8.8,4.0)
L([(8,1.8),(8.8,1.8)]); gnd(8.8,1.8)
# screw terminal + disc
ax.add_patch(Rectangle((4.3,2.3),0.4,1.2,fc='#7fd07f',ec=K,lw=1.5,zorder=3)); T(4.0,3.75,'screw\nterminal',ha='center',fontsize=8)
ax.add_patch(Circle((2.6,1.6),0.75,fc='#d9c27a',ec=K,lw=1.5,zorder=3)); ax.add_patch(Circle((2.6,1.6),0.45,fc='#f4f1ea',ec=K,lw=1,zorder=4))
L([(2.6,1.6),(3.4,3.2),(4.3,3.2)],R,1.8); L([(3.25,1.4),(3.7,2.6),(4.3,2.6)],K,1.8)
T(2.6,0.05,'piezo disc\nred = centre, black = brass',ha='center',fontsize=8)
# S -> R1 -> Q1
res_h(8,10.8,2.9,'R1 10k')
ax.add_patch(Circle((11.6,2.9),0.75,fill=False,lw=2,zorder=3))
L([(10.8,2.9),(11.25,2.9)]); L([(11.25,2.45),(11.25,3.35)],K,3)
L([(11.25,3.1),(11.95,3.65),(11.95,4.4)]); L([(11.25,2.7),(11.95,2.15),(11.95,1.6)])
ax.annotate('',xy=(11.9,2.2),xytext=(11.45,2.55),arrowprops=dict(arrowstyle='-|>',color=K,lw=1.5),zorder=6)
gnd(11.95,1.6); T(12.5,2.6,'Q1 BC547\n(C top, E bottom)',fontsize=9)
L([(11.95,4.4),(14,4.4),(14,7.7)],BL); dot(14,7.7,BL); dot(14,6.0,BL)
T(14.25,4.9,'collector',fontsize=8,color=BL)

# pull-up R2
res_v(14,7.7,9.6,'R2 10k'); vcc(14,9.6)
# trigger line to 555
L([(14,6.0),(17,6.0)],BL); T(15.6,5.55,'TRIGGER\n(both sensors)',ha='center',fontsize=9,color=BL,weight='bold')

# ---------- 555 ----------
box(17,3.0,4,6,'',"#fff3d6"); T(19,6.6,'NE555\ntimer',ha='center',va='center',fontsize=12,weight='bold')
T(17.12,6.0,'2 TRIG',va='center',fontsize=9)
for xx,lab in [(18,'8 VCC'),(20,'4 RST')]: T(xx,8.75,lab,ha='center',fontsize=9); L([(xx,9),(xx,9.6)],R); vcc(xx,9.6)
T(18,3.2,'1 GND',ha='center',fontsize=9); L([(18,3),(18,2.4)]); gnd(18,2.4)
T(20,3.2,'5 CV',ha='center',fontsize=9); cap_v(20,3,1.4,'C2\n10nF'); gnd(20,1.4)
for yy,lab in [(8.0,'7 DIS'),(7.0,'6 THR'),(4.2,'3 OUT')]: T(20.88,yy,lab,ha='right',va='center',fontsize=9)
L([(21,8.0),(22.6,8.0)]); L([(21,7.0),(22.6,7.0)]); L([(22.6,7.0),(22.6,8.0)]); dot(22.6,8); dot(22.6,7)
res_v(22.6,8.0,10.0,'R3 270k'); vcc(22.6,10.0)
cap_v(22.6,7.0,5.3,'C1 10µF\n(long leg +)',pol=True); gnd(22.6,5.3)
T(24.2,8.7,'sets ring time\nt ≈ 1.1×R3×C1 ≈ 3 s',fontsize=9,style='italic')
# buzzer
L([(21,4.2),(25.5,4.2),(25.5,3.6)])
ax.add_patch(Circle((25.5,2.8),0.8,fc='#222',ec=K,zorder=3)); ax.add_patch(Circle((25.5,2.8),0.15,fc='#aaa',zorder=4))
T(25.75,3.75,'+',color=R,fontsize=14,weight='bold'); T(26.5,2.8,'Active\nbuzzer\n5 V',va='center',fontsize=10)
L([(25.5,2.0),(25.5,1.4)]); gnd(25.5,1.4)

# legend
T(0,-1.0,'All  +4.5V  symbols are joined together (red wire after the switch).   All ground (≡) symbols are joined together (black wire to battery –).',fontsize=10.5)
T(0,-1.6,'Change ring time: R3 = 470k → ~5 s,  R3 = 1M → ~11 s.   Turn the IR module\'s blue pot to set detection distance.',fontsize=10.5)
plt.savefig('corrected_schematic.png',dpi=150,bbox_inches='tight',facecolor='white')
