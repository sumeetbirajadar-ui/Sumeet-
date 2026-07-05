import { ExamTrack, SyllabusChapter } from '../types';
import { uid } from './types';

function mk(track: ExamTrack, order: number, title: string, volume?: string): SyllabusChapter {
  return {
    id: uid(), track, order, title, volume,
    completionPct: 0, mcqCount: 0, confidence: 1,
  };
}

const NCERT_11 = [
  'Units and Measurements', 'Motion in a Straight Line', 'Motion in a Plane', 'Laws of Motion',
  'Work, Energy and Power', 'System of Particles and Rotational Motion', 'Gravitation',
  'Mechanical Properties of Solids', 'Mechanical Properties of Fluids', 'Thermal Properties of Matter',
  'Thermodynamics', 'Kinetic Theory', 'Oscillations', 'Waves',
];

const NCERT_12 = [
  'Electric Charges and Fields', 'Electrostatic Potential and Capacitance', 'Current Electricity',
  'Moving Charges and Magnetism', 'Magnetism and Matter', 'Electromagnetic Induction',
  'Alternating Current', 'Electromagnetic Waves', 'Ray Optics and Optical Instruments', 'Wave Optics',
  'Dual Nature of Radiation and Matter', 'Atoms', 'Nuclei', 'Semiconductor Electronics',
];

const JEE_MAIN_UNITS = [
  'Units & Measurements', 'Kinematics', 'Laws of Motion', 'Work, Energy & Power', 'Rotational Motion',
  'Gravitation', 'Properties of Solids & Liquids', 'Thermodynamics', 'Kinetic Theory of Gases',
  'Oscillations & Waves', 'Electrostatics', 'Current Electricity',
  'Magnetic Effects of Current & Magnetism', 'EMI & Alternating Currents', 'Electromagnetic Waves',
  'Optics', 'Dual Nature of Matter & Radiation', 'Atoms & Nuclei', 'Electronic Devices',
  'Experimental Skills',
];

const JEE_ADV_SECTIONS: { title: string; notes: string }[] = [
  { title: 'General', notes: 'Units & dimensions; error analysis; experiments: Vernier callipers, screw gauge, simple pendulum g, Young’s modulus, surface tension, calorimetry, u–v method, resonance column, Ohm’s law, metre bridge, post office box.' },
  { title: 'Mechanics', notes: 'Kinematics (1D/2D, projectiles, relative velocity); Newton’s laws & friction; work-energy-power; COM & collisions; rigid-body rotation, moment of inertia, angular momentum, rolling; SHM (forced/damped, resonance); gravitation (Kepler, satellites, escape velocity); fluids (Pascal, buoyancy, surface tension, viscosity, Bernoulli); wave motion, strings/air columns, beats, Doppler in sound.' },
  { title: 'Thermal Physics', notes: 'Thermal expansion, calorimetry, conduction/convection/radiation, Newton’s cooling, ideal gas laws, Cv/Cp, isothermal/adiabatic, first & second law, Carnot, blackbody/Kirchhoff/Wien/Stefan.' },
  { title: 'Electricity and Magnetism', notes: 'Coulomb’s law, field/potential, Gauss’s law, capacitance & dielectrics, Ohm/Kirchhoff, Biot-Savart & Ampere, force on charge/wire, moving-coil galvanometer, EMI (Faraday/Lenz), self/mutual inductance, RC/LR/LC/LCR.' },
  { title: 'Electromagnetic Waves', notes: 'Characteristics and spectrum.' },
  { title: 'Optics', notes: 'Reflection/refraction, TIR, prism dispersion, thin lenses & mirror combinations; Huygen’s principle, Young’s double slit; single-slit diffraction, polarization, Brewster’s law, Polaroids.' },
  { title: 'Modern Physics', notes: 'Radioactivity (α/β/γ, decay law, half/mean life), binding energy, fission/fusion; photoelectric effect, Bohr model, X-rays & Moseley’s law, de Broglie wavelength.' },
];

