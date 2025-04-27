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

class Coordinate<T extends typeof Coordinate = typeof Coordinate> {
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

  equalXY(x: number, y: number) {
    return (x === this.x && y === this.y);
  }

  equal(c: Coordinate) {
    return this.equalXY(c.x, c.y);
  }

  round(precision?: number) {
    return this.set(
      fround(this.x, precision),
      fround(this.y, precision),
    );
  }
}

/**
 * Point {x,y}
 */
export class Point extends Coordinate {
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
    return this.toVector(p).length();
  }

  /**
   * Convert point to vector
   * Assuming this(x,y) is a v(0,0)
   * @note this(0,0) is at top left corner
   */
  toVector(to: Point) {
    return new Vector(to.x - this.x, this.y - to.y);
  }

  /**
   * Rotate point over center `axis` point by an angle
   * @note: positive angle value means counterclockwise
   */
  rotate(angle: number, axis: Point) {
    return axis.toVector(this).rotate(angle).toPoint(axis);
  }
}

/**
 * Vector with virtual base of {0,0}
 * and assumed position at top-left corner
 * that points to {this.x, this.y}
 */
export class Vector extends Coordinate {
  constructor(x: number, y: number) {
    super(x, y);
  }

  clone() {
    return new Vector(this.x, this.y);
  }

  /**
   * Convert vector to point
   * Assuming pBase(x,y) refers to v(0,0)
   * @note: base(0,0) is at top left corner
   */
  toPoint(base: Point) {
    return new Point(base.x + this.x, base.y - this.y);
  }

  /**
   * Create vector rotated on specific angle
   * produced vector may contain float epsilon errors
   * @note: Positive angle means counterclockwise
   */
  rotate(angle: number) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos,
    );
  }

  /**
   * Create vector rotated to left
   */
  rotateLeft() {
    return new Vector(-this.y, this.x);
  }

  /**
   * Create vector rotated to right
   */
  rotateRight() {
    return new Vector(this.y, -this.x);
  }

  /**
   * Create vector rotated backwards
   */
  rotateBack() {
    return new Vector(-this.x, -this.y);
  }

  /**
   * Return new vector mirrored over another vector interpreted as rotation axis
   */
  mirror(axis: Vector) {
    const delta = this.xAxisAngle() - axis.xAxisAngle();
    const k = delta >= 0 ? -2 : 2;
    return this.rotate(k * this.angle(axis));
  }

  length() {
    return Math.sqrt(this.dot(this));
  }

  /**
   * Return new vector with new vector length
   */
  setLength(newLength: number) {
    return (new Vector(newLength, 0)).rotate(this.xAxisAngle());
  }

  /**
   * Return new vector halved in length
   */
  half() {
    return new Vector(this.x / 2, this.y / 2);
  }

  /**
   * Vector normalization
   */
  normalize() {
    const length = this.length();
    return new Vector(this.x / length, this.y / length);
  }

  /**
   * Dot product of two vectors
   */
  dot(v: Vector) {
    return (this.x * v.x + this.y * v.y);
  }

  angle(v: Vector) {
    return Math.acos(this.normalize().dot(v.normalize()));
  }

  angleWithNorth() {
    return this.angle(new Vector(0, 1));
  }

  angleWithEast() {
    return this.angle(new Vector(1, 0));
  }

  angleWithSought() {
    return this.angle(new Vector(0, -1));
  }

  angleWithWest() {
    return this.angle(new Vector(-1, 0));
  }

  /**
   * Get angle of vector relative to OX in range [0 ... α ... XY.PI2]
   * @note produced angle will be always positive radian
   */
  xAxisAngle() {
    let angle = Math.atan2(this.y, this.x);
    if (angle < 0) {
      angle += PI2;
    }
    return angle;
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
      tl: this.tl.toString(),
      w: this.w,
      h: this.h,
    });
  }

  contains(p: Point) {
    return (
      this.tl.x <= p.x && p.x <= this.tr.x &&
      this.tl.y <= p.y && p.y < this.bl.y
    );
  }
}
