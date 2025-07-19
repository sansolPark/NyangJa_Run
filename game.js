const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const runImages = [new Image(), new Image()];
runImages[0].src = "assets/run1.png";
runImages[1].src = "assets/run2.png";

const jumpImage = new Image();
jumpImage.src = "assets/jump.png";

const slideImage = new Image();
slideImage.src = "assets/slide.png";

const bgImage = new Image();
bgImage.src = "assets/background.png";

// 위치 설정
let catX = 50;
let catY = canvas.height - 120; // 바닥 기준 위치로 조정
let catWidth = 80;
let catHeight = 80;

let runFrame = 0;
let isJumping = false;
let isSliding = false;
let jumpVelocity = 0;

let bgX = 0;

// 키보드 입력
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !isJumping) {
    isJumping = true;
    jumpVelocity = -12;
  } else if (e.code === "ArrowDown" && !isJumping) {
    isSliding = true;
    setTimeout(() => (isSliding = false), 500);
  }
});

// 게임 로직
function update() {
  if (isJumping) {
    catY += jumpVelocity;
    jumpVelocity += 0.5;

    if (catY >= canvas.height - 120) {
      catY = canvas.height - 120;
      isJumping = false;
    }
  }

  bgX -= 2;
  if (bgX <= -canvas.width) {
    bgX = 0;
  }
}

// 배경 그리기
function drawBackground() {
  ctx.drawImage(bgImage, bgX, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImage, bgX + canvas.width, 0, canvas.width, canvas.height);
}

// 캐릭터 그리기
function drawCat() {
  if (isJumping) {
    ctx.drawImage(jumpImage, catX, catY, catWidth, catHeight);
  } else if (isSliding) {
    // 납작하게 하지 않고 Y좌표만 살짝 아래로
    ctx.drawImage(slideImage, catX, catY + 20, catWidth, catHeight);
  } else {
    ctx.drawImage(runImages[runFrame], catX, catY, catWidth, catHeight);
  }
}

// 메인 루프
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawCat();
  update();

  if (!isJumping && !isSliding) {
    runFrame = (runFrame + 1) % runImages.length;
  }

  requestAnimationFrame(gameLoop);
}

// 시작
bgImage.onload = () => {
  gameLoop();
};
