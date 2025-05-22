import { deg2rad, PI2, Point, Vector } from '../shared/canvas.ts';
import { onColourSchemeChange } from '../../devtoolsPanelUtil.ts';

interface IEvent {
  whenAdded: number;
  age: number;
  timePoint: Point;
  vector: Vector;
}

let raf: number | void = 0;
let ctx: CanvasRenderingContext2D;
const R = 20;
const D = 2 * R;
const LINE_WIDTH = 4;
const SHADOW_WIDTH = 2;
const pCenter = new Point(R, R);
const WHITE = rgb(100, 100, 100);
const BLACK = rgb(0, 0, 0);
const ANIMATION_DURATION = 2e3;
const ANIMATION_DELTA_PX = R / ANIMATION_DURATION;
let rgbPrimary = BLACK;
let rgbShadow = WHITE;
const queue: IEvent[] = [];

function rgb(r: number, g: number, b: number) {
  return function alpha(a?: number) {
    a ??= 100;
    return `rgb(${r}% ${g}% ${b}% / ${a}%)`;
  };
}

export function startAnimation(ctx: CanvasRenderingContext2D) {
  initContext(ctx);
  raf = requestAnimationFrame(draw);

  return function stopAnimation() {
    if (raf) {
      raf = cancelAnimationFrame(raf);
    }
  };
}

export function updateAnimation(timeOfCollection: number) {
  const angle = -(timeOfCollection % 1000) * 360 / 1000;
  const vector = new Vector(R, 0)
    .rotate(deg2rad(angle))
    // rotate left to adjust zero angle to point at {0,-1} (north)
    .rotateLeft();
  const timePoint = vector.atBase(pCenter);

  queue.unshift({
    whenAdded: Date.now(),
    age: 0,
    timePoint,
    vector: vector.rotateBack(),
  });
}

function initContext(_ctx: CanvasRenderingContext2D) {
  ctx = _ctx;
  ctx.canvas.width = D;
  ctx.canvas.height = D;
  ctx.lineCap = 'round';
  ctx.lineWidth = LINE_WIDTH;
  ctx.shadowBlur = SHADOW_WIDTH;

  onColourSchemeChange((scheme) => {
    rgbPrimary = scheme === 'dark' ? WHITE : BLACK;
    rgbShadow = scheme === 'dark' ? BLACK : WHITE;
    ctx.strokeStyle = rgbPrimary();
    ctx.shadowColor = rgbShadow();
  });
}

let need2draw = true;

function draw() {
  if (queue.length) {
    need2draw = true;
  } else if (need2draw) {
    drawGrid();
    need2draw = false;
  }

  if (need2draw) {
    drawGrid();

    for (const e of queue) {
      drawLine(e);
    }

    deprecateEvents(queue);
  }

  raf = requestAnimationFrame(draw);
}

function drawGrid() {
  ctx.clearRect(0, 0, D, D);
  ctx.save();
  ctx.beginPath();
  ctx.arc(pCenter.x, pCenter.y, 0.5, 0, PI2);
  ctx.stroke();
  ctx.closePath();
  ctx.restore();
}

function drawLine(e: IEvent) {
  e.age = Date.now() - e.whenAdded;
  const alpha = 20 + Math.min(80, 100 * (e.age / ANIMATION_DURATION));
  const length = R - e.age * ANIMATION_DELTA_PX;
  const p = e.vector.setLength(length).atBase(e.timePoint);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(e.timePoint.x, e.timePoint.y);
  ctx.strokeStyle = rgbPrimary(alpha);
  ctx.stroke();
  ctx.closePath();
  ctx.restore();
}

function deprecateEvents(queue: IEvent[]) {
  let n = queue.length;

  while (n--) {
    if (queue[n].age >= ANIMATION_DURATION) {
      queue.pop();
    } else {
      return;
    }
  }
}
