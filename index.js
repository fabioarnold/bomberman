const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const img_level = document.querySelector("img#level");
const img_bomberman = document.querySelector("img#bomberman");
const img_wall = document.querySelector("img#wall");
const img_bomb = document.querySelector("img#bomb");
const img_explosion = document.querySelector("img#explosion");

let keys = {};
document.onkeydown = (e) => (keys[e.keyCode] = true);
document.onkeyup = (e) => (keys[e.keyCode] = false);

let bombs = [];
let explosions = [];

let walls = [
  { x: 48, y: 32 },
  { x: 96, y: 80 },
  { x: 112, y: 80 },
  { x: 128, y: 80 },
];

let colliders = [];
for (let row = 0; row < 5; row++) {
  for (let col = 0; col < 6; col++) {
    colliders.push({
      x: 32 + 32 * col,
      y: 32 + 32 * row,
      w: 16,
      h: 16,
    });
  }
}
colliders.push({ x: 16, y: 0, w: 208, h: 16 });
colliders.push({ x: 224, y: 16, w: 16, h: 176 });
colliders.push({ x: 16, y: 192, w: 208, h: 16 });
colliders.push({ x: 0, y: 16, w: 16, h: 176 });

let player_x = 16;
let player_y = 16;
let player_dir = 3;
let player_idle = true;

function drawPlayer() {
  const frame = Math.round(performance.now() / 60);

  const frames_ns = [1, 2, 3, 2, 1];
  const frames_ew = [1, 2, 3, 2, 1, 4, 5, 6, 5, 4];

  let sx = 0;
  let sy = 0;
  let flip = false;
  if (player_dir === 0) {
    sy = 24;
    flip = true;
  } else if (player_dir === 1) {
    sy = 48;
  } else if (player_dir === 2) {
    sy = 24;
  } else if (player_dir === 3) {
    sy = 0;
  }
  if (player_idle) {
    sx = 0;
  } else {
    if (player_dir === 1 || player_dir === 3) {
      sx = frames_ns[frame % frames_ns.length] * 16;
      flip = frame % 10 < 5;
    } else if (player_dir === 0 || player_dir === 2) {
      sx = frames_ew[frame % frames_ew.length] * 16;
      flip = player_dir === 0;
    }
  }

  ctx.save();
  ctx.translate(player_x, player_y);
  if (flip) {
    ctx.translate(16, 0);
    ctx.scale(-1, 1);
  }
  // fix off by one in sprite sheet
  if (player_dir === 0 || player_dir === 2) {
    if (sx !== 48 && sx !== 96) {
      ctx.translate(-1, 0);
    }
  }

  ctx.drawImage(img_bomberman, sx, sy, 16, 24, 0, -8, 16, 24);

  ctx.restore();
}

function updateBombs() {
  for (let i = 0; i < bombs.length; i++) {
    const bomb = bombs[i];
    if (performance.now() - bomb.t > 2000) {
      addExplosion(bomb.x, bomb.y, 2);
      bombs.splice(i, 1);
      i--;
    }
  }
}

function drawBombs() {
  updateBombs();
  const frames = [0, 1, 2, 1];
  for (const bomb of bombs) {
    let frame = Math.round((performance.now() - bomb.t) / 60);
    frame = frames[frame % frames.length];
    ctx.drawImage(img_bomb, frame * 16, 0, 16, 16, bomb.x, bomb.y, 16, 16);
  }
}

function drawWalls() {
  for (const wall of walls) {
    ctx.drawImage(img_wall, 0, 0, 16, 16, wall.x, wall.y, 16, 16);
  }
}

function addExplosion(x, y, len) {
  const t = performance.now();
  addExplosionTile({ x, y, sx: 0, rot: 0, t });
  for (let rot = 0; rot < 4; rot++) {
    const dx = Math.sin((rot * Math.PI) / 2);
    const dy = -Math.cos((rot * Math.PI) / 2);
    for (let i = 1; i <= len; i++) {
      const e = { x: x + dx * i * 16, y: y + dy * i * 16, sx: 16, rot, t };
      let ok = addExplosionTile(e);
      if (!ok || i === len) {
        e.sx = 32;
        break;
      }
    }
  }
}

function addExplosionTile(e) {
  const check = { x: e.x, y: e.y, w: 1, h: 1 };
  for (let collider of colliders) {
    if (rectsOverlap(check, collider)) return false;
  }
  for (let i = 0; i < walls.length; i++) {
    const wall = walls[i];
    const wall_rect = { ...wall, w: 16, h: 16 };
    if (rectsOverlap(check, wall_rect)) {
      walls.splice(i, 1);
      explosions.push(e);
      return false;
    }
  }
  explosions.push(e);
  return true;
}

function updateExplosions() {
  for (let i = 0; i < explosions.length; i++) {
    const explosion = explosions[i];
    if (performance.now() - explosion.t > 500) {
      explosions.splice(i, 1);
      i--;
    }
  }
}

