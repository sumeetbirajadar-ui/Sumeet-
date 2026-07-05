export interface Quote { text: string; source: string; }

export const QUOTES: Quote[] = [
  { text: 'You have the right to work, but never to the fruit of work.', source: 'Bhagavad Gita 2.47' },
  { text: 'The soul is neither born, and nor does it die.', source: 'Bhagavad Gita 2.20' },
  { text: 'A person can rise through the efforts of his own mind; or draw himself down, in the same manner.', source: 'Bhagavad Gita 6.5' },
  { text: 'There is neither this world nor the world beyond nor happiness for the one who doubts.', source: 'Bhagavad Gita 4.40' },
  { text: 'Change is the law of the universe. You can be a millionaire, or a pauper in an instant.', source: 'Bhagavad Gita 2.14' },
  { text: 'Set thy heart upon thy work, but never on its reward.', source: 'Bhagavad Gita 2.47' },
  { text: 'The mind acts like an enemy for those who do not control it.', source: 'Bhagavad Gita 6.6' },
  { text: 'Whatever happened, happened for the good. Whatever is happening, is happening for the good.', source: 'Bhagavad Gita' },
  { text: 'Man is made by his belief. As he believes, so he is.', source: 'Bhagavad Gita 17.3' },
  { text: 'It is better to live your own destiny imperfectly than to live an imitation of somebody else’s life with perfection.', source: 'Bhagavad Gita 18.47' },
  { text: 'Yoga is the journey of the self, through the self, to the self.', source: 'Bhagavad Gita 6.20' },
  { text: 'Om Saha Naavavatu, Saha Nau Bhunaktu — May we be protected together, may we be nourished together.', source: 'Taittiriya Upanishad' },
  { text: 'Uttishthata Jagrata Prapya Varan Nibodhata — Arise, awake, and stop not until the goal is reached.', source: 'Katha Upanishad (via Swami Vivekananda)' },
  { text: 'Tamso Ma Jyotir Gamaya — Lead me from darkness to light.', source: 'Brihadaranyaka Upanishad' },
  { text: 'The compound effect of small, smart choices repeated daily is the surest path to an extraordinary life.', source: 'Darren Hardy, The Compound Effect' },
  { text: 'Every action you take is a vote for the type of person you wish to become.', source: 'James Clear, Atomic Habits' },
  { text: 'Missing once is an accident. Missing twice is the start of a new habit.', source: 'James Clear, Atomic Habits' },
  { text: 'Discipline equals freedom.', source: 'Jocko Willink' },
  { text: 'The mind is not to be tamed, but trained.', source: 'Swami Vivekananda' },
  { text: 'You do not rise to the level of your goals; you fall to the level of your systems.', source: 'James Clear' },
];

export function quoteOfTheDay(dateISO: string, offset = 0): Quote {
  const d = new Date(dateISO);
  const dayNum = Math.floor(d.getTime() / 86400000);
  return QUOTES[(dayNum + offset) % QUOTES.length];
}
