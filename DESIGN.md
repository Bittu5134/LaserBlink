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

The viewport is the playfield. A photo of cardboard covers it edge to edge, paper balls sit on it as targets, and the laser bounces off the screen edge. Nothing wraps the game in a frame.

Two kinds of image share the field. Cardboard and targets are photographs. The beam, turret, rulers, mirror strips and absorber felt are drawn in code at the same scale, so they read as objects on one desk.

Words on the field are close to zero. A countdown arc around the turret holds the timer, targets blink away on their own, and the only text during play is the numbers at the edges.

## Colors

The ground is the cardboard photo, with a vignette drawn over it so the edges fall away.

`paper` is for things you can pick up: targets, buttons, the help sheet. It never becomes a panel behind the field.

Text on paper is `ink` and `ink-soft`. Text on cardboard is `chip-text` on a translucent `chip`.

`laser` is the one loud colour, used on the beam, the fire button and the turret lens. `pencil-blue` appears once, as the expected route after a missed target.

Nothing relies on colour alone. A hit gets a check ring, a miss a cross, a mirror a sheen strip, an absorber a hatched edge.

## Typography

Playpen Sans for anything a person said: title, buttons, grades, sheet headings. Self hosted, no system fallback in the stack.

Space Mono for anything measured: level number, score, hit counts, pip counts, key caps.

Two sizes carry play. The level numeral at 1.75rem, the action label at 1.5rem. Nothing in the HUD goes under 12px, body sits at 16px.

## Layout

The canvas is the window. Its logical field comes from the window shape, with a 9px wall band inside the screen edge so a bounce is visible instead of clipped.

HUD marks sit in two columns of equal height. Level, score and settings stack top left. Mistakes and assists sit bottom left. The action button has the bottom right to itself.

Under 720px the action button spans the bottom and the left columns narrow to 124px.

## Elevation & Depth

Shadow comes from the canvas and from under the buttons, nowhere else. Paper balls and rulers cast soft directional shadows because the same desk lights them.

Controls use two blurred layers, `0 14px 26px -14px` with `0 3px 7px`, and sit closer when pressed. No zero-blur offsets, no glass.

## Shapes

Corners are 2px, like a cut card. Circles belong to paper balls, the turret dial and the round ends of the beam.

Each field piece has one silhouette you can name from memory. Mirror strips with bolts at the ends. Dark felt rectangles with hatched borders. Amber rulers with ticks.

## Components

Rails are translucent dark chips with cream numerals, all 44px tall so the column lines up, border 1px.

The action button is a cream card labelled with the phase verb: Aim, Fire, Next, Finish. Largest control on screen, and it does not move.

Assist is three pips and a button that spends one. Disabled while the line is out, or when the run has none left.

Help is four lines and a key list.

The result slip gives the grade, stars, burned against on screen, and score gained. It sits above the field during reveal and does not cover the turret.

## Do's and Don'ts

Let the cardboard carry the scene. Keep the HUD at the edges. Show the expected path whenever a target survived.

No captions, kickers or instructions on the field. No play inside a card or panel. No emoji icons, gradient text, block shadows or decorative blur. No HUD text under 12px.
