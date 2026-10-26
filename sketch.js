// ---------- SETTINGS ----------
let offset = 0;                  // minutes added to the real time (arrow keys change this)
let frozenAt = null;             // space bar freezes the time here (in minutes after midnight)
let themeIndex = 0;              // C: cycles the color themes (always just two colors: paper and ink)
let typeIndex = 1;               // T: cycles the typefaces
let toneIndex = 0;               // N: how hours still to come are printed (dots, bitmap dots, diagonal lines, flat tint)
let grainLevel = 2;              // X: paper grain off / light / heavy
let frameIndex = 1;              // F: cycles the frame weight
let gapIndex = 1;                // G: cycles the space between boxes
let corner = false;              // M: false = builds into the middle, true = into the bottom-right corner
let showSheet = true;            // V: poster on a dark table (true) or poster fills the window (false)
let showHelp = true;             // H: hides or shows the small key list printed on the poster
let activated = false;           // becomes true after the first click or key press
let playing = false;             // A: the time runs through the day very fast
let speedIndex = 0;              // S: cycles the play speed
let aboutMode = 1;               // 1 = the text replaces the key table, 2 = the text sits above the key table
let showSeconds = true;          // D: the ruler of 60 ticks (seconds) under the grid
let hideUI = false;              // true for the one frame that is saved: no icons, no play button
let pendingSave = false;
let typeNoteUntil = 0;           // the name of the typeface shows in the footer for a moment after pressing T
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
  { name: 'AVENIR NEXT',
    big: "'Avenir Next', Avenir, 'Century Gothic', sans-serif", bigWeight: 700, bigSize: 40, bigTrack: 0,
    small: "'Avenir Next', Avenir, 'Century Gothic', sans-serif", smallWeight: 500, smallTrack: 0.1 },
  { name: 'GILL SANS',
    big: "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif", bigWeight: 700, bigSize: 44, bigTrack: 0,
    small: "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif", smallWeight: 400, smallTrack: 0.1 },
  { name: 'OPTIMA',
    big: "Optima, Candara, 'Segoe UI', sans-serif", bigWeight: 700, bigSize: 42, bigTrack: 0,
    small: "Optima, Candara, 'Segoe UI', sans-serif", smallWeight: 400, smallTrack: 0.1 },
  { name: 'BODONI + FUTURA',
    big: "'Bodoni 72', Didot, 'Bodoni MT', 'Times New Roman', serif", bigWeight: 700, bigSize: 46, bigTrack: 0,
    small: "Futura, 'Century Gothic', 'Avenir Next', sans-serif", smallWeight: 500, smallTrack: 0.1 },
  { name: 'HELVETICA + MONO',
    big: "'Helvetica Neue', Helvetica, Arial, sans-serif", bigWeight: 700, bigSize: 42, bigTrack: -0.01,
    small: "Menlo, Monaco, 'Courier New', monospace", smallWeight: 400, smallTrack: 0.02 }
];

const TONES = ['HALFTONE', 'BITMAP', 'STIPPLE', 'HATCH', 'TINT'];

// frame thickness around each box, measured on a 187px box (it scales with the box)
const FRAMES = [8, 14, 22, 32];

