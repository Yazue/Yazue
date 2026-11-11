function drawWings({ polygon }, stretch) {
  const leftWing = 287 - stretch;
  const rightWing = 372 + stretch;
  polygon([[327, 78], [310, 58], [leftWing, 34], [leftWing + 2, 53], [leftWing + 9, 65],
    [leftWing + 1, 60], [leftWing + 9, 78], [leftWing + 6, 76], [leftWing + 18, 91],
    [315, 98], [333, 89]], "outline");
  polygon([[324, 79], [308, 62], [leftWing + 4, 43], [leftWing + 6, 56],
    [leftWing + 17, 73], [leftWing + 7, 67], [leftWing + 17, 83],
    [leftWing + 12, 80], [leftWing + 22, 90], [315, 94], [329, 88]], "wing");
  polygon([[leftWing + 5, 47], [306, 65], [319, 84], [314, 83], [304, 71]], "feather");
  polygon([[leftWing + 8, 68], [306, 80], [311, 89], [306, 86]], "feather");

  polygon([[346, 79], [354, 55], [rightWing, 28], [rightWing, 47], [rightWing - 7, 61],
    [rightWing + 2, 55], [rightWing - 3, 73], [rightWing + 1, 70], [rightWing - 10, 88],
    [355, 98], [345, 95]], "outline");
  polygon([[350, 79], [358, 55], [rightWing - 3, 37], [rightWing - 4, 49],
    [rightWing - 15, 70], [rightWing - 2, 62], [rightWing - 11, 79], [rightWing - 4, 75],
    [rightWing - 15, 89], [354, 94], [347, 91]], "wing");
  polygon([[rightWing - 4, 41], [359, 60], [351, 83], [355, 82], [362, 66]], "feather");
  polygon([[rightWing - 5, 66], [361, 76], [356, 89], [362, 85]], "feather");
}

function drawCoat({ rect, polygon }, shift) {
  const left = 314 + shift;
  polygon([[left, 90], [left + 5, 80], [331, 73], [347, 73], [358, 80],
    [362, 92], [363, 112], [316, 112]], "outline");
  polygon([[left + 3, 91], [left + 8, 81], [332, 76], [346, 76], [355, 82],
    [359, 93], [360, 110], [319, 110]], "coat");
  polygon([[343, 80], [350, 82], [348, 101], [355, 108], [341, 108]], "outline");
  polygon([[323, 89], [328, 86], [330, 106], [326, 109]], "leather");
  polygon([[354, 86], [357, 91], [358, 106], [354, 103]], "leather");
  polygon([[left + 2, 85], [left + 5, 75], [left + 8, 77], [left + 9, 71],
    [left + 15, 76], [left + 17, 70], [left + 21, 77], [339, 82],
    [347, 78], [350, 71], [352, 77], [358, 72], [357, 80], [363, 77],
    [357, 87], [344, 90], [328, 90], [321, 88]], "ruff");
  polygon([[left + 8, 80], [left + 15, 79], [335, 85], [344, 85], [354, 81],
    [347, 87], [330, 87]], "feather");
  rect(335, 93, 2, 16, "leather");
  rect(337, 95, 3, 1, "ruff");
  rect(337, 99, 3, 1, "ruff");
  rect(337, 103, 3, 1, "ruff");
  rect(343, 99, 7, 3, "leather");
  rect(345, 100, 3, 1, "teeth");
}

