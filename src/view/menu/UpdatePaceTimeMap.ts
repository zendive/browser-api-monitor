import { deg2rad, PI2, Point, Vector } from '../shared/canvas.ts';
import { onColourSchemeChange } from '../shared/theme.ts';
import { ETimer, Timer } from '../../api/time.ts';

interface IEvent {
  whenAdded: number;
  age: number;
  timePoint: Point;
  vector: Vector;
}

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
const animation = new Timer({ type: ETimer.ANIMATION }, () => {
  drawGrid();

  if (!queue.length) {
    return;
  }

  for (let n = 0; n < queue.length; n++) {
    drawLine(queue[n]);
  }

  deprecateEvents(queue);
  animation.start();
});

export function startAnimation(ctx: CanvasRenderingContext2D) {
  initContext(ctx);
  animation.start();

  const offColourSchemeChange = onColourSchemeChange((scheme) => {
    rgbPrimary = scheme === 'dark' ? WHITE : BLACK;
    rgbShadow = scheme === 'dark' ? BLACK : WHITE;
    ctx.strokeStyle = rgbPrimary();
    ctx.shadowColor = rgbShadow();
  });

  return function stopAnimation() {
    animation.stop();
    offColourSchemeChange();
  };
}

function initContext(_ctx: CanvasRenderingContext2D) {
  ctx = _ctx;
  ctx.canvas.width = D;
  ctx.canvas.height = D;
  ctx.lineCap = 'round';
  ctx.lineWidth = LINE_WIDTH;
  ctx.shadowBlur = SHADOW_WIDTH;
}

export function updateAnimation(timeOfCollection: number) {
  const angle = -(timeOfCollection % 1000) * 360 / 1000;
  const vector = new Vector(R, 0)
    .rotate(deg2rad(angle))
    // rotate left to adjust zero angle to point at {0,-1} (north)
    .rotateLeft();
  const timePoint = vector.atBase(pCenter);
  const vector2base = vector.rotateBack();

  queue.unshift({
    whenAdded: performance.now(),
    age: 0,
    timePoint,
    vector: vector2base,
  });

  if (ctx && !animation.isPending()) {
    animation.start();
  }
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
  e.age = performance.now() - e.whenAdded;
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

function rgb(r: number, g: number, b: number) {
  return function alpha(a?: number) {
    a ??= 100;
    return `rgb(${r}% ${g}% ${b}% / ${a}%)`;
  };
}
