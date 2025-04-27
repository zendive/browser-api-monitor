import { deg2rad, Point, Vector } from '../../api/canvas.ts';

interface IMemo {
  when: number;
  vector: Vector;
  age: number;
}

let raf = 0;
let ctx: CanvasRenderingContext2D;
const R = 40;
const D = 2 * R;
const pRotationAxis = new Point(R, R);
const WHITE = 'rgb(100% 100% 100%)';
const BLACK = 'rgb(0% 0% 0%)';
const ANIMATION_DURATION = 2e3;
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

export function update() {
  const when = Date.now();
  const angle = -(when % 1000) * 360 / 1000;
  const vector = new Vector(R, 0).rotate(deg2rad(angle));

  memory.unshift({
    when,
    vector,
    age: 0,
  });
}

function initContext(_ctx: CanvasRenderingContext2D) {
  ctx = _ctx;
  ctx.canvas.width = D;
  ctx.canvas.height = D;
  ctx.lineCap = 'round';
  ctx.lineWidth = 4;
  ctx.shadowBlur = 4;

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

  for (let n = 0, N = memory.length; n < N; n++) {
    const memo = memory[n];
    memo.age = drawTime - memo.when;
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

function drawLine(memo: IMemo) {
  const length = R - memo.age * R / ANIMATION_DURATION;
  const p = memo.vector.setLength(length).toPoint(pRotationAxis);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pRotationAxis.x, pRotationAxis.y);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  ctx.closePath();
  ctx.restore();
}

type TColourScheme = 'light' | 'dark';

/**
 * NOTE: if OS is dark but devtools is default - then scheme is dark
 */
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