function drawHead(canvas, x, y, blink, biting, handX) {
  const shape = (vertices, color) => canvas.polygon(vertices.map(([dx, dy]) => [x + dx, y + dy]), color);
  const patch = (dx, dy, width, height, color) => canvas.rect(x + dx, y + dy, width, height, color);

  shape([[-18, 7], [-23, -9], [-16, -6], [-20, -19], [-10, -14], [-10, -25],
    [-4, -18], [0, -29], [4, -21], [11, -27], [9, -16], [20, -22],
    [16, -12], [23, -14], [19, -3], [24, -4], [19, 7], [6, 11]], "outline");
  shape([[-17, 4], [-19, -5], [-12, -3], [-16, -15], [-7, -10], [-7, -19],
    [-2, -14], [0, -23], [4, -17], [7, -21], [6, -12], [15, -18],
    [12, -8], [19, -11], [15, 0], [20, -1], [16, 6], [6, 8]], "hair");
  shape([[-13, -1], [-12, -12], [-8, -4], [-3, -9], [-2, -16], [1, -8],
    [8, -15], [5, -5], [11, -8], [10, 0], [1, 3]], "hairLight");
  shape([[-19, 1], [-12, 0], [-6, -3], [12, -3], [20, 2], [21, 10],
    [16, 12], [13, 21], [7, 26], [-3, 27], [-11, 22], [-16, 16], [-17, 11], [-21, 8]], "outline");
  shape([[-17, 3], [-12, 2], [-6, 0], [11, 0], [18, 4], [19, 8], [14, 10],
    [12, 19], [6, 24], [-2, 25], [-10, 20], [-14, 15], [-15, 9], [-18, 7]], "face");
  shape([[11, 0], [18, 4], [18, 8], [14, 10], [12, 19], [6, 24],
    [-2, 25], [1, 22], [7, 18], [10, 13], [8, 8]], "faceShadow");
  patch(-17, 9, 2, 6, "ruff");
  patch(-17, 15, 3, 2, "eye");
  patch(-9, 4, 8, blink ? 2 : 6, "outline");
  patch(4, 3, 9, blink ? 2 : 6, "outline");
  if (!blink) {
    const pupilShift = handX < x - 10 ? -1 : 0;
    patch(-8, 5, 6, 3, "eye");
    patch(5, 4, 7, 3, "eye");
    patch(-5 + pupilShift, 5, 2, 3, "outline");
    patch(8 + pupilShift, 4, 2, 3, "outline");
  }
  patch(-1, 10, 2, 2, "faceShadow");
  patch(-11, 11, 3, 1, "faceShadow");
  shape([[-12, 13], [-5, 15], [4, 14], [12, 11], [10, biting ? 22 : 19],
    [5, biting ? 24 : 21], [-3, biting ? 24 : 21], [-9, 18]], "outline");
  patch(-8, 15, 4, 2, "teeth");
  patch(-3, 16, 8, 2, "teeth");
  patch(6, 14, 3, 2, "teeth");
  patch(0, 16, 1, 2, "ruff");
  patch(3, 16, 1, 2, "ruff");
  if (biting) patch(-4, 21, 8, 1, "teeth");
}

function drawArm({ rect, polygon }, hand, shift, biting) {
  const x = Math.round(hand.x);
  const y = Math.round(hand.y);
  const shoulderX = 320 + shift;
  const elbowX = Math.round((x + shoulderX) / 2 + 3);
  const elbowY = Math.round((y + 88) / 2 + 7);
  polygon([[shoulderX, 83], [shoulderX + 6, 89], [elbowX + 4, elbowY + 4],
    [x + 1, y + 5], [x - 4, y + 1], [elbowX - 3, elbowY], [shoulderX - 4, 91]], "outline");
  polygon([[shoulderX, 85], [shoulderX + 3, 89], [elbowX + 2, elbowY + 2],
    [x, y + 3], [x - 2, y + 1], [elbowX - 2, elbowY], [shoulderX - 2, 90]], "coat");
  rect(elbowX - 2, elbowY + 1, 4, 1, "leather");
  polygon([[x + 2, y + 1], [x + 1, y + 5], [x - 5, y + 4], [x - 6, y + 1],
    [x - 4, y - 1], [x - 2, y + 1]], "faceShadow");
  rect(x - 5, y + 1, 6, 2, "face");
  if (biting) {
    rect(x - 3, y - 2, 2, 3, "face");
    rect(x + 1, y - 1, 2, 3, "faceShadow");
  } else {
    rect(x - 8, y, 3, 2, "face");
    rect(x - 6, y - 2, 2, 2, "faceShadow");
  }
}

export function drawRyuk(canvas, { hand, blink = false, biting = false, lean = 0 }) {
  const reach = Math.max(0, Math.min(1, lean));
  drawWings(canvas, Math.round(reach * 3));
  drawCoat(canvas, Math.round(-reach * 4));
  drawHead(canvas, 336 - Math.round(reach * 6), 49 + Math.round(reach * 2), blink, biting, hand.x);
  drawArm(canvas, hand, Math.round(-reach * 4), biting);
}
