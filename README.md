<div align="center">

# Laser · Blink

### **A memory game of paper targets and one reflecting laser line.**
### [Play now at laserblink.bittu.dev](https://laserblink.bittu.dev)

<img src="static/screenshot.png" width="850" alt="LaserBlink menu" />

</div>

## How To Play

- Each level shows a field of crumpled paper targets for a few seconds.
- The targets blink away. You get one shot and must remember where they were.
- Aim the laser; it reflects off the screen edges, rulers, and mirror strips.
- Burn the quota to pass. A failed level costs one of your three mistakes.
- Assist draws the whole reflected path. Three for the entire run, so spend it carefully.
- A level you did not fully burn shows the expected path in blue pencil after the shot.

## Controls

- Drag anywhere on the field to aim.
- Left click, tap, or press `Space` to fire and to move on.
- `Esc` opens the exit sheet: keep playing, replay the game, or go home.
- `Left` / `Right` or `A` / `D` to turn the turret, hold `Shift` for fine steps.
- `I` to spend an assist and see the full line.
- `M` sound, `V` reduced motion, `F` fullscreen, `?` help, `Esc` closes help.

## Game Modes

- **Classic**: ten levels, three mistakes. Finish level ten to complete the run.
- **Endless**: levels keep coming at the top of the difficulty curve. No mistake budget, you stop when you want.

A game code replays the same levels. It is generated per run and shown on the end screen.

## Difficulty

The slider has five stops and shifts the tuning curve by two levels per step, so Calm on level 5 plays like level 1, and Wild on level 1 already plays like level 5.

Most of the difficulty is reflections. Higher stops ask the beam to turn more times before it can reach the targets, alongside a slower target count increase, a longer study window, and more field pieces:

- Rulers arrive early and act as solid reflectors.
- Mirrors appear from the middle of the curve, zero to two per level.
- Absorber patches appear late. They are parked away from the intended route, so only a bad shot dies in them.

Difficulty is part of the seed. The same game code at the same difficulty rebuilds identical levels.

## How It Works

Levels are generated, not authored. The generator picks a firing angle, traces the real beam through the field, checks that the solved route uses the required number of reflections, then places targets on that route. Before a level is served it is re-traced with the same physics the player uses, and any level that does not burn every target is rejected.

Scoring pays for accuracy, combo order, reflection depth, and ink you did not spend.

## Run Locally

```bash
npm install
npm run dev
```

```bash
npm test     # physics, generation, and scoring tests
npm run check
npm run build
```

## Known Rough Edges

- No online leaderboard. The high score lives in localStorage.
- Endless mode holds at the hardest curve instead of ramping further.
- All sound is synthesised with Web Audio, so there are no audio files to swap out.

## Built Using

[Svelte 5](https://svelte.dev/) · [Vite](https://vitejs.dev/) · [Tailwind CSS](https://tailwindcss.com/) · Canvas 2D · Web Audio · [Vitest](https://vitest.dev/)
