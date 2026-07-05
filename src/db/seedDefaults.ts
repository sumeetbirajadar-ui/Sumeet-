import { Habit, LaunchChecklistItem, InventoryItem, ChapterPlan, AppSettings, DEFAULT_SETTINGS, SyllabusChapter } from '../types';
import { uid, nowISO } from './types';
import { getAll, bulkPut, put } from './index';
import { buildSyllabusSeed } from './seedSyllabus';

function habit(partial: Partial<Habit> & Pick<Habit, 'name' | 'category' | 'icon'>): Habit {
  return {
    id: uid(),
    cue: '', reward: '', identityStatement: '', twoMinuteVersion: '',
    frequency: 'daily', isKeystone: false, isNegative: false, active: true,
    createdAt: nowISO(),
    ...partial,
  };
}

export function buildHabitSeed(): Habit[] {
  const wakeUp = habit({
    name: 'Wake up at 3:40 AM', category: 'Morning', icon: 'Sun', timeLabel: '3:40 AM',
    isKeystone: true, cue: 'Alarm at 3:40 AM', reward: 'Three uninterrupted deep-work hours before the world wakes up',
    identityStatement: 'I am a disciplined physics educator who owns the morning.',
    twoMinuteVersion: 'Just sit up and put both feet on the floor.',
  });
  const deepWork = habit({
    name: 'Deep Work block', category: 'Morning', icon: 'Briefcase', timeLabel: '4:00-7:00 AM',
    stackAfter: wakeUp.id, targetCount: 3, unit: 'hours',
    cue: 'After waking up', reward: 'Visible content/prep progress before college starts',
    identityStatement: 'I am someone who protects my deepest hours for my hardest work.',
  });
  const yoga = habit({
    name: 'Yoga & Pranayam', category: 'Morning', icon: 'Wind', timeLabel: '7:00-7:30 AM',
    stackAfter: deepWork.id, cue: 'After the deep work block', reward: 'A calm, energised body for the rest of the day',
    identityStatement: 'I am someone who trains my body and breath daily.',
    twoMinuteVersion: 'Just 5 slow breaths.',
  });
  const mcq = habit({
    name: '100 MCQs solved', category: 'Study', icon: 'CheckSquare', stackAfter: yoga.id,
    targetCount: 100, unit: 'MCQs', cue: 'After yoga', reward: 'Sharper problem-solving instincts, visible daily progress',
    identityStatement: 'I am a problem-solver who never lets a day pass without practice.',
    twoMinuteVersion: 'Just solve 5 MCQs.',
  });
  const boosters = habit({
    name: 'Test boosters & gut cleansers', category: 'Morning', icon: 'GlassWater',
    cue: 'With morning routine', reward: 'Better health and energy',
  });
  const noCollegeWork = habit({
    name: 'Never do college work at home', category: 'Boundaries', icon: 'Ban', isNegative: true,
    cue: 'Whenever tempted to open college work at home', reward: 'Protected family & personal time',
    identityStatement: 'I am someone who keeps clean boundaries between work and home.',
  });
  const bathA = habit({ name: 'Bath', category: 'Evening · Variant A (home 5:30 PM)', icon: 'Bath' });
  const meditationA = habit({ name: 'Meditation', category: 'Evening · Variant A (home 5:30 PM)', icon: 'User', timeLabel: '6:00-6:30 PM' });
  const wifeA = habit({ name: 'Wife time / Other', category: 'Evening · Variant A (home 5:30 PM)', icon: 'Heart', timeLabel: '6:30-8:30 PM' });
  const studyA = habit({ name: 'Study / Content management', category: 'Evening · Variant A (home 5:30 PM)', icon: 'FileText', timeLabel: '8:30-10:00 PM' });
  const bathB = habit({ name: 'Bath', category: 'Evening · Variant B (home 7:30 PM)', icon: 'Bath' });
  const wifeB = habit({ name: 'Wife time / Other', category: 'Evening · Variant B (home 7:30 PM)', icon: 'Heart', timeLabel: '8:00-9:00 PM' });
  const studyB = habit({ name: 'Study / Content management', category: 'Evening · Variant B (home 7:30 PM)', icon: 'FileText', timeLabel: '9:00-10:00 PM' });

  const hairDye = habit({ name: 'Beard/hair dye', category: 'Weekly Maintenance', icon: 'UserCircle', frequency: 'weekly', weekDays: [0, 3] });
  const hairOil = habit({ name: 'Hair oil / massage', category: 'Weekly Maintenance', icon: 'Droplets', frequency: 'weekly', weekDays: [6, 2] });
  const faceCare = habit({ name: 'Face / personal care wash & scrub', category: 'Weekly Maintenance', icon: 'Smile', frequency: 'weekly', weekDays: [0, 4, 1] });
  const calls = habit({ name: 'Calls to friends & family', category: 'Weekly Maintenance', icon: 'Phone', frequency: 'weekly', weekDays: [6, 0] });

  return [wakeUp, deepWork, yoga, mcq, boosters, noCollegeWork,
    bathA, meditationA, wifeA, studyA, bathB, wifeB, studyB,
    hairDye, hairOil, faceCare, calls];
}

