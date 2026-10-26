// ---------- SETTINGS ----------
let offset = 0;                  // minutes added to the real time (arrow keys change this)
let frozenAt = null;             // space bar freezes the time here (in minutes after midnight)
let themeIndex = 0;              // C: cycles the color themes (always just two colors: paper and ink)
let typeIndex = 1;               // T: cycles the typefaces
let toneIndex = 0;               // N: how hours still to come are printed (dots, bitmap dots, diagonal lines, flat tint)
let grainLevel = 2;              // X: paper grain off / light / heavy
let frameIndex = 1;              // F: cycles the frame weight
let gapIndex = 2;                // G: cycles the space between boxes
let corner = false;              // M: false = builds into the middle, true = into the bottom-right corner
let showSheet = true;            // V: poster on a dark table (true) or poster fills the window (false)
let showHelp = true;             // H: hides or shows the small key list printed on the poster
let activated = false;           // becomes true after the first click or key press
let playing = false;             // A: the time runs through the day very fast
let speedIndex = 0;              // S: cycles the play speed
let showSeconds = true;          // D: the ruler of 60 ticks (seconds) under the grid
let frozenSec = 0;               // the second the poster was frozen at

// Every theme uses only TWO colors: the paper and one ink. Hours still to come are the same ink,
// printed as a screen (dots, lines or a flat tint), the way a two-color print does it.
const THEMES = [
  { name: 'CHARCOAL ON CREAM', paper: [229, 222, 204], ink: [38, 36, 32] },
  { name: 'CREAM ON CHARCOAL', paper: [36, 34, 30],    ink: [232, 225, 208] },
  { name: 'CREAM ON BLUE',     paper: [30, 52, 168],   ink: [234, 231, 220] },
  { name: 'CREAM ON RED',      paper: [206, 52, 36],  ink: [240, 232, 214] }
];

// play speeds: step = minutes added each time, every = how many frames between steps (60 frames = 1 second)
const SPEEDS = [
  { name: 'MEDIUM',    step: 1, every: 40 },   // 1.5 minutes a second: an hour in 40 seconds
  { name: 'SLOW',      step: 1, every: 120 },  // half a minute a second: an hour in 2 minutes
  { name: 'FAST',      step: 1, every: 15 },   // 4 minutes a second: an hour in 15 seconds
  { name: 'VERY FAST', step: 1, every: 5 }     // 12 minutes a second: an hour in 5 seconds
];

// Each typeface set: a face for the time, a small face for everything else.
// These are fonts that come with a Mac. If one is missing the browser uses the next one in the list.
const TYPES = [
  { name: 'HELVETICA NEUE',
    big: "'Helvetica Neue', Helvetica, Arial, sans-serif", bigWeight: 700, bigSize: 42, bigTrack: -0.01,
    small: "'Helvetica Neue', Helvetica, Arial, sans-serif", smallWeight: 400, smallTrack: 0.05 },
  { name: 'FUTURA',
    big: "Futura, 'Century Gothic', 'Avenir Next', sans-serif", bigWeight: 700, bigSize: 40, bigTrack: 0,
    small: "Futura, 'Century Gothic', 'Avenir Next', sans-serif", smallWeight: 500, smallTrack: 0.1 },
  { name: 'DIN',
    big: "'DIN Alternate', 'DIN Condensed', 'Arial Narrow', sans-serif", bigWeight: 700, bigSize: 44, bigTrack: 0,
    small: "'DIN Alternate', 'DIN Condensed', 'Arial Narrow', sans-serif", smallWeight: 700, smallTrack: 0.08 },
  { name: 'DIDOT + HELVETICA',
    big: "Didot, 'Bodoni 72', 'Bodoni MT', 'Times New Roman', serif", bigWeight: 700, bigSize: 46, bigTrack: 0,
    small: "'Helvetica Neue', Helvetica, Arial, sans-serif", smallWeight: 400, smallTrack: 0.05 },
  { name: 'HELVETICA + MONO',
    big: "'Helvetica Neue', Helvetica, Arial, sans-serif", bigWeight: 700, bigSize: 42, bigTrack: -0.01,
    small: "Menlo, Monaco, 'Courier New', monospace", smallWeight: 400, smallTrack: 0.02 }
];

const TONES = ['HALFTONE', 'BITMAP', 'HATCH', 'TINT'];

// frame thickness around each box, measured on a 187px box (it scales with the box)
const FRAMES = [8, 14, 22, 32];

