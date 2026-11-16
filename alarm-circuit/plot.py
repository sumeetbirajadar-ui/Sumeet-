import numpy as np, matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
d=np.loadtxt('fixed.dat'); t=d[:,0]
fig,ax=plt.subplots(3,1,figsize=(12,7),sharex=True)
ax[0].plot(t,d[:,1],color='#1f4fd1'); ax[0].axhline(1.5,ls='--',color='gray'); ax[0].set_ylabel('TRIGGER pin 2 (V)')
ax[0].text(0.3,1.7,'555 fires below 1.5 V',fontsize=9,color='gray')
for x,s in [(1,'piezo tap\n(5 ms)'),(6,'IR detects\n(0.5 s)'),(10,'both at once')]: ax[0].annotate(s,(x,0.2),(x+0.3,2.3),fontsize=9,arrowprops=dict(arrowstyle='->'))
ax[1].plot(t,d[:,5],color='#e08a00'); ax[1].set_ylabel('Timing cap C1 (V)')
ax[2].plot(t,d[:,3],color='#d62728'); ax[2].set_ylabel('Buzzer voltage (V)'); ax[2].set_xlabel('time (s)')
for a in ax: a.grid(alpha=.3)
fig.suptitle('ngspice simulation of the corrected circuit — each event rings the buzzer ~3 s',fontsize=13)
plt.tight_layout(); plt.savefig('simulation.png',dpi=130)
