import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle, FancyBboxPatch
R,K,BL='#d62728','#111','#1f4fd1'
fig,ax=plt.subplots(figsize=(15,8.6)); ax.set_xlim(-0.5,18); ax.set_ylim(-2.2,11.5); ax.axis('off'); ax.set_aspect('equal')
def L(p,c=K,w=3): xs,ys=zip(*p); ax.plot(xs,ys,color=c,lw=w,solid_capstyle='round',zorder=2)
def dot(x,y,c): ax.add_patch(Circle((x,y),0.14,color=c,zorder=5))
def T(x,y,s,**k): k.setdefault('fontsize',12); ax.text(x,y,s,zorder=6,**k)
def box(x,y,w,h,t,fc): ax.add_patch(FancyBboxPatch((x,y),w,h,boxstyle='round,pad=0.05',fc=fc,ec=K,lw=2)); T(x+w/2,y+h/2,t,ha='center',va='center',weight='bold',fontsize=12)
T(8.5,11,'PRESSURE ALARM — pressure pad + buzzer only',ha='center',fontsize=15,weight='bold')
VY,GY=9.5,0.5
# battery + switch
for wd,yy in [(0.6,5.4),(0.35,5.1),(0.6,4.8),(0.35,4.5)]: L([(1-wd,yy),(1+wd,yy)],K,3)
T(1.8,4.9,'Battery\n3×AA = 4.5 V\n(2×AA: weaker)',fontsize=10,va='center')
L([(1,5.4),(1,VY)],R); L([(1,4.5),(1,GY)],K)
ax.add_patch(Circle((2.2,VY),0.12,fill=False,lw=2)); ax.add_patch(Circle((3.4,VY),0.12,fill=False,lw=2)); L([(2.3,VY+0.05),(3.3,VY+0.6)],K,2)
L([(1,VY),(2.08,VY)],R); T(2.8,VY+0.8,'Rocker',ha='center',fontsize=10)
L([(3.52,VY),(9,VY)],R); T(5.6,VY+0.25,'RED wire (+) after switch',color=R,ha='center',fontsize=11,weight='bold')
L([(1,GY),(9,GY)],K); T(5,GY-0.7,'BLACK wire (–) to battery minus',ha='center',fontsize=11,weight='bold')
X=9
# buzzer
ax.add_patch(Circle((X,7.6),0.95,fc='#222',ec=K,zorder=3)); ax.add_patch(Circle((X,7.6),0.18,fc='#aaa',zorder=4))
L([(X,8.55),(X,VY)],R); dot(X,VY,R); L([(X,6.65),(X,4.6)],BL)
T(X+0.35,8.75,'+',color=R,fontsize=15,weight='bold'); T(X+0.35,6.3,'–',fontsize=15,weight='bold')
T(X+1.3,7.6,'Active buzzer\n+ to RED\n– to BLUE',va='center',ha='left',fontsize=11)
T(X+0.3,5.3,'BLUE wire',color=BL,fontsize=10,weight='bold')
# pad switch
ax.add_patch(Circle((X,4.45),0.13,fill=False,lw=2,zorder=4)); ax.add_patch(Circle((X,3.05),0.13,fill=False,lw=2,zorder=4))
L([(X-0.55,4.7),(X-0.55,2.8)],K,3); L([(X-1.1,3.75),(X-0.55,3.75)],K,2)
L([(X,2.92),(X,GY)],K); dot(X,GY,K)
T(X+0.5,4.1,'Pressure pad\n(or push button)',fontsize=11,weight='bold')
T(X+0.5,3.0,'foil 1 → BLUE\nfoil 2 → BLACK',fontsize=10)
# pad detail
PDX=13.0
ax.add_patch(Rectangle((PDX,4.3),3.4,0.2,fc='#c0c0c0',ec=K,zorder=3))
ax.add_patch(Rectangle((PDX,3.8),3.4,0.5,fc='#ffe9a8',ec=K,zorder=3))
for xx in [PDX+0.6,PDX+1.7,PDX+2.8]: ax.add_patch(Rectangle((xx-0.22,3.8),0.44,0.5,fc='white',ec=K,lw=1,zorder=4))
ax.add_patch(Rectangle((PDX,3.6),3.4,0.2,fc='#c0c0c0',ec=K,zorder=3))
T(PDX+1.7,4.8,'How to make the pad (side view)',ha='center',fontsize=10,weight='bold')
T(PDX+1.7,3.3,'top: cardboard + aluminium foil (wire 1)\nmiddle: 3–5 mm foam, coin-size holes\nbottom: cardboard + foil (wire 2)\npress → foils touch → circuit closes',ha='center',va='top',fontsize=9)
T(0,-1.3,'Press the pad → foils touch → BLUE connects to BLACK → current flows through the buzzer → it rings while pressed.',fontsize=11)
T(0,-1.95,'If it rings with nobody pressing, the foils are touching: use thicker foam or smaller holes.',fontsize=11,color=R)
plt.savefig('pad_only_circuit.png',dpi=150,bbox_inches='tight',facecolor='white')