// space between boxes, in poster units
const GAPS = [0, 6, 12];

// Size of the empty window (as a fraction of the space inside the frame) after 0, 1, 2, 3, 4, 5 minutes.
const STEPS = [1.0, 0.62, 0.36, 0.17, 0.06, 0];

// The poster is drawn on a fixed sheet (2:3, like a 24 x 36 inch print) and scaled to fit the window.
const PW = 800;
const PH = 1200;
const M = 46;                    // margin inside the sheet
const FOOT = 72;                 // space under the grid for the seconds ruler and the footer line
const COLS = 3;
const ROWS = 4;
const LAYERS = 5;                // minutes per box

let shown = [];                  // how far each box is currently drawn (so changes ease in)
let sheetX = 0, sheetY = 0, sheetS = 1;
let tonePattern = null;          // the screen used for hours still to come
let grain = null;                // the paper grain, drawn over everything
let builtFor = '';               // remembers which theme + tone the screen and grain were built for

// ---------- SETUP ----------
function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(2);
  rectMode(CORNER);
}

// ---------- TIME ----------
function realTotal() {
  return hour() * 60 + minute();
}

function currentTotal() {
  const t = frozenAt !== null ? frozenAt : realTotal() + offset;
  return ((t % 1440) + 1440) % 1440;
}

// the second to show on the ruler (0 to 59)
function currentSecond() {
  if (frozenAt !== null) return frozenSec;
  if (playing) {
    const sp = SPEEDS[speedIndex];
    return floor(60 * ((frameCount % sp.every) / sp.every));
  }
  return second();
}

function shiftTime(d) {
  if (frozenAt !== null) frozenAt = ((frozenAt + d) % 1440 + 1440) % 1440;
  else offset = ((offset + d) % 1440 + 1440) % 1440;
}

// ---------- TEXTURE ----------
// the dot / hatch screen, built as a small repeating tile (one tile = 4 poster units)
function buildTone() {
  const th = THEMES[themeIndex];
  if (TONES[toneIndex] === 'TINT') { tonePattern = null; return; }

  const tile = document.createElement('canvas');
  const bitmap = TONES[toneIndex] === 'BITMAP';
  tile.width = bitmap ? 64 : 32;
  tile.height = bitmap ? 64 : 32;
  const g = tile.getContext('2d');
  g.fillStyle = 'rgb(' + th.ink[0] + ',' + th.ink[1] + ',' + th.ink[2] + ')';
  if (bitmap) {
    g.beginPath(); g.arc(32, 32, 15, 0, Math.PI * 2); g.fill();     // big, spaced dots on a straight grid
  } else if (TONES[toneIndex] === 'HALFTONE') {
    g.beginPath(); g.arc(8, 8, 7.6, 0, Math.PI * 2); g.fill();      // dots on a 45 degree grid
    g.beginPath(); g.arc(24, 24, 7.6, 0, Math.PI * 2); g.fill();
  } else {
    g.strokeStyle = g.fillStyle;                                    // diagonal hatch lines
    g.lineWidth = 7.5;
    g.beginPath();
    g.moveTo(-4, 36); g.lineTo(36, -4);
    g.moveTo(-20, 20); g.lineTo(20, -20);
    g.moveTo(12, 52); g.lineTo(52, 12);
    g.stroke();
  }
  tonePattern = drawingContext.createPattern(tile, 'repeat');
  try { tonePattern.setTransform(new DOMMatrix([0.125, 0, 0, 0.125, 0, 0])); } catch (e) {}
}

// fine speckle: dark specks of ink and light specks of paper, like ink on rough stock
function buildGrain() {
  const th = THEMES[themeIndex];
  const light = [0, 1, 2].map(function (k) { return th.paper[k] + (255 - th.paper[k]) * 0.6; });
  grain = createGraphics(PW, PH);
  grain.pixelDensity(1);
  grain.loadPixels();
  let seed = 20261025;
  for (let i = 0; i < PW * PH; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const r = seed / 4294967296;
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const q = seed / 4294967296;
    let c = null;
    let a = 0;
    if (r < 0.16) { c = th.ink; a = (0.05 + q * 0.28) * 255; }
    else if (r > 0.91) { c = light; a = (0.12 + q * 0.4) * 255; }
    if (c === null) continue;
    const j = i * 4;
    grain.pixels[j] = c[0];
    grain.pixels[j + 1] = c[1];
    grain.pixels[j + 2] = c[2];
    grain.pixels[j + 3] = a;
  }
  grain.updatePixels();
}

