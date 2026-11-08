export type QuestionType = 'survey-mc' | 'trivia-mc' | 'survey-rating' | 'free-response' | 'yes-no';

export interface Choice {
  label: string;
  correct?: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  subtext?: string;
  choices?: Choice[];
  timeLimit?: number; // seconds
  points?: number;
  ratingLabels?: string[];
}

export const questions: Question[] = [
  // ── Survey MC ───────────────────────────────────────────────
  {
    id: 'q1',
    type: 'survey-mc',
    text: 'Did you know about AWS and A10 before attending?',
    subtext: 'All answers earn 100 points!',
    choices: [
      { label: '🌐 Both AWS & A10' },
      { label: '☁️ Just AWS' },
      { label: '🔷 Just A10' },
      { label: '🆕 Neither' },
    ],
    points: 100,
  },

  // ── Trivia ───────────────────────────────────────────────────
  {
    id: 't1',
    type: 'trivia-mc',
    text: '⚡ TRIVIA: What does EC2 stand for?',
    choices: [
      { label: 'Elastic Compute Cloud', correct: true },
      { label: 'Extended Cloud Computing' },
      { label: 'Enterprise Core Cluster' },
      { label: 'Elastic Container Config' },
    ],
    points: 200,
  },

  // ── Rating ───────────────────────────────────────────────────
  {
    id: 'q2',
    type: 'survey-rating',
    text: 'Rate your experience (1–5)',
    subtext: 'All ratings earn points. Be honest!',
    ratingLabels: [
      'Pre-hackathon Info',
      'Check-in Process',
      'Venue (Heafey Hall)',
      'Mentorship & Help',
      'Workshops',
      'Food',
      'Prizes',
      'Judging System',
    ],
    points: 50,
  },

  // ── Trivia ───────────────────────────────────────────────────
  {
    id: 't2',
    type: 'trivia-mc',
    text: '⚡ TRIVIA: Which AWS service runs code without managing servers?',
    choices: [
      { label: 'AWS Lambda', correct: true },
      { label: 'AWS Glue' },
      { label: 'AWS Batch' },
      { label: 'Amazon ECS' },
    ],
    points: 200,
  },

  // ── Free Response ────────────────────────────────────────────
  {
    id: 'q3',
    type: 'free-response',
    text: 'How have you benefited from the hackathon?',
    subtext: 'Did you learn AWS technologies that will benefit your career?',
    timeLimit: 90,
    points: 300,
  },

  // ── Trivia ───────────────────────────────────────────────────
  {
    id: 't3',
    type: 'trivia-mc',
    text: '⚡ TRIVIA: What year did AWS officially launch publicly?',
    choices: [
      { label: '2004' },
      { label: '2006', correct: true },
      { label: '2008' },
      { label: '2010' },
    ],
    points: 200,
  },

  // ── Free Response ────────────────────────────────────────────
  {
    id: 'q4',
    type: 'free-response',
    text: 'How could we make it better?',
    subtext: 'What changes would have improved the hackathon or your project?',
    timeLimit: 90,
    points: 300,
  },

  // ── Trivia ───────────────────────────────────────────────────
  {
    id: 't4',
    type: 'trivia-mc',
    text: '⚡ TRIVIA: What does S3 stand for in Amazon S3?',
    choices: [
      { label: 'Super Secure Storage' },
      { label: 'Simple Scalable Service' },
      { label: 'Simple Storage Service', correct: true },
      { label: 'Serverless Storage System' },
    ],
    points: 200,
  },

  // ── Yes/No ───────────────────────────────────────────────────
  {
    id: 'q5',
    type: 'yes-no',
    text: 'Would you participate in AWS x A10 Hack again next year?',
    choices: [
      { label: '🙌 Yes!' },
      { label: '😐 Maybe' },
      { label: '❌ No' },
    ],
    points: 100,
  },

  // ── Trivia ───────────────────────────────────────────────────
  {
    id: 't5',
    type: 'trivia-mc',
    text: '⚡ TRIVIA: Which data structure uses LIFO (Last In, First Out)?',
    choices: [
      { label: 'Queue' },
      { label: 'Stack', correct: true },
      { label: 'Heap' },
      { label: 'Tree' },
    ],
    points: 200,
  },

  // ── Free Response ────────────────────────────────────────────
  {
    id: 'q6',
    type: 'free-response',
    text: 'Any lasting questions or comments?',
    subtext: 'Anything else you want the organizers to know?',
    timeLimit: 60,
    points: 200,
  },

  // ── Free Response (optional contact) ────────────────────────
  {
    id: 'q7',
    type: 'free-response',
    text: 'Name & Email (optional)',
    subtext: 'Only fill this in if you want us to follow up on your comments.',
    timeLimit: 45,
    points: 50,
  },
];