// space between boxes, in poster units
const GAPS = [6, 12];

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
let toneScale = 0.125;           // size of one tile of the screen, in poster units per tile pixel
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
  const kind = TONES[toneIndex];
  const bitmap = kind === 'BITMAP';
  const stipple = kind === 'STIPPLE';
  tile.width = stipple ? 128 : (bitmap ? 64 : 32);
  tile.height = tile.width;
  const g = tile.getContext('2d');
  g.fillStyle = 'rgb(' + th.ink[0] + ',' + th.ink[1] + ',' + th.ink[2] + ')';
  if (stipple) {
    // scattered dots of slightly different sizes, like a hand-stippled print (a jittered grid keeps it even)
    let seed = 777;
    const rnd = function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let gy = 0; gy < 21; gy++) {
      for (let gx = 0; gx < 21; gx++) {
        g.beginPath();
        g.arc((gx + rnd()) * 6.1, (gy + rnd()) * 6.1, 1.3 + rnd() * 1.4, 0, Math.PI * 2);
        g.fill();
      }
    }
  } else if (bitmap) {
    g.beginPath(); g.arc(32, 32, 15, 0, Math.PI * 2); g.fill();     // big, spaced dots on a straight grid
  } else if (TONES[toneIndex] === 'HALFTONE') {
    // dots on a 45 degree grid, sitting on the corners and the middle of the tile,
    // so a box that starts at a tile corner is a mirror image of itself, top to bottom and left to right
    const pts = [[0, 0], [32, 0], [0, 32], [32, 32], [16, 16]];
    for (let q = 0; q < pts.length; q++) {
      g.beginPath(); g.arc(pts[q][0], pts[q][1], 7.6, 0, Math.PI * 2); g.fill();
    }
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
  toneScale = stipple ? 0.5 : 0.125;
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
    // start the screen at this box's own top-left corner, so every box gets the same, even edges
    try { tonePattern.setTransform(new DOMMatrix([toneScale, 0, 0, toneScale, x, y])); } catch (e) {}
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

  // saving: this frame was drawn without the icons and the play button, so grab the poster now
  if (pendingSave) {
    pendingSave = false;
    try {
      const img = get(sheetX, sheetY, PW * sheetS, PH * sheetS);
      save(img, 'time-poster.png');
    } catch (e) {
      console.log('Could not save the poster: ' + e);
    }
    hideUI = false;
  }

  cursor((overPlay() || hitUnderMouse()) ? 'pointer' : 'default');
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
  const ss = 10.5;
  setSmall(ss);

  const yc = gy0 - 18;
  text('HOURS ' + nf(h12, 2) + ' / 12', M, yc);
  text('MINUTES ' + nf(m, 2) + ' / 60', col2, yc);

  // ----- settings and keys, starting at the second column and running across to the right edge -----
  hoverName = '';
  if (!playing && !hideUI) drawAbout(col2, M + 8.5 * 0.75, 2 * g.cell + g.G);   // the text rests while the clock plays

  // ----- the play button -----
  if (!hideUI) drawPlayButton();

  // ----- the seconds ruler -----
  drawSeconds();

  // ----- footer line -----
  fill(...th.ink);
  setSmall(ss);
  text(hoverName !== '' ? hoverName : millis() < typeNoteUntil ? 'TYPE  ' + TYPES[typeIndex].name : (showSeconds ? 'TWELVE HOURS \u00D7 FIVE MINUTES \u00D7 SIXTY SECONDS' : 'TWELVE HOURS \u00D7 FIVE MINUTES'), M, PH - 26);

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

// ---------- THE PLAY BUTTON ----------
// a solid block under the time, with a play triangle (or two pause bars while it is running)
function playRect() {
  const t = TYPES[typeIndex];
  const g = gridSize();
  const base = M + t.bigSize * 0.72;                     // the baseline of the time
  let capH = t.bigSize * 0.72;                           // the height of the digits
  try {
    const c = drawingContext;
    const prev = c.font;
    c.font = t.bigWeight + ' ' + t.bigSize + 'px ' + t.big;
    const mm = c.measureText('0123456789');
    c.font = prev;
    if (typeof mm.actualBoundingBoxAscent === 'number' && mm.actualBoundingBoxAscent > 0) capH = mm.actualBoundingBoxAscent;
  } catch (e) {}
  // as tall as the digits, level with them; the tip of the triangle lines up with the right edge of the first box
  const pw = capH * 0.87;
  return { x: M + g.cell - pw, y: base - capH, w: pw, h: capH };
}

function drawPlayButton() {
  const th = THEMES[themeIndex];
  const r = playRect();
  noStroke();
  fill(...th.ink);
  if (playing) {
    rect(r.x, r.y, r.w * 0.36, r.h);                    // two bars: pause
    rect(r.x + r.w * 0.64, r.y, r.w * 0.36, r.h);
  } else {
    triangle(r.x, r.y, r.x, r.y + r.h, r.x + r.w, r.y + r.h / 2);   // a bare triangle: play
  }
}

// is the mouse over the play button?
function overPlay() {
  const r = playRect();
  const px = (mouseX - sheetX) / sheetS;
  const py = (mouseY - sheetY) / sheetS;
  const pad = 6;                                          // a little extra to click on
  return px >= r.x - pad && px <= r.x + r.w + pad && py >= r.y - pad && py <= r.y + r.h + pad;
}

function togglePlay() {
  playing = !playing;
  showSeconds = !playing;          // the seconds rest while it plays (press D to bring them back)
}

// ---------- THE TEXT AT THE TOP ----------
const ABOUT = '';                       // no sentence up here
// [key shown, name shown, what clicking it does]
const ABOUT_KEYS = [
  ['\u2190 \u2192', 'MIN', 'min'], ['\u2191 \u2193', 'HOUR', 'hour'], ['R', 'REAL TIME', 'r'], ['A', 'PLAY', 'a'], ['D', 'SECONDS', 'd'],
  ['C / CLICK', 'COLOR', 'c'], ['N', 'SCREEN', 'n'], ['X', 'GRAIN', 'x'], ['F', 'FRAME', 'f'], ['G', 'GUTTER', 'g'],
  ['P', 'SAVE', 'p'], ['H', 'HIDE', 'h']
];
let hoverName = '';
const ICON_REST = 1;                 // how visible the icons are once they have faded (1 = they never fade)
let iconAlpha = 1;                  // how visible the icons are (1 = fully, 0 = gone)
let iconsUntil = 6000;              // the icons stay visible for the first few seconds, then fade away
let hits = [];                      // where each control sits on the poster, so it can be clicked

// does the same thing as pressing the key (back = true goes the other way for the time)
function doAction(a, back) {
  if (a === 'r') { offset = 0; frozenAt = null; playing = false; showSeconds = true; }
  if (a === 'a') togglePlay();
  if (a === 'd') showSeconds = !showSeconds;
  if (a === 'c') themeIndex = (themeIndex + 1) % THEMES.length;
  if (a === 'n') toneIndex = (toneIndex + 1) % TONES.length;
  if (a === 'x') grainLevel = (grainLevel + 1) % 3;
  if (a === 'f') frameIndex = (frameIndex + 1) % FRAMES.length;
  if (a === 'g') gapIndex = (gapIndex + 1) % GAPS.length;
  if (a === 'm') corner = !corner;
  if (a === 'v') showSheet = !showSheet;
  if (a === 'h') showHelp = !showHelp;
  if (a === 'p') savePoster();
  if (a === 'min') shiftTime(back ? -1 : 1);
  if (a === 'hour') shiftTime(back ? -60 : 60);
}

// the mouse position in poster units
function mouseOnPoster() {
  return { x: (mouseX - sheetX) / sheetS, y: (mouseY - sheetY) / sheetS };
}

// which control (if any) is under the mouse
function hitUnderMouse() {
  if (iconAlpha < 0.5) return null;                      // hidden icons cannot be clicked by accident
  const p = mouseOnPoster();
  for (let i = 0; i < hits.length; i++) {
    const h = hits[i];
    if (p.x >= h.x && p.x <= h.x + h.w && p.y >= h.y && p.y <= h.y + h.h) return h;
  }
  return null;
}

// the description, then (in mode 1) the keys as a running line, or (in mode 2) the key table underneath
function drawAbout(x, y, w) {
  hits = [];
  if (!showHelp) return;
  const th = THEMES[themeIndex];
  const ss = 11.5;
  const lead = 16.5;
  noStroke();

  // the description, wrapped to the width
  setSmall(ss, 0.04);
  fill(th.ink[0], th.ink[1], th.ink[2]);
  const rows = ABOUT.split('\n');
  let cy = y;
  for (let r = 0; r < rows.length; r++) {
    const words = rows[r].split(' ');
    let line = '';
    for (let i = 0; i < words.length; i++) {
      const test = line === '' ? words[i] : line + ' ' + words[i];
      if (textWidth(test) > w && line !== '') {
        text(line, x, cy);
        cy += lead;
        line = words[i];
      } else {
        line = test;
      }
    }
    text(line, x, cy);
    cy += lead;
  }

  if (aboutMode === 2) {
    drawInfo(x, cy + 6, w);
    return;
  }

  // the controls: seven pictograms in one row, level with the time, running from the second column to the right edge of the grid
  const size = 12.5;                                    // small, set on the footer line
  const step = 30;
  const r = { y: PH - 26 - size + 1, h: size };          // level with the footer text
  const c = drawingContext;
  const mp = mouseOnPoster();
  const n = ICONS.length;
  let hovered = null;

  // the icons show for the first few seconds, then fade away. Move the mouse over the row (or near it) and they come back.
  const nearRow = mp.x >= x + w - (n - 1) * step - 40 && mp.x <= x + w + 24 && mp.y >= r.y - 30 && mp.y <= r.y + r.h + 30;
  if (nearRow) iconsUntil = millis() + 1500;            // stay a moment after the mouse leaves
  const target = millis() < iconsUntil ? 1 : ICON_REST;
  iconAlpha += (target - iconAlpha) * 0.1;
  if (abs(target - iconAlpha) < 0.01) iconAlpha = target;

  for (let k = 0; k < n; k++) {
    const ix = x + w - size - (n - 1 - k) * step;       // right-aligned to the edge of the grid
    const iy = r.y;
    const hit = { x: ix - 7, y: iy - 8, w: size + 14, h: size + 16, a: ICONS[k][2], ix: ix, iy: iy, size: size, name: ICONS[k][0] };
    hits.push(hit);
    const over = mp.x >= hit.x && mp.x <= hit.x + hit.w && mp.y >= hit.y && mp.y <= hit.y + hit.h;
    if (over && iconAlpha > 0.5) hovered = hit;
    c.save();
    c.globalAlpha = (over && iconAlpha > 0.5 ? 0.4 : 1) * iconAlpha;   // the icon under the mouse fades, so you can tell it is a button
    drawIcon(ICONS[k][1], ix, iy, size, th);
    c.restore();
  }
  if (hovered) hoverName = hovered.name;
}

// ---------- THE PICTOGRAMS ----------
// [name shown on hover, shape, what clicking does]
const ICONS = [
  ['SECONDS  D', 'sec', 'd'],
  ['COLOR  C', 'color', 'c'],
  ['SCREEN  N', 'screen', 'n'],
  ['GRAIN  X', 'grain', 'x'],
  ['FRAME  F', 'frame', 'f'],
  ['GUTTER  G', 'gutter', 'g'],
  ['SAVE  P', 'save', 'p']
];

function drawIcon(kind, x, y, s, th) {
  const c = drawingContext;
  const ink = 'rgb(' + th.ink[0] + ',' + th.ink[1] + ',' + th.ink[2] + ')';
  const paper = 'rgb(' + th.paper[0] + ',' + th.paper[1] + ',' + th.paper[2] + ')';
  const m = s / 2;
  const tri = function (a, b, c2, d, e, f) { c.beginPath(); c.moveTo(a, b); c.lineTo(c2, d); c.lineTo(e, f); c.closePath(); c.fill(); };
  c.fillStyle = ink;
  c.strokeStyle = ink;
  c.lineWidth = 1.4;
  if (kind === 'min') {                                // two triangles, left and right
    tri(x, y + m, x + s * 0.4, y + m - s * 0.3, x + s * 0.4, y + m + s * 0.3);
    tri(x + s, y + m, x + s * 0.6, y + m - s * 0.3, x + s * 0.6, y + m + s * 0.3);
  } else if (kind === 'hour') {                        // two triangles, up and down
    tri(x + m, y, x + m - s * 0.3, y + s * 0.4, x + m + s * 0.3, y + s * 0.4);
    tri(x + m, y + s, x + m - s * 0.3, y + s * 0.6, x + m + s * 0.3, y + s * 0.6);
  } else if (kind === 'real') {                        // a square ring with a square in the middle: now
    c.fillRect(x, y, s, s);
    c.fillStyle = paper;
    c.fillRect(x + s * 0.2, y + s * 0.2, s * 0.6, s * 0.6);
    c.fillStyle = ink;
    c.fillRect(x + s * 0.36, y + s * 0.36, s * 0.28, s * 0.28);
  } else if (kind === 'sec') {                         // one small square
    c.fillRect(x + s * 0.3, y + s * 0.3, s * 0.4, s * 0.4);
  } else if (kind === 'color') {                       // a square split in two colors
    c.fillRect(x, y, s, s);
    c.fillStyle = paper;
    c.beginPath(); c.moveTo(x + s, y); c.lineTo(x + s, y + s); c.lineTo(x, y + s); c.fill();
    c.strokeRect(x, y, s, s);
  } else if (kind === 'screen') {                      // four squares
    const q = s * 0.4;
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) c.fillRect(x + i * (s - q), y + j * (s - q), q, q);
    }
  } else if (kind === 'grain') {                       // three specks on a diagonal
    const q = s * 0.24;
    c.fillRect(x, y + s - q, q, q);
    c.fillRect(x + m - q / 2, y + m - q / 2, q, q);
    c.fillRect(x + s - q, y, q, q);
  } else if (kind === 'frame') {                       // a square with a square hole
    c.fillRect(x, y, s, s);
    c.fillStyle = paper;
    c.fillRect(x + s * 0.24, y + s * 0.24, s * 0.52, s * 0.52);
  } else if (kind === 'gutter') {                      // two bars with a gap
    c.fillRect(x, y, s * 0.42, s);
    c.fillRect(x + s * 0.58, y, s * 0.42, s);
  } else if (kind === 'save') {                        // one triangle pointing down
    tri(x, y + s * 0.1, x + s, y + s * 0.1, x + m, y + s * 0.9);
  } else if (kind === 'hide') {                        // an empty square
    c.lineWidth = 2.2;
    c.strokeRect(x + 1.1, y + 1.1, s - 2.2, s - 2.2);
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
  const hit = hitUnderMouse();
  if (hit) {
    const mp = mouseOnPoster();
    let back = false;
    if (hit.a === 'min') back = mp.x < hit.ix + hit.size / 2;      // left half: a minute back, right half: a minute on
    if (hit.a === 'hour') back = mp.y > hit.iy + hit.size / 2;     // top half: an hour on, bottom half: an hour back
    doAction(hit.a, back);
  }
  else if (overPlay()) togglePlay();                    // the play button
  else themeIndex = (themeIndex + 1) % THEMES.length;   // anywhere else on the poster: change the color
  return false;
}

