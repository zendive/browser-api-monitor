import { describe, test } from '@std/testing/bdd';
import { expect } from '@std/expect';
import {
  Box,
  deg2rad,
  fround,
  PI,
  PI2,
  PId2,
  Point,
  rad2deg,
  Vector,
} from '../src/api/canvas.ts';

describe('module exports', () => {
  test('fround', () => {
    expect(fround(1.33333333333)).toBe(1.333333);
    expect(fround(1.33333333333, 1e3)).toBe(1.333);
  });

  test('rad2deg', () => {
    expect(rad2deg(0)).toBe(0);
    expect(rad2deg(PId2)).toBe(90);
    expect(rad2deg(PI)).toBe(180);
    expect(rad2deg(PI + PId2)).toBe(270);
    expect(rad2deg(PI2)).toBe(0);
  });

  test('deg2rad', () => {
    expect(deg2rad(0)).toBe(0);
    expect(deg2rad(90)).toBe(PId2);
    expect(deg2rad(180)).toBe(PI);
    expect(deg2rad(270)).toBe(PI + PId2);
    expect(deg2rad(360)).toBe(0);
  });
});

describe('Point', () => {
  test('clone', () => {
    const v = new Point(Infinity, -Infinity);
    const clone = v.clone();

    expect(clone).not.toBe(v);
    expect(clone.isEqualTo(v)).toBe(true);
  });

  test('proximity', () => {
    const v = new Point(0, 0);

    expect(v.proximity(new Point(0, 0))).toBe(0);
    expect(v.proximity(new Point(1, 0))).toBe(1);
    expect(v.proximity(new Point(0, 1))).toBe(1);
  });

  test('vectorTo', () => {
    const from = new Point(0, 0);
    const to = new Point(0, 0);

    let v = from.set(6, 3).vectorTo(to.set(8, 1));
    expect(v.x).toBe(2);
    expect(v.y).toBe(-2);

    v = from.set(8, 1).vectorTo(to.set(6, 3));
    expect(v.x).toBe(-2);
    expect(v.y).toBe(2);

    v = from.set(4, 4).vectorTo(to.set(2, 2));
    expect(v.x).toBe(-2);
    expect(v.y).toBe(-2);

    v = from.set(2, 2).vectorTo(to.set(4, 4));
    expect(v.x).toBe(2);
    expect(v.y).toBe(2);
  });

  test('rotate', () => {
    const p = new Point(2, 2);
    const base = new Point(4, 4);

    p.rotate(PId2, base);
    expect(p.x).toBe(2);
    expect(p.y).toBe(6);
  });
});

describe('Vector', () => {
  test('rotate', () => {
    const p = new Point(2, 2);
    const base = new Point(4, 4);
    const v = base.vectorTo(p);

    expect(v.x).toBe(-2);
    expect(v.y).toBe(-2);

    v.rotate(PId2).round();
    expect(v.x).toBe(-2);
    expect(v.y).toBe(2);

    v.rotate(-PI).round();
    expect(v.x).toBe(2);
    expect(v.y).toBe(-2);
  });

  test('atBase', () => {
    const v = new Vector(2, -2);
    const pBase = new Point(4, 4);
    const p = v.atBase(pBase);

    expect(p.hasSameXY(6, 2)).toBe(true);
  });

  test('length / setLength', () => {
    const size = 2;
    const v = new Vector(size, size);
    const vAngleWithX = v.angleWithX;
    const v2 = v.clone().setLength(5);
    const v2AngleWithX = v2.angleWithX;

    expect(v.length).toBe(Math.sqrt(2 * size * size));
    expect(fround(v2.length)).toBe(5);
    expect(vAngleWithX).toEqual(v2AngleWithX);
  });

  test('half', () => {
    const v = new Vector(2, 4);

    expect(v.clone().half().length).toBe(v.length / 2);
  });

  test('xAxisAngle', () => {
    const v = new Vector(1, -1);

    expect(rad2deg(v.set(1, -1).angleWithX)).toBe(45);
    expect(rad2deg(v.set(-1, -1).angleWithX)).toBe(135);
    expect(rad2deg(v.set(-1, 1).angleWithX)).toBe(225);
    expect(rad2deg(v.set(1, 1).angleWithX)).toBe(315);
  });

  test('angle', () => {
    const v = new Vector(0, 0);
    const ox = new Vector(1, 0); // 0-right
    const oy = new Vector(0, 1); // 0-down

    expect(Math.round(rad2deg(new Vector(1, 1).angle(new Vector(-1, -1)))))
      .toBe(
        180,
      );
    expect(Math.round(rad2deg(v.set(1, -1).angle(ox)))).toBe(45);
    expect(Math.round(rad2deg(v.set(-1, -1).angle(ox)))).toBe(135);
    expect(Math.round(rad2deg(v.set(-1, 1).angle(ox)))).toBe(135);
    expect(Math.round(rad2deg(v.set(1, 1).angle(ox)))).toBe(45);
    expect(Math.round(rad2deg(ox.angle(v.set(1, 1))))).toBe(45);

    expect(Math.round(rad2deg(oy.angle(v.set(1, -1))))).toBe(135);
    expect(Math.round(rad2deg(oy.angle(v.set(-1, -1))))).toBe(135);
    expect(Math.round(rad2deg(oy.angle(v.set(-1, 0))))).toBe(90);
    expect(Math.round(rad2deg(oy.angle(v.set(0, 1))))).toBe(0);
    expect(Math.round(rad2deg(oy.angle(v.set(1, 1))))).toBe(45);
  });

  test('mirror', () => {
    const v1 = new Vector(-5, -1);
    const vAxis = new Vector(-4, 4);
    const v2 = v1.mirrorOver(vAxis).round();

    expect(rad2deg(vAxis.angleWithX)).toBe(225);
    expect(v2.x).toBe(1);
    expect(v2.y).toBe(5);

    const v3 = v2.mirrorOver(vAxis).round();
    expect(v3.x).toBe(v1.x);
    expect(v3.y).toBe(v1.y);
  });
});

describe('Box', () => {
  const box = new Box(new Point(0, 0), 10, 10);

  test('proximity', () => {
    expect(box.c.proximity(new Point(20, 5))).toBe(15);
  });

  test('contains', () => {
    expect(box.contains(new Point(0, 0))).toBe(true);
    expect(box.contains(new Point(5, 5))).toBe(true);
    expect(box.contains(new Point(-1, 0))).toBe(false);
  });
});