const LAUNCH_CHECKLIST_SEED = [
  'Channel art & banner designed', 'Logo finalised', 'About section written',
  'Intro video recorded', 'Playlists created (NEET / KCET / JEE Main / JEE Advanced)',
  'First 3 videos ready', 'Thumbnail template designed', 'Upload schedule set (weekly)',
];

const INVENTORY_SEED: { name: string; category: string; restockEveryDays: number }[] = [
  { name: 'Razor blades', category: 'Grooming', restockEveryDays: 30 },
  { name: 'Beard/hair dye', category: 'Grooming', restockEveryDays: 45 },
  { name: 'Hair oil', category: 'Grooming', restockEveryDays: 60 },
  { name: 'Face wash', category: 'Grooming', restockEveryDays: 60 },
];

async function seedChapterPlanExamples(chapters: SyllabusChapter[]) {
  const findChapter = (needle: string) => chapters.find((c) => c.title.toLowerCase().includes(needle.toLowerCase()));

  const examples: { match: string; plan: Omit<ChapterPlan, 'id' | 'chapterId' | 'updatedAt'> }[] = [
    {
      match: 'Newton’s Laws of Motion (Without Friction)',
      plan: {
        coreConcept: 'Force as the cause of change in motion; inertia, F=ma, and action-reaction pairs.',
        learningObjectives: [
          'Start from everyday inertia observations (jerking a tablecloth, seatbelt lurch)',
          'Build up to F = ma with worked numericals',
          'Contrast with Aristotelian misconception "force is needed to sustain motion"',
          'Close with action-reaction pairs and common trick questions',
        ],
        extras: [
          { id: uid(), kind: 'analogy', title: 'Bus jerk analogy', detail: 'Standing in a moving bus that suddenly stops — your body wants to keep moving (inertia).' },
          { id: uid(), kind: 'demo', title: 'Coin-and-card flick', detail: 'Flick a card off a glass with a coin on top — coin drops straight into the glass.' },
          { id: uid(), kind: 'misconception', title: '"Force in direction of motion" myth', detail: 'Students think a thrown ball has a "force of throw" still acting on it in air — address directly with a free-body diagram.' },
        ],
        scientistStories: [
          { id: uid(), scientist: 'Isaac Newton', story: 'Newton formulated the three laws of motion in the Principia (1687), reportedly inspired by watching an apple fall and asking why the moon does not "fall" the same way.', relevance: 'Sets up the leap from local force to universal force students will meet again in Gravitation.' },
        ],
        miscNotes: ['Carry over the same FBD technique into the "With Friction" chapter next.'],
        status: 'ready',
      },
    },
    {
      match: 'Electromagnetic Induction',
      plan: {
        coreConcept: 'A changing magnetic flux induces an EMF — Faraday’s and Lenz’s laws.',
        learningObjectives: [
          'Recap magnetic flux from the Magnetism chapter',
          'Coil-and-magnet demo to motivate Faraday’s law qualitatively',
          'Derive Faraday’s law and introduce Lenz’s law as an energy-conservation check',
          'Connect to real devices: generators, induction cooktops, metal detectors',
        ],
        extras: [
          { id: uid(), kind: 'demo', title: 'Magnet-through-copper-pipe', detail: 'Drop a strong magnet through a copper pipe — it falls in visible slow motion due to induced eddy currents. Very high "wow" factor.' },
          { id: uid(), kind: 'application', title: 'Induction cooktop', detail: 'Explain why only ferromagnetic vessels work on an induction stove.' },
          { id: uid(), kind: 'mnemonic', title: 'Lenz = Laziness', detail: 'Induced current always opposes the change — nature is "lazy", resists being changed.' },
        ],
        scientistStories: [
          { id: uid(), scientist: 'Michael Faraday', story: 'Faraday, with almost no formal mathematical training, discovered electromagnetic induction in 1831 by moving a magnet through a coil of wire and noticing a momentary current.', relevance: 'A great "curiosity over credentials" story — motivates hands-on experimentation over rote formula memorising.' },
        ],
        miscNotes: [],
        status: 'ready',
      },
    },
    {
      match: 'Nuclei',
      plan: {
        coreConcept: 'Nuclear structure, binding energy, radioactivity, fission and fusion.',
        learningObjectives: [
          'Nuclear composition and notation (Z, A, N)',
          'Mass defect and binding energy curve — why fusion and fission both release energy',
          'Radioactive decay law and half-life',
        ],
        extras: [
          { id: uid(), kind: 'application', title: 'Carbon dating', detail: 'Use half-life of C-14 to date archaeological samples — ties decay law to a tangible real-world use.' },
        ],
        scientistStories: [
          { id: uid(), scientist: 'Marie Curie', story: 'Curie discovered polonium and radium and coined the term "radioactivity", winning Nobel Prizes in both Physics and Chemistry despite facing severe institutional discrimination.', relevance: 'Strong motivational story for perseverance alongside the decay-law numericals.' },
          { id: uid(), scientist: 'Ernest Rutherford', story: 'Rutherford’s gold foil experiment revealed the atomic nucleus by showing most alpha particles passed through foil while a few bounced straight back.', relevance: 'Bridges back to the Atoms chapter — the nucleus this chapter studies is the same one Rutherford discovered.' },
        ],
        miscNotes: [],
        status: 'ready',
      },
    },
    {
      match: 'Dual Nature of Radiation and Matter',
      plan: {
        coreConcept: 'Light behaves as both a wave and a particle (photon); matter shows wave-like behaviour (de Broglie).',
        learningObjectives: [
          'Photoelectric effect experiment and its wave-theory failures',
          'Einstein’s photon explanation, work function, stopping potential',
          'de Broglie wavelength and matter waves',
        ],
        extras: [
          { id: uid(), kind: 'misconception', title: '"Brighter light = more energetic electrons" myth', detail: 'Intensity increases the number of photoelectrons, not their kinetic energy — only frequency does. Worth a dedicated worked example.' },
        ],
        scientistStories: [
          { id: uid(), scientist: 'Albert Einstein', story: 'Einstein explained the photoelectric effect in 1905 by proposing light is quantised into photons — the work that won him the Nobel Prize (not relativity).', relevance: 'A fun surprise fact for students who assume Einstein = relativity only.' },
        ],
        miscNotes: [],
        status: 'ready',
      },
    },
  ];

  const plans: ChapterPlan[] = [];
  for (const ex of examples) {
    const ch = findChapter(ex.match);
    if (ch) plans.push({ id: uid(), chapterId: ch.id, updatedAt: nowISO(), ...ex.plan });
  }
  if (plans.length) await bulkPut('chapterPlans', plans);
}

