import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import gifenc from "gifenc";
import { fetchCalendar } from "./calendar.mjs";
import { drawRyuk } from "./ryuk.mjs";

const { GIFEncoder } = gifenc;
const WIDTH = 384;
const HEIGHT = 132;
const SCALE = 2;
const FRAME_MS = 100;
const DURATION = 10.4;
const FOLD_START = 4.45;
const FOLD_END = 6.65;

const themes = {
  light: {
    bg: "eee9de", grid: "ded5c7", frame: "b4a8a2", text: "36334a",
    shadow: "dbd0c5", cover: "544862", spine: "302b42",
    paper: "fbf0d6", paperEdge: "c2a886", rule: "dfccaa", lining: "e8d9bd",
    crease: "dec39e", cell: "ddceb5",
  },
  dark: {
    bg: "292739", grid: "383548", frame: "58516a", text: "eee5d3",
    shadow: "222031", cover: "615371", spine: "1a1828",
    paper: "ebdfc6", paperEdge: "a58e80", rule: "cab59e", lining: "d6c5ae",
    crease: "c7ac94", cell: "c8b79f",
  },
};

const spriteColors = {
  outline: "201c32", wing: "484059", feather: "605972",
  hair: "322b48", hairLight: "61577a", coat: "39334e",
  leather: "6a607c", ruff: "9c92a8", face: "c5cdd8",
  faceShadow: "8794a9", teeth: "f6eddf", eye: "f5d17f",
  ink1: "b97979", ink2: "aa5264", ink3: "9e3d58", ink4: "84324e",
  appleShadow: "8f2c46", apple: "d44759", appleLight: "ff8d7c", leaf: "668d64",
};