const CENGAGE_VOLUMES: { volume: string; chapters: string[] }[] = [
  {
    volume: '1. Mechanics I',
    chapters: ['Dimensions & Measurement', 'Basic Mathematics', 'Vectors', 'Kinematics I', 'Kinematics II',
      'Newton’s Laws of Motion (Without Friction)', 'Newton’s Laws of Motion (With Friction)',
      'Work, Energy and Power', 'Circular Motion'],
  },
  {
    volume: '2. Mechanics II',
    chapters: ['System of Particles and Centre of Mass', 'Impulse and Collision', 'Rigid Body Dynamics Part 1',
      'Rigid Body Dynamics Part 2', 'Gravitation', 'Fluid Mechanics', 'Elasticity', 'Surface Tension and Viscosity'],
  },
  {
    volume: '3. Waves and Thermodynamics',
    chapters: ['Thermometry, Thermal Expansion & Calorimetry', 'Transmission of Heat', 'Kinetic Theory of Gases',
      'Thermodynamics', 'Linear & Angular SHM', 'Travelling Waves', 'Superposition & Standing Waves',
      'Sound Waves and Doppler Effect'],
  },
  {
    volume: '4. Electrostatics and Current Electricity',
    chapters: ['Coulomb’s Law and Electric Field', 'Electric Flux and Gauss’s Law', 'Electric Potential',
      'Capacitor and Capacitance', 'Electric Current and Circuits', 'Electrical Measuring Instruments',
      'Heating Effects of Current'],
  },
  {
    volume: '5. Magnetism and Electromagnetic Induction',
    chapters: ['Magnetic Field and Magnetic Forces', 'Sources of Magnetic Field',
      'Permanent Magnets and Magnetic Properties of Matter', 'Electromagnetic Induction', 'Inductance',
      'Alternating Current', 'Electromagnetic Waves'],
  },
  {
    volume: '6. Optics and Modern Physics',
    chapters: ['Geometrical Optics (Part 1)', 'Geometrical Optics (Part 2)', 'Wave Optics',
      'Diffraction and Polarization', 'Dual Nature of Radiation and Matter', 'Atomic Physics',
      'Nuclear Physics', 'Semiconductor/Electronic Devices', 'Communication Systems (edition-dependent)'],
  },
];

export function buildSyllabusSeed(): SyllabusChapter[] {
  const out: SyllabusChapter[] = [];
  let o = 1;
  NCERT_11.forEach((t) => out.push(mk('NEET', o++, `Class 11: ${t}`)));
  o = 1;
  NCERT_12.forEach((t) => out.push(mk('NEET', 100 + o++, `Class 12: ${t}`)));

  o = 1;
  out.push(mk('KCET', o++, '1st PUC: Physical World'));
  NCERT_11.forEach((t) => out.push(mk('KCET', o++, `1st PUC: ${t}`)));
  o = 1;
  NCERT_12.forEach((t) => out.push(mk('KCET', 100 + o++, `2nd PUC: ${t}`)));

  o = 1;
  JEE_MAIN_UNITS.forEach((t) => out.push(mk('JEE_MAIN', o++, t)));

  o = 1;
  JEE_ADV_SECTIONS.forEach((s) => {
    const ch = mk('JEE_ADVANCED', o++, s.title);
    ch.notes = s.notes;
    out.push(ch);
  });

  CENGAGE_VOLUMES.forEach((v, vi) => {
    let co = 1;
    v.chapters.forEach((t) => out.push(mk('CENGAGE', vi * 100 + co++, t, v.volume)));
  });

  return out;
}

export const TRACK_LABELS: Record<ExamTrack, string> = {
  NEET: 'NEET Physics',
  KCET: 'KCET Physics',
  JEE_MAIN: 'JEE Main Physics',
  JEE_ADVANCED: 'JEE Advanced Physics',
  CENGAGE: 'Cengage B.M. Sharma',
};
