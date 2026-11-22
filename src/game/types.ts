export type Phase = 'menu' | 'study' | 'aim' | 'firing' | 'reveal' | 'summary';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Target {
  id: number;
  pos: Vec2;
  radius: number;
  color: string;
}

export interface Segment {
  a: Vec2;
  b: Vec2;
}

export interface Bounce {
  point: Vec2;
  normal: Vec2;
  index: number;
}

export interface TargetResult {
  target: Target;
  hit: boolean;
  accuracy: number;
  closest: Vec2;
  distance: number;
}

export interface RoundPlan {
  round: number;
  targets: Target[];
  player: Vec2;
  obstacles: Rect[];
  maxBounces: number;
  studySeconds: number;
}

export interface RoundResult {
  round: number;
  results: TargetResult[];
  accuracy: number;
  score: number;
  perfect: boolean;
  segments: Segment[];
}

export interface Settings {
  sound: boolean;
  assist: 'off' | 'stub';
}

export interface ScoreEntry {
  name: string;
  score: number;
  accuracy: number;
  round: number;
  date: number;
}

export interface RunSummary {
  score: number;
  accuracy: number;
  rounds: RoundResult[];
  hits: number;
  targets: number;
}
