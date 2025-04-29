import { deg2rad, PI2, Point, Vector } from '../../api/canvas.ts';

interface IMemo {
  whenOccurred: number;
  whenAdded: number;
  age: number;
  timePoint: Point;
  vector: Vector;
}

let raf = 0;
let ctx: CanvasRenderingContext2D;
const R = 20;
const D = 2 * R;
const LINE_WIDTH = 4;
const SHADOW_WIDTH = 4;
const pRotationAxis = new Point(R, R);
const WHITE = 'rgb(100% 100% 100%)';
const BLACK = 'rgb(0% 0% 0%)';
const ANIMATION_DURATION = 2e3;
const ANIMATION_DELTA_PX = R / ANIMATION_DURATION;
let primaryColour: string = BLACK;
let shadowColour: string = WHITE;
const memory: IMemo[] = [];

export function startAnimation(ctx: CanvasRenderingContext2D) {
  initContext(ctx);
  raf = requestAnimationFrame(draw);

  return function stopAnimation() {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}

export function update(timeOfCollection: number) {
  const whenAdded = Date.now();
  const angle = (timeOfCollection % 1000) * 360 / 1000;
  const vector = new Vector(R, 0)
    .rotate(deg2rad(-angle))
    // rotate left to adjust zero angle to point at {0,-1} (north)
    .rotateLeft();
  const timePoint = vector.atBase(pRotationAxis);

  memory.unshift({
    whenOccurred: timeOfCollection,
    whenAdded,
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
    primaryColour = scheme === 'dark' ? WHITE : BLACK;
    shadowColour = scheme === 'dark' ? BLACK : WHITE;
    ctx.strokeStyle = primaryColour;
    ctx.shadowColor = shadowColour;
  });
}

function draw() {
  const drawTime = Date.now();
  ctx.clearRect(0, 0, D, D);
  drawCenter();

  for (let n = 0, N = memory.length; n < N; n++) {
    const memo = memory[n];
    memo.age = drawTime - memo.whenAdded;
    drawLine(memo);
  }

  let n = memory.length;
  while (n--) {
    if (memory[n].age >= ANIMATION_DURATION) {
      memory.pop();
    } else {
      break;
    }
  }

  raf = requestAnimationFrame(draw);
}

function drawCenter() {
  ctx.save();
  ctx.beginPath();
  ctx.arc(pRotationAxis.x, pRotationAxis.y, 0.5, 0, PI2);
  ctx.stroke();
  ctx.closePath();
  ctx.restore();
}

function drawLine(memo: IMemo) {
  const length = R - memo.age * ANIMATION_DELTA_PX;
  const p = memo.vector.setLength(length).atBase(memo.timePoint);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(memo.timePoint.x, memo.timePoint.y);
  ctx.stroke();
  ctx.closePath();
  ctx.restore();
}

type TColourScheme = 'light' | 'dark';

export function onColourSchemeChange(
  callback: (scheme: TColourScheme) => void,
) {
  const devtoolsScheme = chrome.devtools.panels.themeName;
  const osDarkScheme = globalThis.matchMedia('(prefers-color-scheme: dark)');

  if (devtoolsScheme === 'dark' || osDarkScheme.matches) {
    callback('dark');
  } else {
    callback('light');
  }

  osDarkScheme.addEventListener('change', (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  });
}
