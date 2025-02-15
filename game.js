const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const restartButton = document.getElementById('restartButton');

let score = 0, gameTime = 60, gameOver = false;
let objects = [], particles = [];
const ACCEL = 2, FRICTION = 0.85, MAX_SPEED = 10;
let leftPressed = false, rightPressed = false;
const player = { x: canvas.width/2 - 15, y: canvas.height - 60, width: 30, height: 30, vx: 0 };

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') leftPressed = true;
  else if (e.key === 'ArrowRight') rightPressed = true;
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') leftPressed = false;
  else if (e.key === 'ArrowRight') rightPressed = false;
});

function spawnObject() {
  if (gameOver) return;
  let obj = {};
  const r = Math.random();
  if (r < 0.6) {
    if (Math.random() < 0.7) {
      obj.type = 'heart';
      obj.color = 'red';
      obj.points = 10;
    } else {
      obj.type = 'chocolate';
      obj.color = 'saddlebrown';
      obj.points = 20;
    }
  } else {
    obj.type = 'arrow';
    obj.color = 'black';
  }
  obj.x = Math.random() * (canvas.width - 20);
  obj.y = -20;
  obj.width = 20;
  obj.height = 20;
  obj.vy = 2 + Math.random() * 2;
  obj.gravity = 0.05;
  objects.push(obj);
}

function checkCollision(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
         a.y < b.y + b.height && a.y + a.height > b.y;
}

function drawHeart(cx, cy, width, height, color) {
  ctx.save();
  ctx.beginPath();
  const topCurve = height * 0.3;
  ctx.moveTo(cx, cy + topCurve);
  ctx.bezierCurveTo(cx, cy - height/2, cx - width/2, cy - height/2, cx - width/2, cy + topCurve);
  ctx.bezierCurveTo(cx - width/2, cy + (height+topCurve)/2, cx, cy + (height+topCurve)/2, cx, cy + height);
  ctx.bezierCurveTo(cx, cy + (height+topCurve)/2, cx + width/2, cy + (height+topCurve)/2, cx + width/2, cy + topCurve);
  ctx.bezierCurveTo(cx + width/2, cy - height/2, cx, cy - height/2, cx, cy + topCurve);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawIngot(cx, cy, width, height, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.1);
  ctx.beginPath();
  const hw = width/2, hh = height/2, notch = hh * 0.3;
  ctx.moveTo(-hw, -hh + notch);
  ctx.lineTo(-hw, -hh);
  ctx.lineTo(hw, -hh);
  ctx.lineTo(hw, -hh + notch);
  ctx.lineTo(hw, hh);
  ctx.lineTo(-hw, hh);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function spawnSpark(x, y, w, h, vx, vy, life) {
  particles.push({ x, y, width: w, height: h, vx, vy, life });
}

function emitSparks(sizeFactor, corner, count) {
  const cornerX = corner === 'left' ? player.x : player.x + player.width;
  const cornerY = player.y + player.height;
  for (let i = 0; i < count; i++) {
    const w = Math.max(2, 2 + Math.random() * sizeFactor);
    const h = Math.max(2, 2 + Math.random() * sizeFactor);
    const sparkVX = (Math.random() - 0.5) * 1;
    const sparkVY = -1 - Math.random();
    const life = 15 + Math.floor(Math.random() * 10);
    spawnSpark(cornerX, cornerY, w, h, sparkVX, sparkVY, life);
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  ctx.fillStyle = 'yellow';
  particles.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));
}

let oldVX = 0;
function handleSparks() {
  const decel = Math.abs(oldVX - player.vx);
  const threshold = 0.2;
  if (rightPressed) {
    emitSparks(Math.max(1, decel * 5), 'left', 3 + Math.floor(Math.random() * 2));
  } else if (oldVX > 0 && !rightPressed && decel > threshold) {
    emitSparks(Math.max(1, decel * 2), 'right', 1 + Math.floor(Math.random() * 2));
  }
  if (leftPressed) {
    emitSparks(Math.max(1, decel * 5), 'left', 3 + Math.floor(Math.random() * 2));
  } else if (oldVX < 0 && !leftPressed && decel > threshold) {
    emitSparks(Math.max(1, decel * 2), 'right', 1 + Math.floor(Math.random() * 2));
  }
}

function update() {
  if (gameOver) return;
  oldVX = player.vx;
  if (leftPressed) player.vx -= ACCEL;
  if (rightPressed) player.vx += ACCEL;
  player.vx *= FRICTION;
  if (player.vx > MAX_SPEED) player.vx = MAX_SPEED;
  if (player.vx < -MAX_SPEED) player.vx = -MAX_SPEED;
  player.x += player.vx;
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
  handleSparks();
  for (let i = objects.length - 1; i >= 0; i--) {
    let obj = objects[i];
    obj.vy += obj.gravity;
    obj.y += obj.vy;
    if (obj.y > canvas.height) { objects.splice(i, 1); continue; }
    if (checkCollision(player, obj)) {
      if (obj.type === 'arrow') { 
        gameOver = true; 
        restartButton.style.display = 'block'; 
      } else { 
        score += obj.points; 
      }
      objects.splice(i, 1);
    }
  }
  updateParticles();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'pink';
  ctx.fillRect(player.x, player.y, player.width, player.height);
  objects.forEach(obj => {
    if (obj.type === 'arrow') {
      ctx.fillStyle = obj.color;
      ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    } else if (obj.type === 'heart') {
      drawHeart(obj.x + obj.width/2, obj.y + obj.height/2, obj.width, obj.height, obj.color);
    } else if (obj.type === 'chocolate') {
      drawIngot(obj.x + obj.width/2, obj.y + obj.height/2, obj.width, obj.height, obj.color);
    }
  });
  drawParticles();
  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';
  ctx.fillText('Score: ' + score, 10, 25);
  ctx.fillText('Time: ' + Math.ceil(gameTime), 10, 50);
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText('Game Over!', canvas.width/2 - 80, canvas.height/2 - 20);
    ctx.font = '24px Arial';
    ctx.fillText('Final Score: ' + score, canvas.width/2 - 80, canvas.height/2 + 20);
  }
}

function gameLoop() {
  if (!gameOver) {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  } else {
    draw();
  }
}

function resetGame() {
  score = 0;
  gameTime = 60;
  gameOver = false;
  objects = [];
  particles = [];
  player.x = canvas.width/2 - player.width/2;
  player.vx = 0;
  leftPressed = false;
  rightPressed = false;
  restartButton.style.display = 'none';
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
setInterval(() => { if (!gameOver) spawnObject(); }, 1000);
setInterval(() => {
  if (!gameOver) {
    gameTime--;
    if (gameTime <= 0) { gameOver = true; restartButton.style.display = 'block'; }
  }
}, 1000);
restartButton.addEventListener('click', resetGame);