const letters = {
  A: ["01110", "11011", "11011", "11111", "11011", "11011", "11011"],
  D: ["11110", "11011", "11011", "11011", "11011", "11011", "11110"],
  E: ["11111", "11000", "11000", "11110", "11000", "11000", "11111"],
  H: ["11011", "11011", "11011", "11111", "11011", "11011", "11011"],
  N: ["11001", "11101", "11101", "11011", "11011", "11011", "11001"],
  O: ["01110", "11011", "11011", "11011", "11011", "11011", "01110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["11011", "11011", "11011", "11011", "11011", "11011", "01110"],
  Y: ["11011", "11011", "11011", "01110", "00100", "00100", "00100"],
  Z: ["11111", "00011", "00110", "01100", "11000", "11000", "11111"],
};

function createCanvas(colors) {
  const indices = Object.fromEntries(Object.keys(colors).map((name, index) => [name, index]));
  const palette = Object.values(colors).map((hex) => (
    hex.match(/../g).map((channel) => Number.parseInt(channel, 16))
  ));
  const pixels = new Uint8Array(WIDTH * HEIGHT);

  function rect(x, y, width, height, color) {
    const start = Math.max(0, x);
    const end = Math.min(WIDTH, x + width);
    for (let row = Math.max(0, y); row < Math.min(HEIGHT, y + height); row++) {
      pixels.fill(indices[color], row * WIDTH + start, row * WIDTH + end);
    }
  }

  function polygon(vertices, color) {
    const ys = vertices.map(([, y]) => y);
    for (let y = Math.min(...ys); y < Math.max(...ys); y++) {
      const crossings = [];
      for (let i = 0; i < vertices.length; i++) {
        const [x1, y1] = vertices[i];
        const [x2, y2] = vertices[(i + 1) % vertices.length];
        const row = y + 0.5;
        if (row < Math.min(y1, y2) || row >= Math.max(y1, y2)) continue;
        crossings.push(x1 + (x2 - x1) * (row - y1) / (y2 - y1));
      }
      crossings.sort((a, b) => a - b);
      for (let i = 0; i < crossings.length; i += 2) {
        const left = Math.round(crossings[i]);
        rect(left, y, Math.round(crossings[i + 1]) - left, 1, color);
      }
    }
  }

  function word(value, x, y, size, color) {
    Array.from(value).forEach((letter, index) => {
      if (letter === " ") return;
      letters[letter].forEach((row, dy) => {
        Array.from(row).forEach((ink, dx) => {
          if (ink === "1") rect(x + (6 * index + dx) * size, y + dy * size, size, size, color);
        });
      });
    });
  }

  return { pixels, palette, rect, polygon, word };
}

function clamp(value) {
  return Math.max(0, Math.min(1, value));
}

function progress(time, start, end) {
  return clamp((time - start) / (end - start));
}

function ease(fraction) {
  return fraction * fraction * (3 - 2 * fraction);
}

function mix(start, end, fraction) {
  return start + (end - start) * fraction;
}

function drawBackdrop({ rect, word }) {
  rect(0, 0, WIDTH, HEIGHT, "bg");
  for (let x = 16; x < WIDTH - 10; x += 6) {
    for (let y = 13; y < 116; y += 6) rect(x, y, 1, 1, "grid");
  }
  rect(7, 6, 370, 1, "frame");
  rect(7, 125, 370, 1, "frame");
  rect(7, 7, 1, 118, "frame");
  rect(376, 7, 1, 118, "frame");
  rect(10, 9, 6, 1, "frame");
  rect(10, 9, 1, 6, "frame");
  rect(368, 122, 6, 1, "frame");
  rect(373, 117, 1, 6, "frame");
  word("YAZUE", 24, 16, 3, "text");
  rect(24, 41, 16, 1, "appleShadow");
  rect(43, 41, 68, 1, "frame");
}

function drawBook({ polygon, rect, word }, open) {
  const left = Math.round(mix(92, 17, open));
  const right = Math.round(mix(202, 264, open));
  const top = Math.round(mix(57, 48, open));
  polygon([[left - 8, 108], [left + 7, 101], [right + 16, 99], [right + 20, 109],
    [right + 8, 114], [left + 4, 115]], "shadow");
  polygon([[left + 9, top], [right - 12, top - 4], [right + 4, 104], [right - 2, 109],
    [left + 5, 112], [left - 2, 108]], "spine");
  polygon([[left + 10, top + 4], [right - 12, top], [right + 1, 103],
    [right - 6, 106], [left + 6, 109], [left + 1, 106]], "paperEdge");
  polygon([[left + 9, top], [right - 12, top - 4], [right + 1, 101],
    [left + 1, 106]], "cover");
  rect(left + 10, top + 4, 1, 44, "spine");
  if (open < 0.28) {
    word("DEATH", left + 23, top + 6, 2, "teeth");
    word("NOTE", left + 23, top + 22, 2, "teeth");
    rect(left + 23, top + 39, 23, 1, "appleShadow");
  } else {
    const spine = Math.round((left + right) / 2);
    const pageLeft = Math.round(mix(spine - 15, left + 12, open));
    const pageRight = right - 12;
    polygon([[pageLeft, top + 4], [spine - 15, top + 3], [spine, top + 10],
      [spine, 103], [spine - 15, 99], [pageLeft - 7, 102]], "lining");
    polygon([[spine, top + 10], [spine + 16, top + 2], [pageRight, top + 1],
      [pageRight + 10, 98], [spine + 16, 100], [spine, 103]], "lining");
    rect(spine - 1, top + 11, 2, 44, "paperEdge");
    for (let y = top + 16; y < 96; y += 7) {
      rect(pageLeft + 4, y, spine - pageLeft - 18, 1, "rule");
      rect(spine + 16, y, pageRight - spine - 18, 1, "rule");
    }
  }
}

function drawApple({ polygon, rect }, x, y, size = 1, bitten = false) {
  const point = ([dx, dy]) => [Math.round(x + dx * size), Math.round(y + dy * size)];
  const shape = (vertices, color) => polygon(vertices.map(point), color);
  const detail = (dx, dy, width, height, color) => {
    const [left, top] = point([dx, dy]);
    rect(left, top, Math.max(1, Math.round(width * size)), Math.max(1, Math.round(height * size)), color);
  };
  shape([[-4, -5], [0, -4], [4, -5], [7, -2], [7, 2], [3, 6], [0, 5], [-3, 6], [-7, 2], [-7, -2]], "appleShadow");
  shape([[-4, -4], [0, -3], [4, -4], [6, -2], [6, 2], [2, 5], [0, 4], [-3, 5], [-6, 2], [-6, -2]], "apple");
  detail(-4, -2, 2, 2, "appleLight");
  detail(0, -7, 1, 3, "spine");
  detail(1, -8, 3, 2, "leaf");
  if (bitten) {
    detail(4, -2, 2, 3, "paper");
    detail(5, -1, 2, 1, "paperEdge");
  }
}

function drawSpark({ rect }, x, y, size, color) {
  rect(x - size, y, size * 2 + 1, 1, color);
  rect(x, y - size, 1, size * 2 + 1, color);
}

function calendarGeometry(calendar, time) {
  const reveal = ease(progress(time, 1.4, 2.9));
  const fold = progress(time, FOLD_START, FOLD_END) * (calendar.columns + 12) - 6;
  const visible = Math.ceil(calendar.columns * reveal);
  const lift = Math.round(13 * Math.sin(reveal * Math.PI));
  const vanish = ease(progress(time, 6.69, 7.13));
  const left = Math.round(mix(62, 27, ease(progress(time, 1.4, 1.93))));

  function edge(column) {
    const bunched = clamp((fold - column) / 4);
    const x = left + 4 * (column + Math.max(0, fold - column) * 0.92);
    const crease = Math.max(0, 1 - Math.abs(fold - column) / 6);
    const corrugation = column % 2 ? 4 : -2;
    const roll = Math.round(5 * Math.sin((visible - column) * 0.2) * (1 - reveal));
    return {
      x: Math.round(x + vanish * 12),
      y: 58 - lift - Math.round(crease * 17) + Math.round(bunched * corrugation) + roll + Math.round(vanish * 28),
    };
  }

  return { edge, visible, fold, vanish };
}

function drawCalendar({ rect, polygon }, calendar, sheet, time) {
  if (sheet.visible === 0 || sheet.vanish >= 1) return;

  const pageHeight = Math.round(42 * (1 - sheet.vanish));
  const calendarTop = 7;
  const first = sheet.edge(0);
  const last = sheet.edge(sheet.visible);
  if (pageHeight < 2) return;

  polygon([[first.x - 5, first.y + pageHeight - 3], [last.x + 8, last.y + pageHeight - 3],
    [last.x + 12, last.y + pageHeight + 5], [first.x - 2, first.y + pageHeight + 6]], "paperEdge");

  for (let column = 0; column < sheet.visible; column++) {
    const a = sheet.edge(column);
    const b = sheet.edge(column + 1);
    const bunched = column < sheet.fold;
    const width = Math.max(1, b.x - a.x);
    const edgeX = a.x + width;
    polygon([[a.x, a.y], [edgeX, b.y], [edgeX, b.y + pageHeight], [a.x, a.y + pageHeight]],
      bunched && column % 2 ? "crease" : "paper");
    if (width < 3 || pageHeight < 37) continue;

    for (let row = 0; row < 7; row++) {
      const level = calendar.levels[column][row];
      const fill = level && time < releaseTime(column, calendar.columns) ? `ink${level}` : "cell";
      rect(a.x + 1, Math.round((a.y + b.y) / 2) + calendarTop + row * 4, 3, 3, fill);
    }
    if (column % 8 === 0) rect(a.x + 1, a.y + 2, 2, 1, "paperEdge");
  }

  if (sheet.fold >= 0 && sheet.fold < sheet.visible) {
    const crease = sheet.edge(Math.round(sheet.fold));
    polygon([[crease.x - 2, crease.y + 1], [crease.x + 1, crease.y + 3],
      [crease.x + 1, crease.y + pageHeight - 2], [crease.x - 2, crease.y + pageHeight]], "paperEdge");
  }

  const innerHeight = Math.min(pageHeight, 8);
  rect(first.x - 3, first.y + 2, 3, innerHeight, "paper");
  rect(last.x, last.y, 5, pageHeight, "crease");
  rect(last.x + 3, last.y + 3, 1, Math.max(1, pageHeight - 6), "paperEdge");
}

function releaseTime(column, columns) {
  return FOLD_START + (FOLD_END - FOLD_START) * (column + 6) / (columns + 12);
}

function prepareCalendar({ columns, days }) {
  const levels = Array.from({ length: columns }, () => Array(7).fill(0));
  const activeDays = days.filter(({ level }) => level > 0);
  for (const { column, row, level } of activeDays) levels[column][row] = level;

  // A busy calendar still emits ink from every active tile. A dozen large
  // apples can cross the screen before their silhouettes start to merge.
  const largeCount = Math.min(12, activeDays.length);
  const largeDays = new Set(Array.from({ length: largeCount }, (_, index) => (
    activeDays[Math.round(index * (activeDays.length - 1) / Math.max(1, largeCount - 1))]
  )));
  const flights = activeDays.map((day) => {
    const start = releaseTime(day.column, columns);
    const source = calendarGeometry({ columns }, start).edge(day.column);
    const duration = 0.72 + (day.row % 3) * 0.13;
    return {
      ...day,
      start,
      end: start + duration,
      sourceX: source.x + 2,
      sourceY: source.y + 8 + day.row * 4,
      large: largeDays.has(day),
    };
  });
  return { columns, levels, flights, catchTime: Math.max(7.26, ...flights.map(({ end }) => end)) };
}

function drawFlights(canvas, calendar, time) {
  for (const { start, end, sourceX, sourceY, row, large, level } of calendar.flights) {
    if (time < start || time >= end) continue;
    const fraction = progress(time, start, end);
    const x = Math.round(mix(sourceX, 307, ease(fraction)));
    const y = Math.round(mix(sourceY, 87, fraction) - (42 + row * 3) * 4 * fraction * (1 - fraction));
    if (large && fraction > 0.18) {
      const scale = mix(0.34, 1.12, ease(progress(fraction, 0.18, 0.64)));
      drawApple(canvas, x, y, scale);
    } else {
      const size = large ? 4 : 2;
      canvas.rect(x, y, size, size, `ink${level}`);
    }
    if (large && fraction > 0.26 && fraction < 0.86) {
      canvas.rect(x - 10, y + 4, 3, 1, "appleLight");
      canvas.rect(x - 14, y + 6, 2, 1, "ink2");
    }
  }
}

function drawBookmark({ polygon, rect }, sheet, hand, time) {
  if (sheet.visible < 1 || time < 2.25 || time >= 7.11) return;
  const edge = sheet.edge(sheet.visible);
  const start = [edge.x + 1, edge.y + 32 - Math.round(18 * sheet.vanish)];
  const attached = time >= 4.4 && time <= 6.8;
  const reach = Math.round(mix(0, 12, ease(progress(time, 2.25, 3.4))));
  const end = attached ? [hand.x, hand.y] : [edge.x + reach, edge.y + 42 - Math.round(18 * sheet.vanish)];
  const bend = [Math.round((start[0] + end[0]) / 2), Math.round((start[1] + end[1]) / 2) + 3];
  polygon([start, bend, end, [end[0], end[1] + 3], [bend[0], bend[1] + 3], [start[0], start[1] + 3]], "apple");
  rect(end[0] - 2, end[1], 4, 4, "appleShadow");
}

function drawImpact(canvas, x, y, time, start, count) {
  const fraction = progress(time, start, start + 0.5);
  if (fraction === 0 || fraction === 1) return;
  for (let index = 0; index < count; index++) {
    const angle = Math.PI * (1.03 + 0.94 * index / (count - 1));
    const distance = 9 + 19 * fraction;
    const dx = Math.round(Math.cos(angle) * distance);
    const dy = Math.round(Math.sin(angle) * distance);
    drawSpark(canvas, x + dx, y + dy, fraction < 0.6 ? 2 : 1, index % 2 ? "eye" : "appleLight");
  }
}

function drawFrame(colors, calendar, time) {
  const canvas = createCanvas(colors);
  const { rect } = canvas;
  const { catchTime, flights } = calendar;
  const mouthTime = catchTime + 0.6;
  const biteTime = mouthTime + 0.13;
  const close = ease(progress(time, 8.55, 9.6));
  const open = ease(progress(time, 0.85, 1.93)) * (1 - close);
  const sheet = calendarGeometry(calendar, time);

  const reach = ease(progress(time, 3.84, 4.4));
  const pull = ease(progress(time, 4.4, 6.65));
  const eat = ease(progress(time, catchTime, mouthTime));
  const reset = ease(progress(time, biteTime + 0.31, 9.48));
  const hand = {
    x: Math.round(mix(mix(302 - reach * 24 + pull * 29, 327, eat), 302, reset)),
    y: Math.round(mix(mix(94 - pull * 5, 72, eat), 94, reset)),
  };
  const lean = clamp((reach * 0.9 - pull * 0.6 + eat * 0.7) * (1 - reset));
  const blink = [0.4, 3.5, 8.5, 9.7].some((blinkAt) => time >= blinkAt && time < blinkAt + 0.16);

  drawBackdrop(canvas);
  drawBook(canvas, open);
  drawCalendar(canvas, calendar, sheet, time);
  drawBookmark(canvas, sheet, hand, time);
  drawRyuk(canvas, { hand, blink, biting: time >= mouthTime && time < biteTime + 0.23, lean });
  if (time >= 0.2 && time < 0.87) {
    const fall = progress(time, 0.2, 0.87);
    const x = Math.round(mix(153, 188, fall));
    const y = Math.round(mix(4, 61, fall * fall));
    if (fall > 0.3) rect(x - 2, y - 13, 1, 5, "appleLight");
    drawApple(canvas, x, y);
  }
  drawImpact(canvas, 188, 61, time, 0.85, 7);
  drawFlights(canvas, calendar, time);
  if (flights.length && time >= catchTime && time < biteTime + 0.31) {
    drawApple(canvas, hand.x, hand.y - 4, 1, time >= biteTime);
    drawImpact(canvas, 327, 70, time, biteTime, 5);
  }
  return canvas;
}

function upscale(pixels) {
  const width = WIDTH * SCALE;
  const scaled = new Uint8Array(width * HEIGHT * SCALE);
  for (let y = 0; y < HEIGHT; y++) {
    const row = y * width * SCALE;
    for (let x = 0; x < WIDTH; x++) {
      scaled.fill(pixels[y * WIDTH + x], row + x * SCALE, row + (x + 1) * SCALE);
    }
    for (let dy = 1; dy < SCALE; dy++) {
      scaled.copyWithin(row + dy * width, row, row + width);
    }
  }
  return scaled;
}

async function render(outputDir, name, colors, calendar, times) {
  const gif = GIFEncoder();
  let previous = null;
  let palette;
  let delay = 0;

  function flush() {
    if (!previous) return;
    gif.writeFrame(upscale(previous), WIDTH * SCALE, HEIGHT * SCALE, {
      palette,
      delay,
      repeat: times.length === 1 ? -1 : 0,
    });
    palette = undefined;
  }

  for (const time of times) {
    const frame = drawFrame(colors, calendar, time);
    const pixels = Buffer.from(frame.pixels.buffer);
    if (previous?.equals(pixels)) {
      delay += FRAME_MS;
      continue;
    }
    flush();
    if (!previous) palette = frame.palette;
    previous = pixels;
    delay = FRAME_MS;
  }
  flush();
  gif.finish();
  await writeFile(resolve(outputDir, `${name}.gif`), gif.bytesView());
}

const outputDir = resolve(process.argv[2] ?? "profile-art");
const calendar = prepareCalendar(await fetchCalendar());
await mkdir(outputDir, { recursive: true });

const times = Array.from({ length: DURATION * 1000 / FRAME_MS }, (_, index) => index * FRAME_MS / 1000);
for (const [name, theme] of Object.entries(themes)) {
  const colors = { ...theme, ...spriteColors };
  await render(outputDir, `death-note-${name}`, colors, calendar, times);
  await render(outputDir, `death-note-${name}-still`, colors, calendar, [3.1]);
}
console.log(`Rendered ${calendar.columns} weeks and ${calendar.flights.length} active days.`);
