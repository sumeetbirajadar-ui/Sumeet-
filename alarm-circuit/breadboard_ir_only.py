import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle, FancyBboxPatch
import numpy as np
R,K,BL,G='#d62728','#111','#1f4fd1','#2a9d3a'
fig,ax=plt.subplots(figsize=(17,11)); ax.set_xlim(-12,34); ax.set_ylim(-5,24); ax.axis('off'); ax.set_aspect('equal')
def T(x,y,s,**k): k.setdefault('fontsize',11); k.setdefault('zorder',9); ax.text(x,y,s,**k)
def wire(p,c,w=4.5):
    xs,ys=zip(*p); ax.plot(xs,ys,color='k',lw=w+1.6,solid_capstyle='round',zorder=6); ax.plot(xs,ys,color=c,lw=w,solid_capstyle='round',zorder=7)
def end(x,y,c): ax.add_patch(Circle((x,y),0.22,fc=c,ec='k',lw=1.2,zorder=8))
# ---- breadboard ----
ax.add_patch(FancyBboxPatch((0,-3),31,16.6,boxstyle='round,pad=0.3',fc='#f3f1ea',ec='#999',lw=2,zorder=1))
ax.add_patch(Rectangle((0.3,5.0),30.4,1.0,fc='#e2dfd5',ec='none',zorder=1))  # centre gap
rowy={'a':11,'b':10,'c':9,'d':8,'e':7,'f':4,'g':3,'h':2,'i':1,'j':0}
TOPP,TOPN=13.2,12.4; BOTP,BOTN=-1.4,-2.2
for c in range(1,31):
    for r,y in rowy.items(): ax.add_patch(Circle((c,y),0.13,fc='#555',zorder=2))
    T(c,11.6,str(c),ha='center',fontsize=7,color='#777'); T(c,-0.75,str(c),ha='center',fontsize=7,color='#777')
for r,y in rowy.items(): T(0.35,y,r,va='center',fontsize=8,color='#777')
for yy,col,lab in [(TOPP,R,'+'),(TOPN,BL,'–'),(BOTP,R,'+'),(BOTN,BL,'–')]:
    ax.plot([0.6,30.4],[yy+0.35 if lab=='+' else yy-0.35]*2,color=col,lw=1.5,zorder=2)
    for c in range(1,31): ax.add_patch(Circle((c,yy),0.13,fc='#555',zorder=2))
    T(-0.25,yy,lab,color=col,fontsize=14,weight='bold',va='center',ha='center')
