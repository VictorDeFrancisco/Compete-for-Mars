export type TriviaCategory =
  | 'Life Support'
  | 'Radiation'
  | 'Power & Orbit'
  | 'Space Farming'
  | 'Lunar & Mars';

export interface TriviaQuestion {
  id: string;
  category: TriviaCategory;
  prompt: string;
  options: readonly [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  fact: string;
}

/**
 * Curated NASA Space Apps / Junior Astronaut Mission Trainer questions.
 * Facts are grounded in NASA ECLSS, Artemis, Mars Science, Kilopower/FSP, Veggie, and Moon Survival data.
 */
export const NASA_TRIVIA_QUESTIONS: readonly TriviaQuestion[] = [
  {
    id: 'eclss-water-recycling',
    category: 'Life Support',
    prompt: 'Roughly what percentage of water does NASA’s ISS Water Recovery System recycle from urine, sweat, and cabin humidity?',
    options: ['90% to 98%', '15% to 25%', '40% to 50%', '100% with zero loss'],
    correctIndex: 0,
    fact: 'NASA’s Environmental Control and Life Support System (ECLSS) recovers about 90%–98% of station water.',
  },
  {
    id: 'eclss-oxygen-electrolysis',
    category: 'Life Support',
    prompt: 'How does the Oxygen Generation System on the International Space Station produce breathable oxygen?',
    options: [
      'By splitting water through electrolysis',
      'By burning solid rocket propellant',
      'By freezing carbon dioxide into dry ice',
      'By extracting argon from solar wind',
    ],
    correctIndex: 0,
    fact: 'The Oxygen Generation System uses electrolysis to split purified water into oxygen for the crew and hydrogen.',
  },
  {
    id: 'moon-survival-matches',
    category: 'Life Support',
    prompt: 'In NASA’s classic "Survival on the Moon" exercise, why is a box of matches rated the least useful item?',
    options: [
      'There is no oxygen on the Moon to sustain combustion',
      'Lunar gravity is too weak for a spark to form',
      'Moon dust puts out flames instantaneously',
      'Matches freeze solid inside pressurized suits',
    ],
    correctIndex: 0,
    fact: 'Without an oxygen-rich atmosphere on the lunar surface, ordinary matches cannot ignite or burn.',
  },
  {
    id: 'moon-survival-compass',
    category: 'Lunar & Mars',
    prompt: 'Why will a standard magnetic compass fail to guide astronauts across the lunar surface?',
    options: [
      'The Moon lacks a global polarized magnetic field',
      'Lunar cold locks the compass needle in place',
      'Sunlight bends magnetic waves away from the poles',
      'Iron inside spacesuits pulls the needle straight up',
    ],
    correctIndex: 0,
    fact: 'NASA ranks the magnetic compass 14th out of 15 survival items because the Moon has no global magnetic field.',
  },
  {
    id: 'lunar-night-power',
    category: 'Power & Orbit',
    prompt: 'Why do solar panels alone struggle to power a permanent outpost across most of the Moon?',
    options: [
      'A single lunar night lasts about 14 Earth days of darkness',
      'Sunlight never reaches the lunar surface',
      'Lunar windstorms bury solar panels every week',
      'Solar panels melt after 24 hours in vacuum',
    ],
    correctIndex: 0,
    fact: 'Because a lunar day-night cycle takes ~29.5 Earth days, bases face roughly 14 continuous days of darkness.',
  },
  {
    id: 'fission-surface-power',
    category: 'Power & Orbit',
    prompt: 'What technology do NASA’s Kilopower and Fission Surface Power projects use to deliver steady power through lunar nights?',
    options: [
      'Compact nuclear fission reactors',
      'Geothermal steam turbines',
      'High-altitude wind sails',
      'Coal and hydrogen fuel furnaces',
    ],
    correctIndex: 0,
    fact: 'Small fission reactors operate independently of sunlight, making them ideal for the 14-day lunar night and shadowed craters.',
  },
  {
    id: 'radiation-earth-shield',
    category: 'Radiation',
    prompt: 'What naturally shields people on Earth and astronauts in low-Earth orbit from most deep-space radiation?',
    options: [
      'Earth’s magnetic field and atmosphere',
      'The Moon’s gravitational shadow',
      'Clouds of nitrogen in the stratosphere',
      'The asteroid belt between Earth and Mars',
    ],
    correctIndex: 0,
    fact: 'Once crews travel beyond Earth’s magnetosphere toward the Moon or Mars, exposure to cosmic rays and solar storms increases sharply.',
  },
  {
    id: 'radiation-regolith-shield',
    category: 'Radiation',
    prompt: 'Which local lunar material can astronauts pack over habitat domes to shield against space radiation?',
    options: [
      'Lunar regolith (crushed rock and dust)',
      'Liquid nitrogen frost',
      'Frozen carbon dioxide slabs',
      'Compressed helium pockets',
    ],
    correctIndex: 0,
    fact: 'Using local lunar soil (regolith) as a protective barrier reduces the heavy shielding mass launched from Earth.',
  },
  {
    id: 'artemis-water-ice',
    category: 'Lunar & Mars',
    prompt: 'Where are NASA’s Artemis missions targeting ancient water ice deposits on the Moon?',
    options: [
      'Permanently shadowed craters at the lunar South Pole',
      'Bright volcanic plains near the lunar equator',
      'High-altitude clouds above the lunar far side',
      'Liquid underground rivers beneath Sea of Tranquility',
    ],
    correctIndex: 0,
    fact: 'Deep craters near the lunar South Pole never see sunlight, keeping temperatures below -240°C so water ice can survive.',
  },
  {
    id: 'artemis-name-origin',
    category: 'Lunar & Mars',
    prompt: 'Why did NASA name its modern program to return humans to the Moon "Artemis"?',
    options: [
      'Artemis is the Greek goddess of the Moon and Apollo’s twin sister',
      'It stands for Advanced Rover Transit and Energy System',
      'It is named after the largest crater on Mars',
      'It honors the first solar-powered satellite launched in 1969',
    ],
    correctIndex: 0,
    fact: 'Following the 1960s–70s Apollo missions, NASA named the successor program after Apollo’s twin, Artemis.',
  },
  {
    id: 'mars-atmosphere-gas',
    category: 'Lunar & Mars',
    prompt: 'Which gas makes up roughly 95% of Mars’s very thin atmosphere?',
    options: ['Carbon dioxide', 'Oxygen', 'Nitrogen', 'Hydrogen'],
    correctIndex: 0,
    fact: 'Mars’s atmosphere is ~95% carbon dioxide with less than 1% oxygen and under 1% of Earth’s surface pressure.',
  },
  {
    id: 'mars-sol-length',
    category: 'Power & Orbit',
    prompt: 'Approximately how long is one solar day (called a "sol") on Mars?',
    options: ['24 hours and 39 minutes', '12 hours', '48 hours', '29.5 Earth days'],
    correctIndex: 0,
    fact: 'A Martian sol is very close to an Earth day at 24.6 hours, though a Martian year takes 687 Earth days.',
  },
  {
    id: 'mars-dust-storms',
    category: 'Power & Orbit',
    prompt: 'How did planet-wide Martian dust storms endanger solar-powered NASA missions like Opportunity and InSight?',
    options: [
      'Suspended dust blocked sunlight from reaching solar panels for weeks',
      'Acidic dust dissolved titanium rover frames within hours',
      'High atmospheric pressure crushed radio dishes flat',
      'Lightning strikes melted their nuclear reactors',
    ],
    correctIndex: 0,
    fact: 'Global dust storms on Mars can blanket the planet for months, starving solar arrays of sunlight.',
  },
  {
    id: 'mars-surface-gravity',
    category: 'Lunar & Mars',
    prompt: 'How strong is surface gravity on Mars compared to Earth’s gravity?',
    options: [
      'About 38% (roughly one-third) of Earth’s',
      'About 16% (roughly one-sixth) of Earth’s',
      'Almost identical to Earth’s at 98%',
      'Nearly double Earth’s gravity',
    ],
    correctIndex: 0,
    fact: 'Mars gravity is ~38% of Earth’s (while the Moon’s is ~16.5%), meaning a 100 lb object weighs about 38 lb on Mars.',
  },
  {
    id: 'veggie-vitamins',
    category: 'Space Farming',
    prompt: 'Why are fresh crops grown in NASA’s Veggie facility crucial for multi-year missions like Mars?',
    options: [
      'Vitamins like C, B1, and K degrade over time in packaged space food',
      'Astronauts lose the ability to swallow dry food after 30 days',
      'Plants absorb rocket exhaust inside the crew cabin',
      'Soil ballast keeps the spacecraft pointed toward Earth',
    ],
    correctIndex: 0,
    fact: 'Prepackaged food loses key nutrients over long voyages; fresh lettuce, tomatoes, and peppers help prevent deficiencies.',
  },
  {
    id: 'veggie-microgravity-watering',
    category: 'Space Farming',
    prompt: 'Why can’t astronauts water plants with a normal watering can in microgravity?',
    options: [
      'Water floats and pools instead of draining downward, drowning roots',
      'Water boils away instantly at room temperature in space',
      'Gravity reversal pushes soil out of the airlock',
      'Plant roots turn rigid and repel liquid water',
    ],
    correctIndex: 0,
    fact: 'NASA’s Veggie unit uses "plant pillows" and passive wicking mats so roots receive moisture without suffocating.',
  },
];
