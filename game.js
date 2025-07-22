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
let titleImage2 = new Image();
titleImage2.src = "assets/title2.jpg";

let obstacleImage = new Image();
obstacleImage.src = "assets/obstacle.png";

let imagesLoaded = 0;
const totalImages = Object.values(catImages).flat().length + 4; // 고양이 3종, 배경, 타이틀 2종, 장애물

let titleInterval;
let titleImageToggle = true;

function imageLoadHandler() {
    imagesLoaded++;
    if (imagesLoaded >= totalImages) {
        console.log("All images loaded.");
        setTimeout(() => {
            splashScreen.classList.add('fade-out');
            setTimeout(() => {
                splashScreen.style.display = 'none';
                gameContainer.style.display = 'flex';
                gameState = 'title';
                startTitleAnimation();
            }, 1000); // 페이드아웃 시간과 동일하게 설정
        }, 1000); // 로고 표시 시간
    }
}

function startTitleAnimation() {
    if (titleInterval) clearInterval(titleInterval);
    titleInterval = setInterval(() => {
        titleImageToggle = !titleImageToggle;
    }, 300); // 0.3초 간격으로 변경
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
titleImage2.onload = imageLoadHandler;
titleImage2.onerror = () => console.error(`Failed to load image: ${titleImage2.src}`);
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
    runFrameSpeed: 5,
    rotation: 0
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
    cat.rotation = 0;
    bgX = 0;
    gameSpeed = 5;
    if (obstacleInterval) clearInterval(obstacleInterval);
}

function startGame() {
    if (titleInterval) clearInterval(titleInterval);
    resetGame();
    gameState = 'playing';
    obstacleInterval = setInterval(createObstacle, 2000);
}

// --- 이벤트 리스너 ---
// 키보드 입력 (PC)
document.addEventListener("keydown", (e) => {
    if (gameState !== 'playing') return;
    e.preventDefault();
    if (e.code === "Space" && cat.jumpCount < 2 && !cat.sliding) {
        cat.vy = -20;
        cat.jumping = true;
        cat.jumpCount++;
    } else if (e.code === "ArrowDown" && !cat.jumping && !cat.sliding) {
        cat.sliding = true;
        cat.vy = 0;
    }
});

document.addEventListener("keyup", (e) => {
    if (e.code === "ArrowDown") {
        cat.sliding = false;
    }
});

// 터치 및 클릭 입력 (모바일 및 PC)
function handlePointerInteraction(event) {
    event.preventDefault();

    // 1. 타이틀 또는 게임오버 화면에서 게임 시작/재시작
    if (gameState === 'title' || gameState === 'gameOver') {
        // touchend나 keyup 같은 이벤트로 재시작되는 것을 방지
        if (event.type === 'click' || event.type === 'touchstart') {
            startGame();
        }
        return;
    }

    // 2. 게임 플레이 중 조작
    if (gameState === 'playing') {
        if (event.type === 'touchstart') {
            const touchY = event.touches[0].clientY;
            const halfScreen = canvas.height / 2;

            if (touchY < halfScreen) { // 화면 상단 터치 -> 점프
                if (cat.jumpCount < 2 && !cat.sliding) {
                    cat.vy = -20;
                    cat.jumping = true;
                    cat.jumpCount++;
                }
            } else { // 화면 하단 터치 -> 슬라이드 시작
                if (!cat.jumping) {
                    cat.sliding = true;
                    cat.vy = 0;
                }
            }
        } else if (event.type === 'touchend') {
            // 터치가 끝나면 슬라이드 중지
            cat.sliding = false;
        }
    }
}

document.addEventListener("click", handlePointerInteraction);
document.addEventListener("touchstart", handlePointerInteraction, { passive: false });
document.addEventListener("touchend", handlePointerInteraction, { passive: false });


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
        if (cat.jumpCount === 2) {
            cat.rotation += 0.2;
        }
        cat.y += cat.vy;
        cat.vy += cat.gravity;
        if (cat.y >= canvas.height - 250) {
            cat.y = canvas.height - 250;
            cat.vy = 0;
            cat.jumping = false;
            cat.jumpCount = 0;
            cat.rotation = 0;
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
        if (titleImageToggle) {
            ctx.drawImage(titleImage, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.drawImage(titleImage2, 0, 0, canvas.width, canvas.height);
        }
       

    } else if (gameState === 'playing' || gameState === 'gameOver') {
        ctx.drawImage(background, bgX, 0, canvas.width, canvas.height);
        ctx.drawImage(background, bgX + canvas.width, 0, canvas.width, canvas.height);

        let currentCatImage;
        if (cat.jumping) {
            currentCatImage = catImages.jump;
            if (cat.jumpCount === 2) {
                ctx.save();
                ctx.translate(cat.x + cat.width / 2, cat.y + cat.height / 2);
                ctx.rotate(cat.rotation);
                ctx.drawImage(currentCatImage, -cat.width / 2, -cat.height / 2, cat.width, cat.height);
                ctx.restore();
            } else {
                 ctx.drawImage(currentCatImage, cat.x, cat.y, cat.width, cat.height);
            }
        } else if (cat.sliding) {
            currentCatImage = catImages.slide;
            ctx.drawImage(currentCatImage, cat.x, cat.y + cat.height / 2, cat.width, cat.height / 2);
        } else {
            currentCatImage = catImages.run[cat.frame];
            ctx.drawImage(currentCatImage, cat.x, cat.y, cat.width, cat.height);
        }

        if (!cat.sliding && !(cat.jumping && cat.jumpCount === 2)) {
             let img = cat.jumping ? catImages.jump : catImages.run[cat.frame];
             ctx.drawImage(img, cat.x, cat.y, cat.width, cat.height);
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