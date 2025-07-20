const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = Math.max(window.innerWidth, window.innerHeight);
canvas.height = Math.min(window.innerWidth, window.innerHeight);

// 화면 크기 변경 시 캔버스 및 고양이 위치 조정
window.addEventListener('resize', () => {
    canvas.width = Math.max(window.innerWidth, window.innerHeight);
    canvas.height = Math.min(window.innerWidth, window.innerHeight);
    // 고양이의 초기 Y 위치를 새로운 캔버스 높이에 맞춰 재조정
    cat.y = canvas.height - 250; // 기존 바닥 레벨 유지
});

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

let gameOver = false;
let obstacles = [];
let obstacleImage = new Image();
obstacleImage.src = "assets/obstacle.png"; // Placeholder, user needs to provide this
obstacleImage.onload = imageLoadHandler;

let gameSpeed = 5; // Initial game speed

// 모든 이미지가 로드될 때까지 기다립니다.
let imagesLoaded = 0;
const totalImages = Object.keys(catImages).length + catImages.run.length + 1 + 1; // catImages의 각 이미지 + background + obstacleImage

function imageLoadHandler() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        console.log("All images loaded. Starting game loop.");
        loop(); // 모든 이미지가 로드되면 게임 루프 시작
    }
}

// 고양이 이미지 로드 이벤트 리스너
for (let key in catImages) {
    if (Array.isArray(catImages[key])) {
        catImages[key].forEach(img => {
            img.onload = imageLoadHandler;
            img.onerror = () => console.error(`Failed to load image: ${img.src}`);
        });
    } else {
        catImages[key].onload = imageLoadHandler;
        catImages[key].onerror = () => console.error(`Failed to load image: ${catImages[key].src}`);
    }
}

// 배경 이미지 로드 이벤트 리스너
background.onload = imageLoadHandler;
background.onerror = () => console.error(`Failed to load image: ${background.src}`);

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

function createObstacle() {
    const obstacleWidth = 50;
    const obstacleHeight = 100;
    const obstacleX = canvas.width;
    const obstacleY = canvas.height - obstacleHeight - 130; // Adjust based on ground level
    obstacles.push({
        x: obstacleX,
        y: obstacleY,
        width: obstacleWidth,
        height: obstacleHeight
    });
}

let obstacleInterval = setInterval(createObstacle, 2000); // Generate new obstacle every 2 seconds

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

document.addEventListener("touchstart", (e) => {
    // Prevent default touch behavior like scrolling
    e.preventDefault();

    if (gameOver) {
        // Reset game state
        gameOver = false;
        obstacles = [];
        cat.x = 100;
        cat.y = canvas.height - 250;
        cat.vy = 0;
        cat.jumping = false;
        cat.sliding = false;
        cat.jumpCount = 0;
        bgX = 0;
        // Restart obstacle generation
        clearInterval(obstacleInterval);
        obstacleInterval = setInterval(createObstacle, 2000);
        return; // Exit to prevent immediate jump after restart
    }

    // Trigger jump if not already jumping or sliding, and jump count allows
    if (cat.jumpCount < 2 && !cat.sliding) {
        cat.vy = -20;
        cat.jumping = true;
        cat.jumpCount++;
    }
});

document.addEventListener("keyup", (e) => {
    if (e.code === "ArrowDown") {
        cat.sliding = false;
    }
});

function update() {
    if (gameOver) return; // Stop updates if game is over

    // 배경 이동
    bgX -= gameSpeed;
    if (bgX <= -canvas.width) {
        bgX = 0;
    }

    // 장애물 이동 및 충돌 감지
    obstacles.forEach((obstacle, index) => {
        obstacle.x -= gameSpeed;

        // 충돌 감지 (간단한 AABB 충돌)
        if (
            cat.x < obstacle.x + obstacle.width &&
            cat.x + cat.width > obstacle.x &&
            cat.y < obstacle.y + obstacle.height &&
            cat.y + cat.height > obstacle.y
        ) {
            gameOver = true;
            console.log("Game Over!");
        }

        // 화면 밖으로 나간 장애물 제거
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
        }
    });

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

    // 장애물 그리기
    obstacles.forEach(obstacle => {
        ctx.drawImage(obstacleImage, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

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

    // 게임 오버 메시지
    if (gameOver) {
        ctx.fillStyle = "black";
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Game Over! Tap to Restart", canvas.width / 2, canvas.height / 2);
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// loop(); // 모든 이미지가 로드된 후 호출되므로 주석 처리
