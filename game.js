const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const splashScreen = document.getElementById("splash-screen");
const gameContainer = document.getElementById("game-container");

// --- 게임 상태 관리 ---
let gameState = 'loading'; // 'loading', 'title', 'playing', 'gameOver'

// 캔버스 크기 설정
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cat.y = canvas.height - 250;
    // 리사이즈 시 현재 상태에 맞춰 다시 그리기
    draw();
});

// --- 이미지 로딩 ---
let catImages = {
    run: [new Image(), new Image()],
    jump: new Image(),
    slide: new Image()
};
catImages.run[0].src = "assets/run1.png";
catImages.run[1].src = "assets/run2.png";
catImages.jump.src = "assets/jump.png";
catImages.slide.src = "assets/slide.png";

let background = new Image();
background.src = "assets/background.png";

let titleImage = new Image();
titleImage.src = "assets/title.jpg";

let obstacleImage = new Image();
obstacleImage.src = "assets/obstacle.png";

let imagesLoaded = 0;
const totalImages = Object.values(catImages).flat().length + 3; // 고양이 3종, 배경, 타이틀, 장애물

function imageLoadHandler() {
    imagesLoaded++;
    if (imagesLoaded >= totalImages) {
        console.log("All images loaded.");
        setTimeout(() => {
            splashScreen.style.display = 'none';
            gameContainer.style.display = 'flex';
            gameState = 'title';
        }, 2000); // 2초 후 로고 사라짐
    }
}

// 모든 이미지에 로드 핸들러 할당
Object.values(catImages).flat().forEach(img => {
    img.onload = imageLoadHandler;
    img.onerror = () => console.error(`Failed to load image: ${img.src}`);
});
background.onload = imageLoadHandler;
background.onerror = () => console.error(`Failed to load image: ${background.src}`);
titleImage.onload = imageLoadHandler;
titleImage.onerror = () => console.error(`Failed to load image: ${titleImage.src}`);
obstacleImage.onload = imageLoadHandler;
obstacleImage.onerror = () => console.error(`Failed to load image: ${obstacleImage.src}`);


// --- 게임 변수 ---
let obstacles = [];
let gameSpeed = 5;
let bgX = 0;
let obstacleInterval;

let cat = {
    x: 100,
    y: canvas.height - 250,
    width: 120,
    height: 120,
    vy: 0,
    gravity: 1,
    jumping: false,
    sliding: false,
    jumpCount: 0,
    frame: 0,
    frameDelay: 0,
    runFrameSpeed: 5
};

// --- 게임 초기화 및 시작 ---
function resetGame() {
    obstacles = [];
    cat.x = 100;
    cat.y = canvas.height - 250;
    cat.vy = 0;
    cat.jumping = false;
    cat.sliding = false;
    cat.jumpCount = 0;
    bgX = 0;
    gameSpeed = 5;
    if (obstacleInterval) clearInterval(obstacleInterval);
}

function startGame() {
    resetGame();
    gameState = 'playing';
    obstacleInterval = setInterval(createObstacle, 2000);
}

// --- 이벤트 리스너 ---
function handleUserAction(event) {
    event.preventDefault(); // 스크롤 등 기본 동작 방지

    if (gameState === 'title') {
        startGame();
    } else if (gameState === 'playing') {
        // 키보드 입력 처리
        if (event.type === 'keydown') {
            if (event.code === "Space" && cat.jumpCount < 2 && !cat.sliding) {
                cat.vy = -20;
                cat.jumping = true;
                cat.jumpCount++;
            } else if (event.code === "ArrowDown" && !cat.jumping && !cat.sliding) {
                cat.sliding = true;
                cat.vy = 0;
            }
        } else { // 터치 입력 처리
            if (cat.jumpCount < 2 && !cat.sliding) {
                cat.vy = -20;
                cat.jumping = true;
                cat.jumpCount++;
            }
        }
    } else if (gameState === 'gameOver') {
        startGame();
    }
}

