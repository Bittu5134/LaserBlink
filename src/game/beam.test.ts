import { describe, expect, it } from 'vitest';
import type { Mirror, Rect } from './types';
import { traceBeam } from './beam';

const arena: Rect = { x: 0, y: 0, w: 1000, h: 600 };

describe('traceBeam', () => {
  it('bounces off arena walls and stops at the bounce budget', () => {
    const small: Rect = { x: 0, y: 0, w: 100, h: 100 };
    const trace = traceBeam({ x: 50, y: 50 }, 0, small, [], 2);
    expect(trace.segments).toHaveLength(3);
    expect(trace.bounces).toHaveLength(2);
    expect(trace.segments[0].b.x).toBeCloseTo(100);
    expect(trace.segments[1].b.x).toBeCloseTo(0);
    expect(trace.segments[2].b.x).toBeCloseTo(100);
    expect(trace.stopped).toBeUndefined();
  });

  it('handles a zero bounce budget and returns one segment', () => {
    const trace = traceBeam({ x: 50, y: 50 }, 0, arena, [], 0);
    expect(trace.segments).toHaveLength(1);
    expect(trace.bounces).toHaveLength(0);
  });

  it('reflects off a solid obstacle', () => {
    const obstacle = { x: 200, y: 250, w: 40, h: 100 };
    const trace = traceBeam({ x: 100, y: 300 }, 0, arena, [obstacle], 3);
    expect(trace.segments[0].b.x).toBeCloseTo(200);
    expect(trace.segments[0].b.y).toBeCloseTo(300);
    expect(trace.bounces[0]?.point.x).toBeCloseTo(200);
    expect(trace.segments[1].b.x).toBeLessThan(200);
  });

  it('reflects off a vertical finite mirror', () => {
    const mirror: Mirror = { center: { x: 300, y: 300 }, halfLength: 50, angle: Math.PI / 2 };
    const trace = traceBeam({ x: 100, y: 300 }, 0, arena, [], 3, [mirror]);
    expect(trace.segments[0].b.x).toBeCloseTo(300);
    expect(trace.bounces[0]?.point.x).toBeCloseTo(300);
    expect(trace.segments[1].b.x).toBeLessThan(300);
  });

  it('turns an angled mirror hit into a new direction', () => {
    const mirror: Mirror = { center: { x: 300, y: 300 }, halfLength: 60, angle: Math.PI / 4 };
    // The horizontal ray crosses the mirror line at its center.
    const trace = traceBeam({ x: 100, y: 300 }, 0, arena, [], 4, [mirror]);
    expect(trace.bounces).toHaveLength(4);
    expect(Math.abs(trace.segments[1].b.y - trace.segments[1].a.y)).toBeGreaterThan(1);
  });

  it('misses a mirror outside its finite segment', () => {
    const mirror: Mirror = { center: { x: 300, y: 100 }, halfLength: 20, angle: Math.PI / 2 };
    const trace = traceBeam({ x: 100, y: 300 }, 0, arena, [], 2, [mirror]);
    const first = trace.segments[0];
    expect(first.b.x).toBeCloseTo(1000);
    expect(trace.bounces[0]?.point.y).toBeCloseTo(300);
  });

  it('stops on an absorber without bouncing', () => {
    const absorber = { x: 300, y: 290, w: 30, h: 20 };
    const trace = traceBeam({ x: 100, y: 300 }, 0, arena, [], 4, [], [absorber]);
    expect(trace.stopped).toBe('absorber');
    expect(trace.segments).toHaveLength(1);
    expect(trace.bounces).toHaveLength(0);
    expect(trace.segments[0].b.x).toBeCloseTo(300);
  });

  it('reflects off obstacles and mirrors but the absorber still wins when nearer', () => {
    const mirror: Mirror = { center: { x: 250, y: 300 }, halfLength: 40, angle: Math.PI / 2 };
    const absorber = { x: 400, y: 290, w: 30, h: 20 };
    const trace = traceBeam({ x: 100, y: 300 }, 0, arena, [], 4, [mirror], [absorber]);
    // Mirror sends the beam back left, so the absorber to the right is never reached.
    expect(trace.stopped).toBeUndefined();
    expect(trace.segments[0].b.x).toBeCloseTo(250);
  });

  it('does not trap itself when starting inside an absorber', () => {
    const absorber = { x: 80, y: 290, w: 40, h: 20 };
    const trace = traceBeam({ x: 100, y: 300 }, 0, arena, [], 0, [], [absorber]);
    expect(trace.segments.length).toBeGreaterThan(0);
    expect(trace.stopped).toBeUndefined();
  });
});
