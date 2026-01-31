
export enum Difficulty {
  BASIC = 'Básico',
  INTERMEDIATE = 'Intermediário',
  HARD = 'Difícil'
}

export interface Question {
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
}

export interface GameState {
  status: 'START' | 'PLAYING' | 'LOADING' | 'WON' | 'LOST' | 'TRANSITION';
  currentLevel: number; // 1 to 15
  difficulty: Difficulty;
  question: Question | null;
  score: number;
  isPracticeMode: boolean;
  usedLifelines: {
    fiftyFifty: boolean;
    skip: boolean;
    hint: boolean;
  };
}

export const PRIZE_VALUES = [
  '1.000 Kz', '2.000 Kz', '3.000 Kz', '4.000 Kz', '5.000 Kz',
  '10.000 Kz', '20.000 Kz', '30.000 Kz', '40.000 Kz', '50.000 Kz',
  '100.000 Kz', '200.000 Kz', '300.000 Kz', '500.000 Kz', '1.000.000 Kz'
];

export const TOPICS = [
  'Textos Narrativos (Elementos e Estrutura)',
  'Regras de acentuação gráfica',
  'Sinonímia, Antonímia, Hiperonímia, Hiponímia e Homonímia',
  'Pronominalização',
  'Pontuação',
  'Crase',
  'Formas de tratamento',
  'Uso imperativo formal e informal',
  'Ortografia',
  'Verbo (Conjugação, Vozes verbais, concordância verbal)',
  'Concordância Nominal',
  'Adjetivos (Flexão e emprego)',
  'Substantivos',
  'Pronomes',
  'Morfologia (Classes de palavras)',
  'Sintaxe (Oração e Período)',
  'Semântica Geral'
];