document.addEventListener("keydown", handleUserAction);
document.addEventListener("touchstart", handleUserAction);

document.addEventListener("keyup", (e) => {
    if (e.code === "ArrowDown") {
        cat.sliding = false;
    }
});
document.addEventListener("touchend", (e) => {
    cat.sliding = false;
});


function createObstacle() {
    const obstacleWidth = 50;
    const obstacleHeight = 100;
    const obstacleX = canvas.width;
    const obstacleY = canvas.height - 150; // 바닥에 맞춰서
    obstacles.push({ x: obstacleX, y: obstacleY, width: obstacleWidth, height: obstacleHeight });
}

// --- 게임 로직 업데이트 ---
function update() {
    if (gameState !== 'playing') return;

    bgX -= gameSpeed;
    if (bgX <= -canvas.width) {
        bgX = 0;
    }

    cat.frameDelay++;
    if (cat.frameDelay % cat.runFrameSpeed === 0) {
        cat.frame = (cat.frame + 1) % catImages.run.length;
    }

    obstacles.forEach((obstacle, index) => {
        obstacle.x -= gameSpeed;

        let catActualY = cat.y;
        let catActualHeight = cat.height;
        if (cat.sliding) {
            catActualY = cat.y + cat.height / 2;
            catActualHeight = cat.height / 2;
        }

        if (
            cat.x < obstacle.x + obstacle.width &&
            cat.x + cat.width > obstacle.x &&
            catActualY < obstacle.y + obstacle.height &&
            catActualY + catActualHeight > obstacle.y
        ) {
            gameState = 'gameOver';
            clearInterval(obstacleInterval);
        }

        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
        }
    });

    if (cat.jumping) {
        cat.y += cat.vy;
        cat.vy += cat.gravity;
        if (cat.y >= canvas.height - 250) {
            cat.y = canvas.height - 250;
            cat.vy = 0;
            cat.jumping = false;
            cat.jumpCount = 0;
        }
    } else if (!cat.sliding) {
        cat.y = canvas.height - 250;
    }

    gameSpeed += 0.001;
}

// --- 그리기 ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'loading') {
        // 로딩 중에는 아무것도 그리지 않음 (검은 화면 방지)
        return;
    }
    
    if (gameState === 'title') {
        ctx.drawImage(titleImage, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.font = "bold 40px Arial";
        ctx.textAlign = "center";
        ctx.fillText("화면을 터치하여 시작하세요", canvas.width / 2, canvas.height - 100);

    } else if (gameState === 'playing' || gameState === 'gameOver') {
        ctx.drawImage(background, bgX, 0, canvas.width, canvas.height);
        ctx.drawImage(background, bgX + canvas.width, 0, canvas.width, canvas.height);

        let currentCatImage;
        if (cat.jumping) {
            currentCatImage = catImages.jump;
        } else if (cat.sliding) {
            currentCatImage = catImages.slide;
            ctx.drawImage(currentCatImage, cat.x, cat.y + cat.height / 2, cat.width, cat.height / 2);
        } else {
            currentCatImage = catImages.run[cat.frame];
        }

        if (!cat.sliding) {
            ctx.drawImage(currentCatImage, cat.x, cat.y, cat.width, cat.height);
        }

        obstacles.forEach(obstacle => {
            ctx.drawImage(obstacleImage, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });

        if (gameState === 'gameOver') {
            ctx.fillStyle = "red";
            ctx.font = "bold 50px Arial";
            ctx.textAlign = "center";
            ctx.fillText("게임 오버!", canvas.width / 2, canvas.height / 2);
            ctx.fillStyle = "black";
            ctx.font = "20px Arial";
            ctx.fillText("아무 곳이나 터치하여 다시 시작", canvas.width / 2, canvas.height / 2 + 50);
        }
    }
}

// --- 메인 게임 루프 ---
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// --- 초기 실행 ---
cat.y = canvas.height - 250;
gameLoop();