function keyPressed() {
  activated = true;

  if (key === 'r' || key === 'R') { offset = 0; frozenAt = null; playing = false; showSeconds = true; }   // back to the real time
  if (key === 'a' || key === 'A') togglePlay();
  if (key === 'd' || key === 'D') showSeconds = !showSeconds;
  if (key === 'c' || key === 'C') themeIndex = (themeIndex + 1) % THEMES.length;
  if (key === 'n' || key === 'N') toneIndex = (toneIndex + 1) % TONES.length;
  if (key === 'x' || key === 'X') grainLevel = (grainLevel + 1) % 3;
  if (key === 'f' || key === 'F') frameIndex = (frameIndex + 1) % FRAMES.length;
  if (key === 'g' || key === 'G') gapIndex = (gapIndex + 1) % GAPS.length;
  if (key === 'm' || key === 'M') corner = !corner;
  if (key === 'v' || key === 'V') showSheet = !showSheet;
  if (key === 'h' || key === 'H') showHelp = !showHelp;
  if (key === 't' || key === 'T') { typeIndex = (typeIndex + 1) % TYPES.length; typeNoteUntil = millis() + 2500; }
  if (key === 'p' || key === 'P') savePoster();

  // arrow keys: checked by name and by key code so this works in older and newer p5.js
  if (key === 'ArrowRight' || keyCode === 39) shiftTime(1);
  if (key === 'ArrowLeft'  || keyCode === 37) shiftTime(-1);
  if (key === 'ArrowUp'    || keyCode === 38) shiftTime(60);
  if (key === 'ArrowDown'  || keyCode === 40) shiftTime(-60);
  return false;
}

// saves just the poster as a PNG, without the icons and the play button (a bigger browser window gives a bigger file)
function savePoster() {
  hideUI = true;                  // the next frame is drawn without the icons and the play button
  pendingSave = true;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
