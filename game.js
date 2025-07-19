const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let frame = 0;
let gameSpeed = 5;

const bgImage = new Image();
bgImage.src = "assets/background.png";

let bgX = 0;
function drawBackground() {
  bgX -= gameSpeed;
  if (bgX <= -canvas.width) bgX = 0;
  ctx.drawImage(bgImage, bgX, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImage, bgX + canvas.width, 0, canvas.width, canvas.height);
}

// 캐릭터 로드
const runImages = [
  new Image(),
  new Image()
];
runImages[0].src = "assets/1000000953.png";
runImages[1].src = "assets/1000001189.png";

const jumpImage = new Image();
jumpImage.src = "assets/1000001137.png";

const slideImage = new Image();
slideImage.src = "assets/1000001188.png";

// 캐릭터 위치
let nyangja = {
  x: 100,
  y: canvas.height - 200,
  width: 100,
  height: 100,
  vy: 0,
  gravity: 1,
  jumping: false,
  sliding: false,
  runFrame: 0
};

function drawNyangja() {
  let image;

  if (nyangja.sliding) {
    image = slideImage;
    nyangja.height = 60;
  } else if (nyangja.jumping) {
    image = jumpImage;
    nyangja.height = 100;
  } else {
    image = runImages[Math.floor(frame / 10) % 2];
    nyangja.height = 100;
  }

  ctx.drawImage(image, nyangja.x, nyangja.y, nyangja.width, nyangja.height);
}

function updateNyangja() {
  if (nyangja.jumping) {
    nyangja.vy += nyangja.gravity;
    nyangja.y += nyangja.vy;
    if (nyangja.y >= canvas.height - 200) {
      nyangja.y = canvas.height - 200;
      nyangja.vy = 0;
      nyangja.jumping = false;
    }
  }
}

// 점프
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !nyangja.jumping) {
    nyangja.jumping = true;
    nyangja.vy = -18;
  }
  if (e.code === "ArrowDown") {
    nyangja.sliding = true;
  }
});
window.addEventListener("keyup", (e) => {
  if (e.code === "ArrowDown") {
    nyangja.sliding = false;
  }
});

// 모바일 터치 지원
window.addEventListener("touchstart", (e) => {
  if (!nyangja.jumping) {
    nyangja.jumping = true;
    nyangja.vy = -18;
  }
});
window.addEventListener("touchend", () => {
  nyangja.sliding = false;
});

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawNyangja();
  updateNyangja();

  frame++;
  requestAnimationFrame(animate);
}

bgImage.onload = () => {
  animate();
};
