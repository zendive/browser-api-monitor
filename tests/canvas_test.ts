import { describe, test } from '@std/testing/bdd';
import { expect } from '@std/expect';
import {
  Box,
  deg2rad,
  fround,
  PId2,
  Point,
  rad2deg,
  Vector,
} from '../src/api/canvas.ts';

describe('Point', () => {
  test('toVector', () => {
    const pBase = new Point(6, 3);
    const pDirection = new Point(8, 1);
    const v = pBase.toVector(pDirection);

    expect(v.clone().equalXY(2, 2)).toBe(true);
  });

  test('rotate', () => {
    const p = new Point(2, 2);
    const base = new Point(4, 4);
    const rotated = p.rotate(PId2, base);

    expect(rotated.clone().equalXY(2, 6)).toBe(true);
  });
});

describe('Vector', () => {
  test('toPoint', () => {
    const v = new Vector(2, -2);
    const pBase = new Point(4, 4);
    const p = v.toPoint(pBase);

    expect(p.equalXY(6, 6)).toBe(true);
  });

  test('setLength', () => {
    const v = new Vector(-2, -2);
    const v2 = v.setLength(5);

    // same angle
    expect(fround(v.xAxisAngle() - v2.xAxisAngle())).toBe(0);
    // same length
    expect(fround(v2.clone().length())).toBe(5);
  });

  test('half', () => {
    const v = new Vector(2, 4);

    expect(v.half().length()).toBe(v.length() / 2);
  });

  test('angleOX', () => {
    const v = new Vector(1, -1);
    const angle = v.xAxisAngle();

    expect(angle).toBe(5.497787143782138);
    expect(rad2deg(angle)).toBe(315);
  });

  test('angle', () => {
    const v1 = new Vector(1, 1);
    const v2 = new Vector(-1, -1);
    const angle = v1.angle(v2);

    expect(fround(angle)).toBe(fround(Math.PI));
  });

  describe('mirror', () => {
    const v1 = new Vector(-5, -1);
    const vAxis = new Vector(-4, 4);
    const v2 = v1.mirror(vAxis).round();

    test('clockwise', () => {
      expect(v2.equalXY(1, 5)).toBe(true);
    });

    test('counterclockwise', () => {
      const v3 = v2.mirror(vAxis).round();

      expect(v3.equal(v1)).toBe(true);
    });
  });
});

describe('Box', () => {
  const box = new Box(new Point(0, 0), 10, 10);

  test('proximity', () => {
    expect(box.clone().c.proximity(new Point(20, 5))).toBe(15);
  });

  test('contains', () => {
    expect(box.contains(new Point(5, 5))).toBe(true);
  });
});

describe('module exports', () => {
  test('fround', () => {
    expect(fround(1.33333333333)).toBe(1.333333);
    expect(fround(1.33333333333, 1e3)).toBe(1.333);
  });

  test('rad2deg', () => {
    const v = new Vector(0, 0);

    expect(rad2deg(v.set(1, 1).xAxisAngle())).toBe(45);
    expect(rad2deg(v.set(-1, 1).xAxisAngle())).toBe(135);
    expect(rad2deg(v.set(-1, -1).xAxisAngle())).toBe(225);
    expect(rad2deg(v.set(1, -1).xAxisAngle())).toBe(315);
  });

  test('deg2rad', () => {
    expect(rad2deg(deg2rad(81))).toBe(81);
  });
});