function checkBuilt() {
  const id = themeIndex + '-' + toneIndex;
  if (id === builtFor) return;
  builtFor = id;
  buildTone();
  buildGrain();
}

// fills a rectangle with the screen (hours still to come)
function toneRect(x, y, w, h) {
  const th = THEMES[themeIndex];
  if (tonePattern) {
    // save / restore so the screen does not leak into the next fill (p5 would not know the color changed)
    drawingContext.save();
    drawingContext.fillStyle = tonePattern;
    drawingContext.fillRect(x, y, w, h);
    drawingContext.restore();
  } else {
    fill(th.paper[0] + (th.ink[0] - th.paper[0]) * 0.4,
         th.paper[1] + (th.ink[1] - th.paper[1]) * 0.4,
         th.paper[2] + (th.ink[2] - th.paper[2]) * 0.4);
    rect(x, y, w, h);
  }
}

// ---------- DRAW ----------
function draw() {
  checkBuilt();
  const th = THEMES[themeIndex];

  // play mode: the time runs on by itself
  if (playing) {
    const sp = SPEEDS[speedIndex];
    if (frameCount % sp.every === 0) shiftTime(sp.step);
  }

  background(...(showSheet ? [58, 56, 52] : th.paper));

  // fit the sheet into the window
  const wm = showSheet ? 34 : 0;
  sheetS = min((width - 2 * wm) / PW, (height - 2 * wm) / PH);
  sheetX = (width - PW * sheetS) / 2;
  sheetY = (height - PH * sheetS) / 2;

  const total = currentTotal();
  const h24 = floor(total / 60) % 24;
  const h12 = h24 % 12 || 12;
  const m = total % 60;

  noStroke();
  if (showSheet) {
    fill(0, 0, 0, 70);
    rect(sheetX + 5, sheetY + 8, PW * sheetS, PH * sheetS);       // soft shadow
  }
  fill(...th.paper);
  rect(sheetX, sheetY, PW * sheetS, PH * sheetS);

  push();
  translate(sheetX, sheetY);
  scale(sheetS);
  drawBoxes(h12, m);
  drawHeader(h12, m);
  if (grainLevel > 0 && grain) {
    tint(255, grainLevel === 1 ? 120 : 255);
    image(grain, 0, 0, PW, PH);
    noTint();
  }
  pop();

}

// ---------- BOXES ----------
function gridSize() {
  const G = GAPS[gapIndex];
  const cell = (PW - 2 * M - (COLS - 1) * G) / COLS;
  return { G: G, cell: cell, h: ROWS * cell + (ROWS - 1) * G };
}

function drawBoxes(h12, m) {
  const g = gridSize();
  const gy0 = PH - FOOT - g.h;
  const ease = (playing && SPEEDS[speedIndex].every < 6) ? 0.3 : 0.16;

  for (let i = 0; i < 12; i++) {
    const left = M + (i % COLS) * (g.cell + g.G);
    const top = gy0 + floor(i / COLS) * (g.cell + g.G);

    const passed = i < h12;                           // solid ink once the hour has passed
    const target = constrain(m - i * 5, 0, LAYERS);   // minutes filled in this box, 0 to 5

    // ease toward the target so each minute moves instead of jumping
    if (shown[i] === undefined) shown[i] = target;
    shown[i] += (target - shown[i]) * ease;
    if (abs(target - shown[i]) < 0.002) shown[i] = target;

    drawBox(left, top, g.cell, passed, shown[i]);
  }
}

// Size of the empty window (0 to 1) for a (possibly fractional) number of filled layers
function holeFraction(s) {
  const i = floor(s);
  if (i >= LAYERS) return STEPS[LAYERS];
  return lerp(STEPS[i], STEPS[i + 1], s - i);
}

