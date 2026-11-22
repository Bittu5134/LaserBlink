<div align="center">

# Laser · Blink

### A memory game of paper targets and one reflecting laser line.

### [Play now at laserblink.bittu.dev](https://laserblink.bittu.dev)

<img src="static/screenshot.png" width="850" alt="LaserBlink menu" />

</div>

## how to play

Targets sit on the field for a few seconds, then vanish. You get one shot. The beam bounces off the screen edges, mirrors and rulers, and burns whatever paper it passes through.

Classic is ten levels with three mistakes. Miss the quota and you lose one. The quota is 60% of the targets: two of three, five of seven.

When you don't burn everything, the route the level was built around shows up as a dashed blue line under your shot. That happens on any missed target, not only on a lost mistake.

## controls

- drag anywhere to aim
- left click, tap, or `Space` to fire and to advance
- `←` `→` or `A` `D` turn the turret, `Shift` is the fine step
- `I` spends an assist and shows the whole reflected line
- `M` sound, `V` less motion, `F` fullscreen, `?` help
- `Esc` opens the exit sheet

## modes

Classic stops at level ten. Endless keeps going at the top of the curve and has no mistake budget, so you end it yourself instead of losing it.

## difficulty

Five stops, and each one moves the tuning curve two levels, so Calm on level 5 plays like level 1 and Wild on level 1 plays like level 5.

Reflections carry most of it. Level 10 asks for nine turns; level 1 asks for two. Over that same span the target count creeps from 2 to 5, which is a much smaller change. Study time follows the target count. Rulers arrive early and bounce the beam, mirrors land mid curve at zero to two per level, absorbers show up late and are parked away from the route so only a bad shot dies in them.

## how a level gets made

Pick an angle, trace the beam through the walls and pieces, and check it turns as many times as the level asks for. Targets go on that path with spacing and clearance. Then it is traced again with the same tracer the game fires with, and thrown away if it doesn't burn every target.

Nothing is hand placed and nothing ships unchecked. The generator tries 80 angles before giving up, and the fallback it lands on is a plain horizontal field that also gets verified. Late levels hit that fallback about 2% of the time.

Score comes from accuracy, combo order, reflection depth, and assists left unspent.

## run it

```bash
npm install
npm run dev
```

```bash
npm test
npm run check
npm run build
```

The tests cover the beam tracer, mirrors and absorbers, generator reproducibility, and scoring. They finish in under a second.

## still broken

- no online scores, the high score lives in localStorage
- endless pins to the hardest curve rather than ramping forever
- all audio is synthesised, so there are no files to replace
- spending an assist is final for the level, there is no undo

## built with

Svelte 5, Vite, Tailwind, Canvas 2D, Web Audio, Vitest.
