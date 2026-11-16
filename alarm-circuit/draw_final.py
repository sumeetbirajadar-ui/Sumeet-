import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle, FancyBboxPatch
R,K,BL='#d62728','#111','#1f4fd1'
fig,ax=plt.subplots(figsize=(15,8.6)); ax.set_xlim(-0.5,27); ax.set_ylim(-2.2,11.5); ax.axis('off'); ax.set_aspect('equal')
def L(p,c=K,w=3): xs,ys=zip(*p); ax.plot(xs,ys,color=c,lw=w,solid_capstyle='round',zorder=2)
def dot(x,y,c): ax.add_patch(Circle((x,y),0.14,color=c,zorder=5))
def T(x,y,s,**k): k.setdefault('fontsize',12); ax.text(x,y,s,zorder=6,**k)
def box(x,y,w,h,t,fc): ax.add_patch(FancyBboxPatch((x,y),w,h,boxstyle='round,pad=0.05',fc=fc,ec=K,lw=2)); T(x+w/2,y+h/2,t,ha='center',va='center',weight='bold',fontsize=12)
T(11.5,11,'IR SENSOR  OR  VIBRATION MODULE  OR  PRESS PAD → BUZZER',ha='center',fontsize=15,weight='bold')
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
box(4.6,3.6,3.8,3.8,'IR\nobstacle    \nmodule    ',"#dfe8fb")
for yy,n in [(6.5,'VCC'),(5.5,'OUT'),(4.5,'GND')]: T(8.25,yy,n,ha='right',va='center',fontsize=10)
L([(8.4,6.5),(9.5,6.5),(9.5,VY)],R); dot(9.5,VY,R)
L([(8.4,4.5),(10,4.5),(10,GY)],K); dot(10,GY,K)
L([(8.4,5.5),(16.8,5.5)],BL)
# vibration module (pins on left)
VX=16.8
box(VX,3.6,3.8,3.8,'   Vibration\n   module\n   (digital)',"#dfe8fb")
for yy,n in [(6.5,'VCC'),(5.5,'DO'),(4.5,'GND')]: T(VX+0.15,yy,n,ha='left',va='center',fontsize=10)
L([(VX,6.5),(15.8,6.5),(15.8,VY)],R); dot(15.8,VY,R)
L([(VX,4.5),(15.2,4.5),(15.2,GY)],K); dot(15.2,GY,K)
T(VX+1.9,3.0,'SW-420 / LM393 type\n(not the – + S module)',ha='center',va='top',fontsize=9)
# pressure pad / push button on the trigger line
PX=12
L([(PX,5.5),(PX,4.0)],BL)
ax.add_patch(Circle((PX,3.88),0.12,fill=False,lw=2,zorder=4)); ax.add_patch(Circle((PX,2.62),0.12,fill=False,lw=2,zorder=4))
L([(PX+0.5,4.1),(PX+0.5,2.4)],K,3); L([(PX+0.5,3.25),(PX+1.0,3.25)],K,2)
L([(PX,2.5),(PX,GY)],K); dot(PX,GY,K)
T(PX+0.7,1.5,'Pressure pad /\npush button',va='center',fontsize=9.5,weight='bold')
# pad construction detail
for (y,h,fc) in [(9.95-1.2,0.18,'#c0c0c0'),(9.5-1.2,0.45,'#ffe9a8'),(9.32-1.2,0.18,'#c0c0c0')]: ax.add_patch(Rectangle((21.6,y),3.2,h,fc=fc,ec=K,zorder=3))
for xx in [22.2,23.2,24.2]: ax.add_patch(Rectangle((xx-0.2,8.3),0.4,0.45,fc='white',ec=K,lw=1,zorder=4))
T(23.2,9.15,'DIY pad (side view)',ha='center',fontsize=9,weight='bold')
T(23.2,7.95,'foil / foam with holes / foil',ha='center',va='top',fontsize=8.5)
# buzzer
ax.add_patch(Circle((12,7.6),0.95,fc='#222',ec=K,zorder=3)); ax.add_patch(Circle((12,7.6),0.18,fc='#aaa',zorder=4))
L([(12,8.55),(12,VY)],R); dot(12,VY,R); L([(12,6.65),(12,5.5)],BL); dot(12,5.5,BL)
T(12.35,8.75,'+',color=R,fontsize=15,weight='bold'); T(12.35,6.3,'–',fontsize=15,weight='bold')
T(13.2,8.2,'Active buzzer\n+ to RED\n– to BLUE',va='center',ha='left',fontsize=10)
T(8.7,5.75,'BLUE trigger',color=BL,ha='left',fontsize=10,weight='bold')
T(0,-1.3,'Any one (or more) of: IR detects / vibration detected / pad pressed → BLUE pulled to 0 V → buzzer rings while active.',fontsize=11)
T(0,-1.95,'All three are switches to ground in parallel (wired-OR). Never wire BLUE straight to BLACK, or the buzzer rings all the time.',fontsize=11,color=R)
plt.savefig('final_circuit_diagram.png',dpi=150,bbox_inches='tight',facecolor='white')