// One hour box: solid ink (passed) or screened ink (to come), with a window that closes each minute
function drawBox(left, top, cell, passed, s) {
  const th = THEMES[themeIndex];
  const F = FRAMES[frameIndex] * cell / 187;
  const inner = cell - 2 * F;
  const size = holeFraction(s) * inner;

  noStroke();
  if (passed) {
    fill(...th.ink);
    rect(left, top, cell, cell);
  } else {
    toneRect(left, top, cell, cell);
  }

  if (size > 0.6) {
    // paint the window straight onto the canvas in plain paper color, so it can never pick up the screen pattern
    const wx = corner ? left + cell - F - size : left + F + (inner - size) / 2;
    const wy = corner ? top + cell - F - size : top + F + (inner - size) / 2;
    drawingContext.save();
    drawingContext.fillStyle = 'rgb(' + th.paper[0] + ',' + th.paper[1] + ',' + th.paper[2] + ')';
    drawingContext.fillRect(wx, wy, size, size);
    drawingContext.restore();
  }
}

// ---------- TYPE ----------
function setBig() {
  const t = TYPES[typeIndex];
  textFont(t.big);
  textSize(t.bigSize);
  if (typeof textWeight === 'function') textWeight(t.bigWeight);
  else textStyle(t.bigWeight >= 600 ? BOLD : NORMAL);
  try { drawingContext.letterSpacing = (t.bigTrack * t.bigSize) + 'px'; } catch (e) {}
}

function setSmall(size, track) {
  const t = TYPES[typeIndex];
  const tr = (track === undefined) ? t.smallTrack : track;
  textFont(t.small);
  textSize(size);
  if (typeof textWeight === 'function') textWeight(t.smallWeight);
  else textStyle(t.smallWeight >= 600 ? BOLD : NORMAL);
  try { drawingContext.letterSpacing = (tr * size) + 'px'; } catch (e) {}
}

// Measures where the ink of a piece of the time really starts and ends (not the invisible space
// around each letter), so the gaps around the colon can be set by eye-distance instead of by font metrics.
function inkBox(s) {
  const t = TYPES[typeIndex];
  const c = drawingContext;
  try {
    const prev = c.font;
    c.font = t.bigWeight + ' ' + t.bigSize + 'px ' + t.big;
    const mm = c.measureText(s);
    c.font = prev;
    if (typeof mm.actualBoundingBoxLeft === 'number') {
      return { l: mm.actualBoundingBoxLeft, r: mm.actualBoundingBoxRight };
    }
  } catch (e) {}
  return { l: 0, r: textWidth(s) };
}

function drawHeader(h12, m) {
  const th = THEMES[themeIndex];
  const t = TYPES[typeIndex];
  const g = gridSize();
  const gy0 = PH - FOOT - g.h;                          // top edge of the grid
  const col2 = M + (g.cell + g.G);                       // left edges of the 2nd and 3rd columns of boxes
  noStroke();
  fill(...th.ink);
  textAlign(LEFT, BASELINE);

  // ----- the time: small, with the same clear gap of ink on both sides of the colon -----
  setBig();
  const base = M + t.bigSize * 0.72;
  const gap = t.bigSize * 0.2;
  const hs = str(h12);
  const ms = nf(m, 2);
  const A = inkBox(hs);
  const C = inkBox(':');
  const B = inkBox(ms);

  let x = M + A.l;                                      // the first digit sits exactly on the margin
  text(hs, x, base);
  let edge = x + A.r;
  x = edge + gap + C.l;
  text(':', x, base);
  edge = x + C.r;
  x = edge + gap + B.l;
  text(ms, x, base);

  // ----- small type, set on the same three columns as the boxes -----
  const ss = 9.5;
  setSmall(ss);

  const yc = gy0 - 18;
  text('HOURS ' + nf(h12, 2) + ' / 12', M, yc);
  text('MINUTES ' + nf(m, 2) + ' / 60', col2, yc);

  // ----- settings and keys, starting at the second column and running across to the right edge -----
  drawInfo(col2, M + 8.5 * 0.75, 2 * g.cell + g.G);

  // ----- the seconds ruler -----
  drawSeconds();

  // ----- footer line -----
  fill(...th.ink);
  setSmall(ss);
  text(showSeconds ? 'TWELVE HOURS \u00D7 FIVE MINUTES \u00D7 SIXTY SECONDS' : 'TWELVE HOURS \u00D7 FIVE MINUTES', M, PH - 26);

  try { drawingContext.letterSpacing = '0px'; } catch (e) {}
}

