import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle, FancyBboxPatch
R,K,BL='#d62728','#111','#1f4fd1'
fig,ax=plt.subplots(figsize=(15,8.6)); ax.set_xlim(-0.5,24); ax.set_ylim(-2.2,11.5); ax.axis('off'); ax.set_aspect('equal')
def L(p,c=K,w=3): xs,ys=zip(*p); ax.plot(xs,ys,color=c,lw=w,solid_capstyle='round',zorder=2)
def dot(x,y,c): ax.add_patch(Circle((x,y),0.14,color=c,zorder=5))
def T(x,y,s,**k): k.setdefault('fontsize',12); ax.text(x,y,s,zorder=6,**k)
def box(x,y,w,h,t,fc): ax.add_patch(FancyBboxPatch((x,y),w,h,boxstyle='round,pad=0.05',fc=fc,ec=K,lw=2)); T(x+w/2,y+h/2,t,ha='center',va='center',weight='bold',fontsize=12)
T(11.5,11,'IR SENSOR  OR  PRESS PAD → BUZZER  (no extra electronic parts)',ha='center',fontsize=15,weight='bold')
VY,GY=9.5,0.5
# battery + switch
for wd,yy in [(0.6,5.4),(0.35,5.1),(0.6,4.8),(0.35,4.5)]: L([(1-wd,yy),(1+wd,yy)],K,3)
T(1.8,4.9,'Battery\n3×AA = 4.5 V\n(2×AA: weaker)',fontsize=10,va='center')
L([(1,5.4),(1,VY)],R); L([(1,4.5),(1,GY)],K)
ax.add_patch(Circle((2.2,VY),0.12,fill=False,lw=2)); ax.add_patch(Circle((3.4,VY),0.12,fill=False,lw=2)); L([(2.3,VY+0.05),(3.3,VY+0.6)],K,2)
L([(1,VY),(2.08,VY)],R); T(2.8,VY+0.8,'Rocker',ha='center',fontsize=10)
L([(3.52,VY),(21,VY)],R); T(6.5,VY+0.25,'RED wire (+) after switch',color=R,ha='center',fontsize=11,weight='bold')
L([(1,GY),(21,GY)],K); T(6.5,GY-0.7,'BLACK wire (–) to battery minus',ha='center',fontsize=11,weight='bold')
# IR module (pins on right)
box(4.6,3.6,3.8,3.8,'IR obstacle\nmodule',"#dfe8fb")
for yy,n in [(6.5,'VCC'),(5.5,'OUT'),(4.5,'GND')]: T(8.25,yy,n,ha='right',va='center',fontsize=10)
L([(8.4,6.5),(9.5,6.5),(9.5,VY)],R); dot(9.5,VY,R)
L([(8.4,4.5),(10,4.5),(10,GY)],K); dot(10,GY,K)
L([(8.4,5.5),(15.6,5.5)],BL)
# push button / pressure pad
PX=17.5
L([(12,5.5),(PX,5.5),(PX,4.6)],BL)
ax.add_patch(Circle((PX,4.45),0.13,fill=False,lw=2,zorder=4)); ax.add_patch(Circle((PX,3.05),0.13,fill=False,lw=2,zorder=4))
L([(PX-0.55,4.7),(PX-0.55,2.8)],K,3); L([(PX-1.1,3.75),(PX-0.55,3.75)],K,2)  # plunger bar
L([(PX,2.92),(PX,GY)],K); dot(PX,GY,K)
T(PX+0.5,4.1,'Push button\nor pressure pad',fontsize=11,weight='bold')
T(PX+0.5,3.0,'one side → BLUE\nother side → BLACK',fontsize=10)
# pad detail
ax.add_patch(Rectangle((20.3,8.3),3.2,0.18,fc='#c0c0c0',ec=K,zorder=3))
ax.add_patch(Rectangle((20.3,7.85),3.2,0.45,fc='#ffe9a8',ec=K,zorder=3))
for xx in [20.9,21.9,22.9]: ax.add_patch(Rectangle((xx-0.2,7.85),0.4,0.45,fc='white',ec=K,lw=1,zorder=4))
ax.add_patch(Rectangle((20.3,7.67),3.2,0.18,fc='#c0c0c0',ec=K,zorder=3))
T(21.9,8.75,'DIY pressure pad (side view)',ha='center',fontsize=10,weight='bold')
T(21.9,7.3,'top: aluminium foil (wire 1)\nmiddle: foam with holes\nbottom: aluminium foil (wire 2)\npress → foils touch',ha='center',va='top',fontsize=9)
# buzzer
ax.add_patch(Circle((12,7.6),0.95,fc='#222',ec=K,zorder=3)); ax.add_patch(Circle((12,7.6),0.18,fc='#aaa',zorder=4))
L([(12,8.55),(12,VY)],R); dot(12,VY,R); L([(12,6.65),(12,5.5)],BL); dot(12,5.5,BL)
T(12.35,8.75,'+',color=R,fontsize=15,weight='bold'); T(12.35,6.3,'–',fontsize=15,weight='bold')
T(13.6,8.0,'Active buzzer:\n+ to RED\n– to BLUE',va='center',ha='left',fontsize=11)
T(12,5.0,'BLUE trigger wire',color=BL,ha='center',fontsize=11,weight='bold')
T(0,-1.3,'IR detects (OUT → 0 V)  OR  pad pressed (BLUE touches BLACK) → current flows through the buzzer → it rings while active.',fontsize=11)
T(0,-1.95,'Leave the – + S piezo module out. Never wire BLUE to BLACK permanently, or the buzzer rings all the time.',fontsize=11,color=R)
plt.savefig('ir_plus_pad_wiring.png',dpi=150,bbox_inches='tight',facecolor='white')
