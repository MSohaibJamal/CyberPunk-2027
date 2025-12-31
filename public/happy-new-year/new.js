const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function random(min, max) {
  return Math.random() * (max - min) + min;
}

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = random(-5, 5);
    this.vy = random(-5, 5);
    this.life = 100;
    this.color = color;
  }

  update() {
    this.vy += 0.05;
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

let particles = [];

function explode(x, y) {
  const color = `hsl(${random(0, 360)}, 100%, 50%)`;
  for (let i = 0; i < 80; i++) {
    particles.push(new Particle(x, y, color));
  }
}

function fireworksLoop() {
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (Math.random() < 0.05) {
    explode(
      random(100, canvas.width - 100),
      random(100, canvas.height / 2)
    );
  }

  particles.forEach((p, i) => {
    p.update();
    p.draw();
    if (p.life <= 0) particles.splice(i, 1);
  });

  requestAnimationFrame(fireworksLoop);
}
fireworksLoop();

const text = "🎉 Happy New Year 🎉";
const typingEl = document.getElementById("typing");
let index = 0;

function typeText() {
  if (index < text.length) {
    typingEl.textContent += text.charAt(index);
    index++;
    setTimeout(typeText, 120);
  }
}
typeText();

const yearEl = document.getElementById("year");
const targetYear = new Date().getFullYear() + 1;
yearEl.textContent = targetYear;

const countdownEl = document.getElementById("countdown");
const newYearTime = new Date(
  `January 1, ${targetYear} 00:00:00`
).getTime();

setInterval(() => {
  const now = Date.now();
  const diff = newYearTime - now;

  if (diff <= 0) {
    countdownEl.textContent = "🎆 Welcome to the New Year! 🎆";
    explode(canvas.width / 2, canvas.height / 2);
    return;
  }

  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);

  countdownEl.textContent = `${h}h ${m}m ${s}s remaining`;
}, 1000);