// The seconds: a row of 60 small squares under the grid, 20 under each column of boxes.
// One square fills in every second, left to right. Squares still to come are faint.
function drawSeconds() {
  if (!showSeconds) return;
  const th = THEMES[themeIndex];
  const g = gridSize();
  const sec = currentSecond();
  const per = 20;                                    // squares under each column
  const sg = 2.2;                                    // the small space between squares
  const c = (g.cell - (per - 1) * sg) / per;         // square size, so 20 of them exactly span one box
  const top = PH - FOOT + 16;
  noStroke();
  for (let k = 0; k < 3; k++) {
    for (let j = 0; j < per; j++) {
      const i = k * per + j;
      if (i <= sec) fill(th.ink[0], th.ink[1], th.ink[2]);
      else fill(th.ink[0], th.ink[1], th.ink[2], 70);
      rect(M + k * (g.cell + g.G) + j * (c + sg), top, c, c);
    }
  }
}

// The keys printed on the poster (H hides it): a small table in four columns.
// The key itself is bold, what it does is lighter.
function drawInfo(x, y, w) {
  if (!showHelp) return;
  const th = THEMES[themeIndex];
  const ss = 10;
  const lead = 14.5;

  // the keys: [key, what it does], filled down each column
  const keys = [
    ['\u2190 \u2192', 'MIN'], ['\u2191 \u2193', 'HOUR'], ['R', 'REAL TIME'], ['A', 'PLAY'],
    ['D', 'SECONDS'], ['C', 'COLOR'], ['N', 'SCREEN'], ['X', 'GRAIN'],
    ['F', 'FRAME'], ['G', 'GUTTER'], ['M', 'POSITION'], ['V', 'VIEW'],
    ['P', 'SAVE'], ['H', 'HIDE']
  ];
  const rows = 4;
  const colW = w / 4;
  for (let i = 0; i < keys.length; i++) {
    const cx = x + floor(i / rows) * colW;
    const cy = y + (i % rows) * lead;
    // the key, bold and full strength
    setSmall(ss, 0.06);
    if (typeof textWeight === 'function') textWeight(700);
    fill(th.ink[0], th.ink[1], th.ink[2]);
    text(keys[i][0], cx, cy);
    const kw = textWidth(keys[i][0]);
    // what it does, a little lighter
    setSmall(ss, 0.06);
    fill(th.ink[0], th.ink[1], th.ink[2], 210);
    text(keys[i][1], cx + kw + 7, cy);
  }

  // until the first click, a reminder under the table
  if (!activated) {
    setSmall(ss, 0.08);
    fill(th.ink[0], th.ink[1], th.ink[2]);
    text('CLICK THE POSTER ONCE, THEN USE THE KEYS', x, y + rows * lead + 4);
  }
}

// ---------- CONTROLS ----------
function mousePressed() {
  activated = true;
}

function keyPressed() {
  activated = true;

  if (key === 'r' || key === 'R') { offset = 0; frozenAt = null; playing = false; showSeconds = true; }   // back to the real time
  if (key === 'a' || key === 'A') {
    playing = !playing;
    showSeconds = !playing;          // the seconds rest while it plays (press D to bring them back)
  }
  if (key === 'd' || key === 'D') showSeconds = !showSeconds;
  if (key === 'c' || key === 'C') themeIndex = (themeIndex + 1) % THEMES.length;
  if (key === 'n' || key === 'N') toneIndex = (toneIndex + 1) % TONES.length;
  if (key === 'x' || key === 'X') grainLevel = (grainLevel + 1) % 3;
  if (key === 'f' || key === 'F') frameIndex = (frameIndex + 1) % FRAMES.length;
  if (key === 'g' || key === 'G') gapIndex = (gapIndex + 1) % GAPS.length;
  if (key === 'm' || key === 'M') corner = !corner;
  if (key === 'v' || key === 'V') showSheet = !showSheet;
  if (key === 'h' || key === 'H') showHelp = !showHelp;
  if (key === 'p' || key === 'P') savePoster();

  // arrow keys: checked by name and by key code so this works in older and newer p5.js
  if (key === 'ArrowRight' || keyCode === 39) shiftTime(1);
  if (key === 'ArrowLeft'  || keyCode === 37) shiftTime(-1);
  if (key === 'ArrowUp'    || keyCode === 38) shiftTime(60);
  if (key === 'ArrowDown'  || keyCode === 40) shiftTime(-60);
  return false;
}

// saves just the poster as a PNG (a bigger browser window gives a bigger file)
function savePoster() {
  try {
    const img = get(sheetX, sheetY, PW * sheetS, PH * sheetS);
    save(img, 'time-poster.png');
  } catch (e) {
    console.log('Could not save the poster: ' + e);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
