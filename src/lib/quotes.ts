export interface Quote {
  text: string;
  author: string;
  category: 'science' | 'gita' | 'grit' | 'habit';
}

export const QUOTES: Quote[] = [
  { text: 'I was taught that the way of progress was neither swift nor easy.', author: 'Marie Curie', category: 'science' },
  { text: 'If you thought that science was certain — well, that is just an error on your part.', author: 'Richard Feynman', category: 'science' },
  { text: 'Excellence is not a skill, it is an attitude.', author: 'A.P.J. Abdul Kalam', category: 'science' },
  { text: 'Dream is not that which you see while sleeping, it is something that does not let you sleep.', author: 'A.P.J. Abdul Kalam', category: 'science' },
  { text: 'The important thing is not to stop questioning.', author: 'Albert Einstein', category: 'science' },
  { text: 'Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.', author: 'Richard Feynman', category: 'science' },
  { text: 'In science, there are no shortcuts to truth.', author: 'Karl Popper', category: 'science' },
  { text: 'Somewhere, something incredible is waiting to be known.', author: 'Carl Sagan', category: 'science' },
  { text: 'You have the right to work, but never to the fruit of work.', author: 'Bhagavad Gita 2.47', category: 'gita' },
  { text: 'Perform your duty with a calm mind, abandoning attachment to success or failure.', author: 'Bhagavad Gita 2.48', category: 'gita' },
  { text: 'A person can rise through the efforts of their own mind, or draw themselves down in the same manner.', author: 'Bhagavad Gita 6.5', category: 'gita' },
  { text: 'There is neither this world, nor the world beyond, nor happiness, for the one who doubts.', author: 'Bhagavad Gita 4.40', category: 'gita' },
  { text: 'Set thy heart upon thy work, but never on its reward.', author: 'Bhagavad Gita 2.47', category: 'gita' },
  { text: 'Grit is passion and perseverance for very long-term goals.', author: 'Angela Duckworth', category: 'grit' },
  { text: 'Our potential is one thing. What we do with it is quite another.', author: 'Angela Duckworth', category: 'grit' },
  { text: 'In the growth mindset, failure is information — we label it failure, but it’s more like, "I’m not there yet."', author: 'Carol Dweck', category: 'grit' },
  { text: 'It’s not always the people who start out the smartest who end up the smartest.', author: 'Carol Dweck', category: 'grit' },
  { text: 'Enthusiasm is common. Endurance is rare.', author: 'Angela Duckworth', category: 'grit' },
  { text: 'Effort counts twice.', author: 'Angela Duckworth', category: 'grit' },
  { text: 'The future depends on what you do today.', author: 'Mahatma Gandhi', category: 'grit' },
  { text: 'Fall seven times, stand up eight.', author: 'Japanese Proverb', category: 'grit' },
  { text: 'You do not rise to the level of your goals. You fall to the level of your systems.', author: 'James Clear', category: 'habit' },
  { text: 'Every action you take is a vote for the type of person you wish to become.', author: 'James Clear', category: 'habit' },
  { text: 'Habits are the compound interest of self-improvement.', author: 'James Clear', category: 'habit' },
  { text: 'You should be far more concerned with your current trajectory than with your current results.', author: 'James Clear', category: 'habit' },
  { text: 'Missing once is an accident. Missing twice is the start of a new habit.', author: 'James Clear', category: 'habit' },
  { text: 'Small habits don’t add up. They compound.', author: 'James Clear', category: 'habit' },
  { text: 'The best way to change your habits is to focus not on what you want to achieve, but on who you wish to become.', author: 'James Clear', category: 'habit' },
  { text: 'Success is the product of daily habits — not once-in-a-lifetime transformations.', author: 'James Clear', category: 'habit' },
  { text: 'Motivation is what gets you started. Habit is what keeps you going.', author: 'Jim Ryun', category: 'habit' },
  { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Will Durant (on Aristotle)', category: 'habit' },
  { text: 'The chief danger in life is that you may take too many precautions.', author: 'Alfred Adler', category: 'grit' },
  { text: 'Nothing in life is to be feared, it is only to be understood.', author: 'Marie Curie', category: 'science' },
  { text: 'The man who moves a mountain begins by carrying away small stones.', author: 'Confucius', category: 'grit' },
  { text: 'It always seems impossible until it’s done.', author: 'Nelson Mandela', category: 'grit' },
  { text: 'Do not let what you cannot do interfere with what you can do.', author: 'John Wooden', category: 'grit' },
  { text: 'The mind is everything. What you think you become.', author: 'attributed to the Buddha', category: 'gita' },
  { text: 'The soul is neither born, and nor does it die.', author: 'Bhagavad Gita 2.20', category: 'gita' },
  { text: 'Change is the law of the universe.', author: 'Bhagavad Gita 2.14', category: 'gita' },
  { text: 'There is nothing lost in this endeavour, and no adverse result exists.', author: 'Bhagavad Gita 2.40', category: 'gita' },
  { text: 'Physics isn’t the most important thing. Love is.', author: 'Richard Feynman', category: 'science' },
];

export function getQuoteOfDay(dateStr?: string): Quote {
  const d = dateStr || new Date().toISOString().split('T')[0];
  let hash = 0;
  for (let i = 0; i < d.length; i++) hash = (hash * 31 + d.charCodeAt(i)) >>> 0;
  return QUOTES[hash % QUOTES.length];
}