T(31.0,TOPP,' + rail (RED)',color=R,va='center',fontsize=10,weight='bold'); T(31.0,TOPN,' – rail (BLACK/GND)',color=BL,va='center',fontsize=10,weight='bold')
T(31.0,-1.8,' bottom rails: not used',va='center',fontsize=9,color='#777')
# highlight trigger column 12
ax.add_patch(Rectangle((11.55,6.55),0.9,4.9,fc='none',ec=BL,lw=2.5,ls='--',zorder=3))
T(0.3,-4.1,'column 12 (dashed): IR OUT and buzzer – meet here (holes 12a–12e are connected)',va='center',fontsize=9.5,color=BL,weight='bold',zorder=11)
# ---- battery + switch (off board) ----
ax.add_patch(FancyBboxPatch((-11,13),4.2,7,boxstyle='round,pad=0.2',fc='#333',ec='k',zorder=4))
for i in range(3): ax.add_patch(Rectangle((-10.6+i*1.3,13.6),1.0,5.8,fc='#c8913c',ec='k',zorder=5))
T(-8.9,20.8,'Battery 3×AA (4.5 V)',ha='center',fontsize=11,weight='bold')
ax.add_patch(FancyBboxPatch((-4.6,17.6),2.6,1.8,boxstyle='round,pad=0.1',fc='#222',ec='k',zorder=4))
T(-3.3,19.9,'Rocker switch',ha='center',fontsize=10,weight='bold'); T(-4.2,17.0,'IN',fontsize=9,ha='center'); T(-2.4,17.0,'OUT',fontsize=9,ha='center')
end(-4.0,17.6,'#bbb'); end(-2.6,17.6,'#bbb')
wire([(-7.5,19.6),(-6,19.6),(-6,16.5),(-4.0,16.5),(-4.0,17.6)],R); end(-7.5,19.6,R)
wire([(-2.6,17.6),(-2.6,15.2),(1,15.2),(1,TOPP)],R); end(1,TOPP,R)
wire([(-7.5,13.8),(-6.5,13.8),(-6.5,11.8),(2,11.8),(2,TOPN)],K); end(-7.5,13.8,K); end(2,TOPN,K)
T(-6.2,11.0,'battery – (black)',fontsize=9)
# ---- IR module (off board, jumper wires) ----
ax.add_patch(FancyBboxPatch((4.5,17.3),6,4.2,boxstyle='round,pad=0.15',fc='#1d4f9c',ec='k',zorder=4))
ax.add_patch(Rectangle((5.3,20.6),0.9,1.3,fc='#ddd',ec='k',zorder=5)); ax.add_patch(Rectangle((6.6,20.6),0.9,1.3,fc='#111',ec='k',zorder=5))
T(7.5,19.3,'IR obstacle\nmodule',ha='center',va='center',color='white',fontsize=11,weight='bold',zorder=10)
for x,n in [(6,'OUT'),(7.5,'GND'),(9,'VCC')]: T(x,17.85,n,ha='center',fontsize=8.5,weight='bold',color='white',zorder=11); end(x,17.3,'#e8c84a')
wire([(9,17.3),(9,15.9),(8,15.9),(8,TOPP)],R); end(8,TOPP,R)
wire([(7.5,17.3),(7.5,16.0),(6,16.0),(6,TOPN)],K); end(6,TOPN,K)
wire([(6,17.3),(6,16.5),(4.6,16.5),(4.6,14.4),(10.2,14.4),(10.2,11.4),(12,11.4),(12,11)],BL); end(12,11,BL)
T(11.0,17.6,'(female–male\njumper wires)',fontsize=8,color='#444')
# ---- buzzer on board: – leg col 12 row c, + leg col 15 row c ----
ax.add_patch(Circle((13.5,8.0),1.45,fc='#1a1a1a',ec='k',zorder=8,alpha=0.93)); ax.add_patch(Circle((13.5,8.0),0.3,fc='#999',zorder=9))
T(15.3,9.6,'+',color=R,fontsize=16,weight='bold',zorder=11); T(11.0,9.6,'–',fontsize=16,weight='bold',zorder=11)
T(17.6,8.9,'Active buzzer\n– leg → 12c\n+ leg → 15c',va='center',fontsize=10,weight='bold',bbox=dict(fc='white',ec='none',pad=1))
ax.add_patch(Circle((12,9),0.24,fc='#ccc',ec='k',zorder=10)); ax.add_patch(Circle((15,9),0.24,fc='#ccc',ec='k',zorder=10))
wire([(15,11),(15,12.0),(16,12.0),(16,TOPP)],R,3.5); end(15,11,R); end(16,TOPP,R)
T(16.3,10.9,'15a → + rail (16)',fontsize=9,color=R,weight='bold',bbox=dict(fc='white',ec='none',pad=1))
T(15.5,23,'BREADBOARD LAYOUT — IR sensor + buzzer only',ha='center',fontsize=16,weight='bold')
steps=['1  Battery + → switch IN.   Switch OUT → top + rail (1).',
       '2  Battery – → top – rail (2).',
       '3  IR VCC → + rail (8).   IR GND → – rail (6).   IR OUT → hole 12a.',
       '4  Buzzer: – leg in 12c, + leg in 15c.   Jumper 15a → + rail (16).',
       '5  Switch ON. Wave your hand 5–15 cm in front of the IR LEDs → beep.',
       '6  Adjust range with the blue knob on the IR module.']
for i,s in enumerate(steps): T(-11,-3.4-i*0.0 - 0 if False else 9.0-i*1.05,s,fontsize=10,ha='left',va='center',bbox=None) if False else None
T(-11.5,-4.9,'\n'.join(steps),fontsize=10.5,va='top',family='monospace')
ax.set_ylim(-11.5,24)
plt.savefig('ir_only_breadboard.png',dpi=140,bbox_inches='tight',facecolor='white')
