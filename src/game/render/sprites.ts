// Sprite and texture loader with preloaded HTMLImageElement caches

// Import asset URLs directly via Vite
import scratchpadUrl from '../../assets/images/opt/scratchpad.jpg';
import cardboardUrl from '../../assets/images/opt/cardboard.jpg';

import ball0Url from '../../assets/images/balls/ball_0.png';
import ball1Url from '../../assets/images/balls/ball_1.png';
import ball2Url from '../../assets/images/balls/ball_2.png';
import ball3Url from '../../assets/images/balls/ball_3.png';
import ball4Url from '../../assets/images/balls/ball_4.png';
import ball5Url from '../../assets/images/balls/ball_5.png';
import ball6Url from '../../assets/images/balls/ball_6.png';

import ball0BurntUrl from '../../assets/images/balls/ball_0_burnt.png';
import ball1BurntUrl from '../../assets/images/balls/ball_1_burnt.png';
import ball2BurntUrl from '../../assets/images/balls/ball_2_burnt.png';
import ball3BurntUrl from '../../assets/images/balls/ball_3_burnt.png';
import ball4BurntUrl from '../../assets/images/balls/ball_4_burnt.png';
import ball5BurntUrl from '../../assets/images/balls/ball_5_burnt.png';
import ball6BurntUrl from '../../assets/images/balls/ball_6_burnt.png';

const ballUrls = [ball0Url, ball1Url, ball2Url, ball3Url, ball4Url, ball5Url, ball6Url];
const burntBallUrls = [
  ball0BurntUrl,
  ball1BurntUrl,
  ball2BurntUrl,
  ball3BurntUrl,
  ball4BurntUrl,
  ball5BurntUrl,
  ball6BurntUrl,
];

interface SpriteBundle {
  scratchpad: HTMLImageElement | null;
  cardboard: HTMLImageElement | null;
  balls: (HTMLImageElement | null)[];
  burntBalls: (HTMLImageElement | null)[];
  loaded: boolean;
}

const bundle: SpriteBundle = {
  scratchpad: null,
  cardboard: null,
  balls: new Array(7).fill(null),
  burntBalls: new Array(7).fill(null),
  loaded: false,
};

let preloadPromise: Promise<SpriteBundle> | null = null;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

export function preloadSprites(): Promise<SpriteBundle> {
  if (preloadPromise) return preloadPromise;
  if (typeof window === 'undefined') return Promise.resolve(bundle);

  preloadPromise = (async () => {
    try {
      const [scratchpad, cardboard] = await Promise.all([
        loadImage(scratchpadUrl),
        loadImage(cardboardUrl),
      ]);
      bundle.scratchpad = scratchpad;
      bundle.cardboard = cardboard;

      const loadedBalls = await Promise.all(ballUrls.map(loadImage));
      bundle.balls = loadedBalls;

      const loadedBurnt = await Promise.all(burntBallUrls.map(loadImage));
      bundle.burntBalls = loadedBurnt;

      bundle.loaded = true;
    } catch (e) {
      console.warn('LaserBlink: Some sprite assets failed to load; using procedural fallbacks', e);
    }
    return bundle;
  })();

  return preloadPromise;
}

export function getSprites(): SpriteBundle {
  if (!bundle.loaded && !preloadPromise && typeof window !== 'undefined') {
    preloadSprites();
  }
  return bundle;
}
