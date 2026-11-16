import schemdraw, schemdraw.elements as elm
import matplotlib; matplotlib.use("Agg")
schemdraw.config(fontsize=11)
d = schemdraw.Drawing(show=False)
d.config(unit=2.5)
VCC_Y, GND_Y = 10, 0
# battery + switch
bat = d.add(elm.BatteryCell().up().at((0,GND_Y)).to((0,6)).label('4.5 V\n(3×AA)', loc='bottom'))
d.add(elm.Line().up().at((0,6)).to((0,VCC_Y)))
d.add(elm.Switch().right().at((0,VCC_Y)).to((2.5,VCC_Y)).label('Rocker\nswitch'))
d.add(elm.Line().right().at((2.5,VCC_Y)).to((27,VCC_Y)).color('red'))
d.add(elm.Label().at((14,VCC_Y+0.5)).label('+VCC rail (red)', color='red'))
d.add(elm.Line().right().at((0,GND_Y)).to((27,GND_Y)))
d.add(elm.Label().at((14,GND_Y-0.6)).label('GND rail (black) — every "–"/GND pin goes here'))

# ---- IR module (box) ----
ir = d.add(elm.Ic(pins=[elm.IcPin(name='VCC', side='top', slot='1/3'),
                         elm.IcPin(name='GND', side='bot', slot='1/3'),
                         elm.IcPin(name='OUT', side='right', slot='1/1')],
                   size=(2.2,2.2), label='IR obstacle\nmodule\n(OUT=LOW\non detect)', lblsize=9).at((3.5,6)).anchor('center'))
d.add(elm.Line().at(ir.VCC).toy(VCC_Y).color('red'))
d.add(elm.Line().at(ir.GND).toy(GND_Y))
d.add(elm.Diode().right().at(ir.OUT).to((9,ir.OUT[1])).label('D1\n1N4148', loc='bottom').reverse())
TRIG_X = 13
d.add(elm.Line().right().at((9,ir.OUT[1])).to((TRIG_X,ir.OUT[1])).color('blue'))

# ---- Piezo module ----
pz = d.add(elm.Ic(pins=[elm.IcPin(name='+', side='top', slot='1/2'),
                         elm.IcPin(name='–', side='bot', slot='1/2'),
                         elm.IcPin(name='S', side='right', slot='1/1'),
                         elm.IcPin(name='disc', side='left', slot='1/1')],
                   size=(2.2,2.2), label='Piezo\nmodule', lblsize=9).at((3.5,2.4)).anchor('center'))
d.add(elm.Line().at(pz['+']).toy(4.6).color('red'))
d.add(elm.Line().at((pz['+'][0],4.6)).to((pz['+'][0]-0.0,4.6)))
d.add(elm.Dot().at((pz['+'][0],4.6)))
d.add(elm.Line().at((pz['+'][0],4.6)).tox(1.2).color('red'))
d.add(elm.Line().at((1.2,4.6)).toy(VCC_Y-0.0).color('red'))
d.add(elm.Dot().at((1.2,VCC_Y)))
d.add(elm.Line().at(pz['–']).toy(GND_Y))
d.add(elm.Crystal().left().at(pz.disc).length(1.6).label('disc\n(red+black\nto screw\nterminal)', loc='bottom', fontsize=8))
d.add(elm.Resistor().right().at(pz.S).to((9.5,pz.S[1])).label('R1 10k'))
q = d.add(elm.BjtNpn(circle=True).anchor('base').at((9.5,pz.S[1])).label('Q1\nBC547', loc='right'))
d.add(elm.Line().at(q.emitter).toy(GND_Y))
d.add(elm.Line().at(q.collector).tox(TRIG_X).color('blue'))
d.add(elm.Line().at((TRIG_X,q.collector[1])).toy(ir.OUT[1]).color('blue'))
d.add(elm.Dot().at((TRIG_X,ir.OUT[1])))
# pull-up
d.add(elm.Resistor().up().at((TRIG_X,ir.OUT[1])).to((TRIG_X,VCC_Y)).label('R2 10k'))
d.add(elm.Dot().at((TRIG_X,VCC_Y)))

# ---- 555 ----
ic = d.add(elm.Ic(pins=[elm.IcPin(name='TRIG', pin='2', side='left', slot='1/3'),
                         elm.IcPin(name='THR', pin='6', side='left', slot='2/3'),
                         elm.IcPin(name='DIS', pin='7', side='left', slot='3/3'),
                         elm.IcPin(name='VCC', pin='8', side='top', slot='1/2'),
                         elm.IcPin(name='RST', pin='4', side='top', slot='2/2'),
                         elm.IcPin(name='GND', pin='1', side='bot', slot='1/2'),
                         elm.IcPin(name='CV', pin='5', side='bot', slot='2/2'),
                         elm.IcPin(name='OUT', pin='3', side='right', slot='1/1')],
                   size=(3,3.5), label='NE555', pinspacing=1).at((19,5)).anchor('center'))
d.add(elm.Line().at((TRIG_X,ir.OUT[1])).to((TRIG_X,ic.TRIG[1])).color('blue'))
d.add(elm.Line().at((TRIG_X,ic.TRIG[1])).to(ic.TRIG).color('blue'))
d.add(elm.Label().at((TRIG_X+1.5,ic.TRIG[1]-0.5)).label('TRIGGER\n(wired-OR)', color='blue', fontsize=9))
d.add(elm.Line().at(ic.VCC).toy(VCC_Y).color('red'))
d.add(elm.Line().at(ic.RST).toy(VCC_Y).color('red'))
d.add(elm.Line().at(ic.GND).toy(GND_Y))
d.add(elm.Capacitor().down().at(ic.CV).toy(GND_Y).label('C2\n10nF', loc='bottom'))
# timing
TX = 15.5
d.add(elm.Line().at(ic.THR).tox(TX))
d.add(elm.Line().at(ic.DIS).tox(TX))
d.add(elm.Line().at((TX,ic.THR[1])).to((TX,ic.DIS[1])))
d.add(elm.Dot().at((TX,ic.DIS[1])))
d.add(elm.Resistor().up().at((TX,ic.DIS[1])).to((TX,VCC_Y)).label('R3\n270k', loc='bottom'))
d.add(elm.Dot().at((TX,VCC_Y)))
d.add(elm.Capacitor(polar=True).down().at((TX,ic.THR[1])).to((TX,GND_Y)).label('C1 10µF\n(≈3 s)', loc='bottom'))
d.add(elm.Dot().at((TX,GND_Y)))
# buzzer
d.add(elm.Line().right().at(ic.OUT).to((25,ic.OUT[1])))
d.add(elm.Line().down().at((25,ic.OUT[1])).length(0.3))
d.add(elm.Label().at((25.25,ic.OUT[1]-0.45)).label('+', color='red'))
d.add(elm.RBox().down().at((25,ic.OUT[1]-0.3)).to((25,1.5)).label('ACTIVE\nBUZZER\n5 V', loc='right', ofst=0.3))
d.add(elm.Label().at((25.25,1.7)).label('–'))
d.add(elm.Line().at((25,1.5)).toy(GND_Y))
d.add(elm.Label().at((14,-2)).label('CORRECTED: piezo press OR IR detect → 555 rings buzzer ~3 s.  All grounds common.', fontsize=12))
d.save('corrected_schematic.png', dpi=160)
