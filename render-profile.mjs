import { writeFile } from "node:fs/promises";
import gifenc from "gifenc";

const { GIFEncoder } = gifenc;
const WIDTH = 288;
const HEIGHT = 96;
const SCALE = 3;

const themes = {
  light: {
    bg: "eee9de", grid: "e2dacb", frame: "bbb1a4", text: "343248",
    shadow: "ddd4c8", cover: "4d4662", spine: "302b42",
    paper: "f8f0da", paperEdge: "c3ac91", rule: "c9bdad",
  },
  dark: {
    bg: "292739", grid: "343145", frame: "575168", text: "f1e8d8",
    shadow: "222030", cover: "625577", spine: "191727",
    paper: "e4d9bf", paperEdge: "998a80", rule: "ad9e91",
  },
};

const spriteColors = {
  outline: "201d32", wing: "423b57", feather: "5b5570",
  hair: "302b46", hairLight: "595273", coat: "39334e",
  leather: "625a78", ruff: "9891a4", face: "bfc8d5",
  faceShadow: "8592a9", teeth: "f1e9db", eye: "f5d17f",
  appleShadow: "982f46", apple: "d44955", appleLight: "ff8a79", leaf: "668d64",
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

function drawBackdrop({ rect, word }) {
  rect(0, 0, WIDTH, HEIGHT, "bg");
  for (let x = 124; x <= 274; x += 6) {
    for (let y = 13; y <= 83; y += 6) rect(x, y, 1, 1, "grid");
  }
  rect(7, 6, 274, 1, "frame");
  rect(7, 89, 274, 1, "frame");
  rect(7, 7, 1, 82, "frame");
  rect(280, 7, 1, 82, "frame");
  rect(10, 9, 4, 1, "frame");
  rect(10, 9, 1, 4, "frame");
  rect(274, 86, 4, 1, "frame");
  rect(277, 83, 1, 4, "frame");
  word("YAZUE", 23, 35, 3, "text");
  rect(23, 64, 17, 1, "appleShadow");
  rect(43, 64, 66, 1, "frame");
}

function drawNotebook({ rect, polygon, word }) {
  polygon([[117, 73], [127, 67], [256, 67], [266, 75], [259, 81], [131, 81]], "shadow");
  polygon([[131, 46], [168, 46], [179, 50], [190, 46], [229, 46], [239, 73], [231, 78],
    [191, 78], [179, 82], [167, 78], [124, 78], [120, 73]], "spine");
  polygon([[132, 47], [169, 47], [179, 52], [189, 47], [228, 47], [237, 73], [232, 76],
    [190, 76], [179, 80], [168, 76], [126, 76], [122, 73]], "cover");
  polygon([[133, 48], [168, 48], [179, 52], [190, 48], [227, 48], [235, 72],
    [191, 73], [179, 78], [167, 73], [124, 72]], "paperEdge");
  polygon([[133, 48], [168, 48], [179, 52], [190, 48], [227, 48], [232, 69],
    [190, 70], [179, 74], [168, 70], [126, 69]], "paper");
  rect(178, 53, 1, 18, "paperEdge");
  word("DEATH", 141, 51, 1, "spine");
  word("NOTE", 141, 60, 1, "spine");
  rect(187, 55, 30, 1, "rule");
  rect(186, 59, 34, 1, "rule");
  rect(185, 63, 30, 1, "rule");
  rect(184, 67, 24, 1, "rule");
  rect(181, 74, 8, 2, "appleShadow");
  rect(187, 75, 3, 6, "apple");
}

function drawRyuk({ rect, polygon }, hand, blink, biting) {
  polygon([[231, 43], [214, 35], [201, 22], [199, 37], [205, 46], [200, 45],
    [209, 55], [205, 54], [218, 66], [235, 65]], "outline");
  polygon([[230, 46], [217, 40], [203, 28], [203, 36], [213, 47], [206, 45],
    [219, 57], [214, 55], [224, 63], [233, 62]], "wing");
  polygon([[248, 41], [261, 30], [270, 20], [269, 34], [264, 44], [271, 40],
    [266, 52], [270, 48], [261, 61], [246, 68]], "outline");
  polygon([[248, 45], [259, 37], [267, 27], [266, 35], [257, 48], [266, 43],
    [258, 56], [264, 51], [255, 61], [245, 64]], "wing");
  polygon([[219, 48], [207, 36], [209, 42], [221, 54]], "feather");
  polygon([[256, 47], [264, 34], [263, 41], [254, 52]], "feather");
  polygon([[225, 50], [247, 49], [256, 58], [255, 77], [220, 77], [216, 67]], "outline");
  polygon([[227, 52], [245, 52], [251, 60], [250, 74], [223, 74], [219, 66]], "coat");
  polygon([[219, 55], [216, 50], [224, 53], [224, 48], [230, 53], [238, 56],
    [243, 52], [249, 48], [248, 53], [256, 49], [251, 57], [243, 60],
    [232, 61], [224, 58]], "ruff");
  rect(231, 62, 1, 9, "leather");
  rect(239, 61, 1, 10, "leather");
  rect(233, 66, 5, 1, "ruff");
  rect(234, 67, 3, 2, "ruff");

  // A lopsided fringe and a grin keep the sprite recognizable at phone size.
  polygon([[219, 38], [214, 28], [220, 29], [218, 19], [225, 24], [229, 14],
    [233, 21], [239, 12], [242, 20], [250, 15], [248, 25], [257, 23],
    [253, 31], [259, 33], [250, 40], [230, 42]], "outline");
  polygon([[220, 34], [218, 30], [224, 33], [222, 23], [228, 27], [230, 18],
    [233, 25], [238, 16], [240, 25], [246, 20], [244, 28], [252, 27],
    [248, 34], [254, 34], [248, 38], [229, 39]], "hair");
  polygon([[229, 28], [231, 22], [233, 29], [239, 21], [237, 30], [242, 28],
    [241, 33], [227, 34]], "hairLight");
  polygon([[220, 36], [226, 36], [231, 33], [246, 33], [252, 37], [253, 43],
    [249, 44], [246, 51], [240, 55], [232, 55], [225, 50], [224, 43],
    [220, 42]], "outline");
  polygon([[222, 37], [227, 38], [232, 35], [245, 35], [250, 38], [251, 41],
    [247, 42], [245, 49], [239, 53], [233, 53], [227, 48], [226, 42],
    [222, 40]], "face");
  polygon([[244, 37], [250, 38], [250, 41], [247, 42], [245, 49],
    [239, 53], [233, 53], [238, 50], [242, 46]], "faceShadow");
  rect(221, 42, 2, 4, "ruff");
  rect(221, 45, 3, 1, "eye");
  const eyeHeight = blink ? 1 : 4;
  rect(228, 39, 7, eyeHeight, "outline");
  rect(240, 38, 7, eyeHeight, "outline");
  if (!blink) {
    rect(229, 40, 4, 2, "eye");
    rect(241, 39, 4, 2, "eye");
    rect(230, 40, 1, 2, "outline");
    rect(242, 39, 1, 2, "outline");
  }
  rect(236, 42, 2, 2, "faceShadow");
  polygon([[229, 45], [235, 46], [244, 44], [241, biting ? 52 : 50], [234, 51]], "outline");
  rect(233, 46, 7, 2, "teeth");
  rect(235, 46, 1, 2, "ruff");
  rect(238, 46, 1, 2, "ruff");

  polygon([[222, 63], [226, 68], [219, 73], [hand.x, hand.y + 3],
    [hand.x + 3, hand.y], [222, 68]], "outline");
  rect(hand.x - 2, hand.y, 6, 4, "faceShadow");
  rect(hand.x - 1, hand.y, 4, 2, "face");
}

function drawApple({ rect, polygon }, x, y, bitten) {
  polygon([[x - 3, y - 4], [x, y - 3], [x + 3, y - 4], [x + 6, y - 1], [x + 5, y + 3],
    [x + 2, y + 5], [x, y + 4], [x - 2, y + 5], [x - 5, y + 2], [x - 6, y - 1]], "appleShadow");
  polygon([[x - 3, y - 3], [x, y - 2], [x + 3, y - 3], [x + 5, y - 1], [x + 4, y + 2],
    [x + 1, y + 3], [x - 2, y + 4], [x - 4, y + 1], [x - 5, y - 1]], "apple");
  rect(x - 3, y - 1, 2, 1, "appleLight");
  rect(x, y - 6, 1, 3, "spine");
  rect(x + 1, y - 7, 3, 2, "leaf");
  if (bitten) {
    rect(x + 2, y - 2, 3, 3, "paper");
    rect(x + 4, y - 1, 1, 1, "paperEdge");
  }
}

const motion = [
  [0.0, 134, 64, 0], [0.7, 134, 64, 0],
  [1.4, 173, 64, 26], [1.55, 173, 64, 0],
  [2.2, 185, 63, 16], [2.35, 185, 63, 0],
  [3.1, 214, 56, 17], [3.7, 226, 49, 0], [4.45, 226, 49, 0],
];

function appleAt(time) {
  const next = motion.findIndex(([at]) => at > time);
  if (next > 0) {
    const [start, x1, y1] = motion[next - 1];
    const [end, x2, y2, height] = motion[next];
    const fraction = (time - start) / (end - start);
    return {
      x: Math.round(x1 + (x2 - x1) * fraction),
      y: Math.round(y1 + (y2 - y1) * fraction - 4 * height * fraction * (1 - fraction)),
    };
  }
  if (time >= 5.25) {
    const fraction = Math.min(1, (time - 5.25) / 0.7);
    return { x: Math.round(134 - 13 * (1 - fraction)), y: Math.round(64 - 50 * (1 - fraction) ** 2) };
  }
  return null;
}

function drawFrame(colors, time) {
  const canvas = createCanvas(colors);
  const apple = appleAt(time);
  let hand = { x: 218, y: 69 };
  if (time > 2.6 && time < 3.1) {
    const reach = (time - 2.6) / 0.5;
    hand = { x: Math.round(218 - 4 * reach), y: Math.round(69 - 8 * reach) };
  }
  if (time >= 3.1 && apple && time < 4.45) hand = { x: apple.x, y: apple.y + 5 };
  if (time >= 4.45 && time < 4.85) {
    const release = (time - 4.45) / 0.4;
    hand = { x: Math.round(226 - 8 * release), y: Math.round(54 + 15 * release) };
  }
  drawBackdrop(canvas);
  drawNotebook(canvas);
  drawRyuk(canvas, hand, (time > 0.6 && time < 0.8) || (time > 4.65 && time < 4.85),
    time >= 3.9 && time < 4.15);
  if (apple) drawApple(canvas, apple.x, apple.y, time >= 4.15 && time < 4.45);
  if (time >= 4.15 && time < 4.45) {
    const drift = Math.round((time - 4.15) * 13);
    canvas.rect(221 - drift, 47 + drift, 2, 1, "appleLight");
    canvas.rect(218 - drift, 50 + drift, 1, 2, "apple");
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

async function render(name, colors, times) {
  const gif = GIFEncoder();
  for (const [index, time] of times.entries()) {
    const { pixels, palette } = drawFrame(colors, time);
    gif.writeFrame(upscale(pixels), WIDTH * SCALE, HEIGHT * SCALE, {
      ...(index === 0 ? { palette } : {}),
      delay: 100,
      repeat: times.length === 1 ? -1 : 0,
    });
  }
  gif.finish();
  await writeFile(new URL(`./assets/${name}.gif`, import.meta.url), gif.bytesView());
}

const timeline = Array.from({ length: 63 }, (_, index) => index / 10);
for (const [name, theme] of Object.entries(themes)) {
  const colors = { ...theme, ...spriteColors };
  await render(`ryuk-${name}`, colors, timeline);
  await render(`ryuk-${name}-still`, colors, [3.4]);
}