// Module-level singleton so React StrictMode's double-invoked effect (or any
// other duplicate caller within the same session) can't race two seed runs
// against each other and double-insert every row.
let seedPromise: Promise<void> | null = null;

export function seedIfEmpty(): Promise<void> {
  if (!seedPromise) seedPromise = doSeedIfEmpty();
  return seedPromise;
}

async function doSeedIfEmpty(): Promise<void> {
  const [habits, chapters, plans, checklist, inventory, settings] = await Promise.all([
    getAll<Habit>('habits'),
    getAll<SyllabusChapter>('syllabusChapters'),
    getAll<ChapterPlan>('chapterPlans'),
    getAll<LaunchChecklistItem>('launchChecklist'),
    getAll<InventoryItem>('inventoryItems'),
    getAll<AppSettings>('settings'),
  ]);

  if (!habits.length) await bulkPut('habits', buildHabitSeed());

  let seededChapters = chapters;
  if (!chapters.length) {
    seededChapters = buildSyllabusSeed();
    await bulkPut('syllabusChapters', seededChapters);
  }
  if (!plans.length) await seedChapterPlanExamples(seededChapters);

  if (!checklist.length) {
    await bulkPut<LaunchChecklistItem>('launchChecklist', LAUNCH_CHECKLIST_SEED.map((label) => ({ id: uid(), label, done: false })));
  }
  if (!inventory.length) {
    await bulkPut<InventoryItem>('inventoryItems', INVENTORY_SEED.map((i) => ({ id: uid(), ...i })));
  }
  if (!settings.length) await put('settings', DEFAULT_SETTINGS);
}
