export type Phase = 'menu' | 'study' | 'aim' | 'firing' | 'reveal' | 'gameover' | 'victory';

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
  spriteIndex: number;
  burnt?: boolean;
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

// A finite reflective segment. angle is the direction of the panel itself.
export interface Mirror {
  center: Vec2;
  halfLength: number;
  angle: number;
}

export interface RectPiece {
  rect: Rect;
  kind: 'block' | 'absorber';
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
  solutionAngle: number;
  requiredHits: number;
  angTolerance: number;
  mirrors: Mirror[];
  pieces: RectPiece[];
  seed: string;
}

export interface RoundResult {
  round: number;
  results: TargetResult[];
  accuracy: number;
  score: number;
  perfect: boolean;
  segments: Segment[];
  hits: number;
  total: number;
  requiredHits: number;
  passed: boolean;
  grade: string;
  stars: number;
  inkUsed: number;
  bounces: number;
}

export interface Settings {
  reducedMotion: boolean;
  sound: boolean;
}

export interface RunSummary {
  seed: string;
  score: number;
  highScore: number;
  round: number;
  pagesCleared: number;
  accuracy: number;
  hits: number;
  targets: number;
  bestStars: number;
}
