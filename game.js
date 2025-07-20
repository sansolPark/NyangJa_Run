const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let catImages = {
    run: [new Image(), new Image()],
    jump: new Image(),
    slide: new Image()
};

catImages.run[0].src = "assets/1000001188.png";
catImages.run[1].src = "assets/1000001189.png";
catImages.jump.src = "assets/1000000953.png";
catImages.slide.src = "assets/1000001137.png";

let background = new Image();
background.src = "assets/background.png";

let bgX = 0;
let bgSpeed = 2;

let cat = {
    x: 100,
    y: canvas.height - 250, // 🟢 바닥에 맞게 수정
    width: 120,
    height: 120,
    vy: 0,
    gravity: 1,
    jumping: false,
    sliding: false,
    jumpCount: 0,
    frame: 0,
    frameDelay: 0
};

document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && cat.jumpCount < 2 && !cat.sliding) {
        cat.vy = -20;
        cat.jumping = true;
        cat.jumpCount++;
    }
    if (e.code === "ArrowDown" && !cat.jumping) {
        cat.sliding = true;
    }
});

document.addEventListener("keyup", (e) => {
    if (e.code === "ArrowDown") {
        cat.sliding = false;
    }
});

function update() {
    // 배경 이동
    bgX -= bgSpeed;
    if (bgX <= -canvas.width) {
        bgX = 0;
    }

    // 중력 적용
    if (cat.jumping) {
        cat.y += cat.vy;
        cat.vy += cat.gravity;

        if (cat.y >= canvas.height - 250) {
            cat.y = canvas.height - 250;
            cat.jumping = false;
            cat.vy = 0;
            cat.jumpCount = 0;
        }
    }

    // 프레임 애니메이션
    cat.frameDelay++;
    if (cat.frameDelay > 10) {
        cat.frame = (cat.frame + 1) % 2;
        cat.frameDelay = 0;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 배경 그리기 (두 장으로 이어서)
    ctx.drawImage(background, bgX, 0, canvas.width, canvas.height);
    ctx.drawImage(background, bgX + canvas.width, 0, canvas.width, canvas.height);

    // 고양이 그리기
    let drawY = cat.y;
    if (cat.sliding) {
        drawY = cat.y + 30; // 🟢 슬라이딩 시 위치만 아래로 (이미지는 그대로)
        ctx.drawImage(catImages.slide, cat.x, drawY, cat.width, cat.height);
    } else if (cat.jumping) {
        ctx.drawImage(catImages.jump, cat.x, cat.y, cat.width, cat.height);
    } else {
        ctx.drawImage(catImages.run[cat.frame], cat.x, cat.y, cat.width, cat.height);
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
