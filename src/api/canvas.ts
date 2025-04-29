/**
 * Module assumption:
 * - Coordinate system of canvas html element
 */

export const PI = Math.PI;
export const PI2 = 2 * PI;
export const PId2 = PI / 2;

/**
 * Round floating point with custom precision
 */
export function fround(n: number, precision?: number) {
  precision ??= 1e6;
  return Math.round(n * precision) / precision;
}

/**
 * Degrees to radians
 */
export function deg2rad(deg: number) {
  return ((deg % 360) / 360) * PI2;
}

/**
 * Radians to degrees
 */
export function rad2deg(rad: number) {
  return ((rad % PI2) / PI2) * 360;
}

class XY {
  x: number = 0;
  y: number = 0;

  constructor(x: number, y: number) {
    this.set(x, y);
  }

  set(x: number, y: number) {
    this.x = x;
    this.y = y;
    return this;
  }

  clone() {
    return new XY(this.x, this.y);
  }

  toString() {
    return `{${this.x}, ${this.y}}`;
  }

  shiftX(x: number) {
    this.x += x;
    return this;
  }

  shiftY(y: number) {
    this.y += y;
    return this;
  }

  shiftXY(x: number, y: number) {
    this.x += x;
    this.y += y;
    return this;
  }

  hasSameXY(x: number, y: number) {
    return (x === this.x && y === this.y);
  }

  isEqualTo(xy: XY) {
    return this.hasSameXY(xy.x, xy.y);
  }

  round(precision?: number) {
    return this.set(
      fround(this.x, precision),
      fround(this.y, precision),
    );
  }
}

export class Point extends XY {
  constructor(x: number, y: number) {
    super(x, y);
  }

  clone() {
    return new Point(this.x, this.y);
  }

  /**
   * Get distance between two points
   */
  proximity(p: Point) {
    return this.vectorTo(p).length;
  }

  /**
   * Convert point to vector
   * Assuming this(x,y) is a v(0,0)
   * @note this(0,0) is at top left corner
   */
  vectorTo(to: XY) {
    return new Vector(to.x - this.x, to.y - this.y);
  }

  /**
   * Rotate point over center `axis` point by an angle
   * @note: positive `radAngle` means counterclockwise
   */
  rotate(radAngle: number, axis: Point) {
    const p = axis.vectorTo(this).rotate(radAngle).atBase(axis);
    return this.set(p.x, p.y);
  }
}

/**
 * Vector with virtual base of {0,0} that points to {x,y}
 */
export class Vector extends XY {
  constructor(x: number, y: number) {
    super(x, y);
  }

  clone() {
    return new Vector(this.x, this.y);
  }

  /**
   * Get point where vector points from `base` point of view
   * Assuming base(x,y) refers to v(0,0) of `this` vector
   */
  atBase(base: Point) {
    return new Point(base.x + this.x, base.y + this.y);
  }

  /**
   * Rotate at specific angle
   * produced vector may contain float epsilon errors
   * @note: positive `radAngle` means counterclockwise
   */
  rotate(radAngle: number) {
    const cos = Math.cos(-radAngle);
    const sin = Math.sin(-radAngle);

    return this.set(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos,
    );
  }

  rotateLeft() {
    return this.set(-this.y, this.x);
  }

  rotateRight() {
    return this.set(this.y, -this.x);
  }

  rotateBack() {
    return this.set(-this.x, -this.y);
  }

  mirrorOver(axis: Vector) {
    const delta = this.angleWithX - axis.angleWithX;
    const k = delta >= 0 ? -2 : 2;
    return this.rotate(k * this.angle(axis));
  }

  get length() {
    return Math.sqrt(this.dot(this));
  }

  setLength(newLength: number) {
    const v = new Vector(newLength, 0).rotate(this.angleWithX);
    return this.set(v.x, v.y);
  }

  half() {
    return this.set(this.x / 2, this.y / 2);
  }

  /**
   * Get angle of vector relative to X axis in range [0 ... α ... PI2] counterclockwise
   */
  get angleWithX() {
    const angle = Math.atan2(-this.y, this.x);

    return (angle < 0) ? angle + PI2 : angle;
  }

  angle(v: Vector) {
    return Math.acos(this.normalize().dot(v.normalize()));
  }

  /**
   * Return normalized vector
   */
  normalize() {
    const length = this.length;
    return new Vector(this.x / length, this.y / length);
  }

  /**
   * Dot product of two vectors
   */
  dot(v: Vector) {
    return (this.x * v.x + this.y * v.y);
  }
}

export class Box {
  w: number = 0;
  h: number = 0;
  // top-left
  tl: Point = new Point(0, 0);
  // top-right
  tr: Point = new Point(0, 0);
  // bottom-right
  br: Point = new Point(0, 0);
  // bottom-left
  bl: Point = new Point(0, 0);
  // center of a box
  c: Point = new Point(0, 0);

  constructor(tl: Point, w: number, h: number) {
    this.tl.set(tl.x, tl.y);
    this.resize(w, h);
  }

  clone() {
    return new Box(this.tl, this.w, this.h);
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.tr = new Point(this.tl.x + w, this.tl.y);
    this.br = new Point(this.tl.x + w, this.tl.y + h);
    this.bl = new Point(this.tl.x, this.tl.y + h);
    this.c = new Point(this.tl.x + this.w / 2, this.tl.y + h / 2);

    return this;
  }

  toString() {
    return JSON.stringify({
      w: this.w,
      h: this.h,
      tl: this.tl.toString(),
      c: this.c.toString(),
    });
  }

  contains(p: Point) {
    return (
      this.tl.x <= p.x && p.x <= this.tr.x &&
      this.tl.y <= p.y && p.y < this.bl.y
    );
  }
}
