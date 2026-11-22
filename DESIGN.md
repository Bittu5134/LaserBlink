---
name: LaserBlink
description: A memory-and-aim laser game played on a full-screen cardboard field.
colors:
  cardboard: "#b78b5e"
  cardboard-deep: "#8d6a44"
  desk: "#1a130e"
  desk-deep: "#0f0b08"
  paper: "#fbf4e3"
  paper-deep: "#f1e5ce"
  paper-edge: "#d9c9a8"
  ink: "#1b2832"
  ink-soft: "#4d575f"
  ink-faint: "#77776f"
  laser: "#d9522b"
  laser-deep: "#a53b1e"
  pencil-blue: "#35617f"
  chip: "#1c130b"
  chip-text: "#fbf3e1"
typography:
  display:
    fontFamily: "Playpen Sans, cursive"
    fontSize: "clamp(4rem, 13vw, 9.5rem)"
    fontWeight: 800
    lineHeight: 0.82
    letterSpacing: "-0.055em"
  heading:
    fontFamily: "Playpen Sans, cursive"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Playpen Sans, cursive"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  label:
    fontFamily: "Space Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.12em"
  numeral:
    fontFamily: "Space Mono, monospace"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.04em"
rounded:
  none: "0px"
  mark: "2px"
  chip: "2px"
  pill: "999px"
  ball: "48% 52% 46% 54% / 52% 46% 54% 48%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "clamp(10px, 1.8vw, 22px)"
components:
  rail-chip:
    backgroundColor: "{colors.chip}"
    textColor: "{colors.chip-text}"
    rounded: "{rounded.chip}"
    padding: "7px 12px"
  action-button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.heading}"
    rounded: "{rounded.mark}"
    padding: "0 26px"
    height: "68px"
  play-button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.heading}"
    rounded: "{rounded.mark}"
    padding: "1rem 2.4rem"
    height: "76px"
  modal-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "clamp(20px, 3.5vw, 30px)"
  mode-selected:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 18px"
    height: "48px"
  mode-idle:
    backgroundColor: "transparent"
    textColor: "{colors.chip-text}"
    rounded: "{rounded.none}"
    padding: "0 18px"
    height: "48px"
  tool-button:
    backgroundColor: "transparent"
    textColor: "{colors.chip-text}"
    rounded: "{rounded.pill}"
    size: "40px"
  key-cap:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.mark}"
    padding: "0.16rem 0.38rem"
---

## Overview

LaserBlink is a memory game played on paper. The whole viewport is the playfield: a warm cardboard surface the laser bounces around, with targets as crumpled paper balls. The interface is a HUD laid on that surface, not a frame around it.

Two registers share the screen. The cardboard and paper balls are photographic, tactile and warm. Everything the game computes (beam, turret, mirror strips, absorber felt, rulers) is drawn in code at the same scale, so the field reads as one continuous desk rather than UI on top of a background.

The visual system is quiet by instruction: no captions on the field, no decorative labels, no prose. State is carried by the objects: a countdown arc around the turret, paper balls appearing and blinking away, a red beam, a blue pencil solution line.

## Colors

`cardboard` is the ground. It is a photograph, lightly vignetted in code so the edges fall away and the light collects in the middle.

`paper` is reserved for things you can hold: paper-ball targets, buttons, the help sheet. It never fills a panel behind gameplay.

`ink` and `ink-soft` carry text and drawn line work on paper. `chip-text` is the ink used on cardboard, on the translucent `chip` marks.

`laser` is the only saturated accent and it belongs to the beam, the fire action and the turret aperture. `pencil-blue` appears exactly once in the interface language: the expected route drawn after a shot that missed a target.

No gradients are used as text fills. No color alone carries a state: hits get a check ring, misses a cross, mirrors have a sheen strip, absorbers a hatched felt edge.

## Typography

Playpen Sans is the voice: soft, rounded, hand-set. It carries the title, buttons, grades and sheet headings. It is self-hosted, never a system fallback.

Space Mono is the measuring instrument. It is used for numerals that are data: page number, score, hit counts, ink count, key caps. It is not a costume for technical flavour.

There are two sizes that matter in play: the page numeral at 1.75rem and the action label at 1.5rem. Nothing in the HUD goes below 12px, and body copy sits at 16px.

## Layout

The canvas fills the viewport. Its logical field is derived from the window shape so the walls sit at the screen edge at any aspect ratio, with a 9px dark wall band so a bounce is visible.

HUD marks hold the screen edges in one column of equal-height marks: level and score top left, the settings cluster under them, mistakes and assist bottom left, and the action button with its key hint bottom right. Nothing overlaps the middle of the field, where the puzzle lives.

On narrow screens the left stack stays top left, the action button spans the bottom edge in the thumb zone, and the control hint is dropped.

## Elevation & Depth

Depth comes from two sources only: real material shadow inside the canvas (paper balls and rulers cast soft directional shadows on cardboard) and soft, blurred elevation under the paper buttons on top of it.

`0 14px 26px -14px` plus `0 3px 7px` is the standard lifted control, easing to a smaller pair on press. There are no zero-blur offset shadows and no glass: a control either sits on the cardboard with soft weight or it does not exist.

## Shapes

Rectangles are near-square at 2px radius, like a cut piece of card. Circles belong to the paper balls, the turret dial and the round tool buttons. The play target's id badge and the turret dial are the only places with concentric rings.

Mirrors are thin strips with a bright centre line and bolt heads at the ends. Absorbers are rectangles of dark felt with a hatched border and corner brackets. Rulers are amber blocks with tick marks. Each piece has one unmistakable silhouette.

## Components

Rails: translucent dark chips with cream numerals. They never sit in the field of play and never have a visible border weight beyond 1px.

Action button: a cream card with the phase verb as the label (Aim, Fire, Next page, Finish). One button at a time, always in the same place, always the largest control on screen.

Assist control: three ink pips plus an Assist button that spends one, sitting under the mistake balls in the same left column. Disabled when the line is already traced or the run has no ink left.

Help sheet: a cream modal, four rules and a key list. No settings duplicated inside it, no step numbers.

Result slip: grade word, stars, hits against quota, score gained. It sits centred above the field during reveal and never obscures the turret.

## Do's and Don'ts

Do let the cardboard carry the scene. Do keep the HUD to marks at the edges. Do show the expected path whenever a page is not fully burned.

Don't add captions, kickers, margin notes or instructional prose to the field. Don't put gameplay in a card or a panel. Don't use emoji as icons, gradient text, hard block shadows or decorative blur. Don't shrink HUD text below 12px to fit more of it.