function drawExplosions() {
  updateExplosions();
  const frames = [0, 1, 2, 3, 4, 3, 2, 1, 0];
  for (let e of explosions) {
    ctx.save();
    ctx.translate(e.x + 8, e.y + 8);
    ctx.rotate((e.rot * Math.PI) / 2);
    let frame = Math.round((performance.now() - e.t) / 60);
    frame = frames[frame % frames.length];
    ctx.drawImage(img_explosion, e.sx, frame * 16, 16, 16, -8, -8, 16, 16);
    ctx.restore();
  }
}

function drawExplosion() {
  const x = 80;
  const y = 112;
  const frames = [0, 1, 2, 3, 4, 3, 2, 1, 0];
  const frame = frames[Math.round(performance.now() / 60) % frames.length];
  ctx.save();
  ctx.translate(x + 8, y + 8);
  ctx.drawImage(img_explosion, 0, frame * 16, 16, 16, -8, -8, 16, 16);
  for (let i = 0; i < 4; i++) {
    ctx.drawImage(img_explosion, 16, frame * 16, 16, 16, -8, -24, 16, 16);
    ctx.drawImage(img_explosion, 32, frame * 16, 16, 16, -8, -40, 16, 16);
    ctx.rotate(Math.PI / 2);
  }
  ctx.restore();
}

function rectsOverlap(r0, r1) {
  if (r0.x >= r1.x + r1.w) return false;
  if (r0.y >= r1.y + r1.h) return false;
  if (r1.x >= r0.x + r0.w) return false;
  if (r1.y >= r0.y + r0.h) return false;
  return true;
}

function check(x, y) {
  const check = { x: x, y: y, w: 1, h: 1 };
  for (let collider of colliders) {
    if (rectsOverlap(check, collider)) return true;
  }
  for (let wall of walls) {
    const wall_rect = { ...wall, w: 16, h: 16 };
    if (rectsOverlap(check, wall_rect)) return true;
  }
  return false;
}

function moveX(move) {
  if (move === 0) return false;
  const player_r = { x: player_x + move, y: player_y, w: 16, h: 16 };
  for (let r of colliders) {
    if (rectsOverlap(player_r, r)) return false;
  }
  for (let wall of walls) {
    const wall_rect = { ...wall, w: 16, h: 16 };
    if (rectsOverlap(player_r, wall_rect)) return false;
  }
  player_x += move;
  return true;
}

function moveY(move) {
  if (move === 0) return false;
  const player_r = { x: player_x, y: player_y + move, w: 16, h: 16 };
  for (let r of colliders) {
    if (rectsOverlap(player_r, r)) return false;
  }
  for (let wall of walls) {
    const wall_rect = { ...wall, w: 16, h: 16 };
    if (rectsOverlap(player_r, wall_rect)) return false;
  }
  player_y += move;
  return true;
}

function placeBomb() {
  const x = Math.round(player_x / 16) * 16;
  const y = Math.round(player_y / 16) * 16;
  for (const bomb of bombs) {
    if (bomb.x === x && bomb.y === y) return;
  }
  bombs.push({ x, y, t: performance.now() });
}

let old_space = false;

function draw() {
  let dir_x = 0;
  let dir_y = 0;
  if (keys[32] && !old_space) placeBomb();
  old_space = keys[32];
  if (keys[37]) dir_x -= 1;
  if (keys[38]) dir_y -= 1;
  if (keys[39]) dir_x += 1;
  if (keys[40]) dir_y += 1;
  player_idle = dir_x === 0 && dir_y === 0;
  if (dir_x !== 0) {
    const x = player_x + (dir_x === 1 ? 16 : -1);
    const feel0 = check(x, player_y);
    const feel1 = check(x, player_y + 15);
    if (feel0 !== feel1) {
      if (feel0 && player_dir !== 1) dir_y = 1;
      if (feel1 && player_dir !== 3) dir_y = -1;
    }
  }
  if (dir_y !== 0) {
    const y = player_y + (dir_y === 1 ? 16 : -1);
    const feel0 = check(player_x, y);
    const feel1 = check(player_x + 15, y);
    if (feel0 !== feel1) {
      if (feel0 && player_dir !== 0) dir_x = 1;
      if (feel1 && player_dir !== 2) dir_x = -1;
    }
  }
  const moved_x = moveX(dir_x);
  if (dir_x < 0) player_dir = 0;
  if (dir_x > 0) player_dir = 2;
  moveY(dir_y);
  if (!moved_x) {
    if (dir_y < 0) player_dir = 1;
    if (dir_y > 0) player_dir = 3;
  }

  ctx.resetTransform();
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, 240, 16); // UI
  ctx.translate(0, 16);
  ctx.drawImage(img_level, 0, 0);

  if (false) {
    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
    ctx.fillRect(player_x, player_y, 16, 16);
    ctx.fillStyle = "rgba(0, 0, 255, 0.5)";
    for (let r of colliders) {
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
  }

  drawBombs();
  drawWalls();
  drawExplosions();
  drawPlayer();

  window.requestAnimationFrame(draw);
}

window.requestAnimationFrame(draw);
