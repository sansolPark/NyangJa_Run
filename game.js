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
    cat.y = canvas.height - 170;
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



let mob1Image = new Image();
mob1Image.src = "assets/Mob_1_slime.png";


let imagesLoaded = 0;
const totalImages = Object.values(catImages).flat().length + 5; // 고양이 3종, 배경, 타이틀 2종, 장애물, 몬스터 1종

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

mob1Image.onload = imageLoadHandler;
mob1Image.onerror = () => console.error(`Failed to load image: ${mob1Image.src}`);



// --- 게임 변수 ---
let monsters = [];
let projectiles = [];
let playerEnergy = 100;
const monsterTypes = {
    slime: { image: mob1Image, energy: 1, width: 80, height: 80 }
};
let gameSpeed = 5;
let bgX = 0;
let obstacleInterval;
let monsterInterval;

let cat = {
    x: 100,
    y: canvas.height - 170,
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
    monsters = [];
    projectiles = [];
    playerEnergy = 100;
    cat.x = 100;
    cat.y = canvas.height - 170;
    cat.vy = 0;
    cat.jumping = false;
    cat.sliding = false;
    cat.jumpCount = 0;
    cat.rotation = 0;
    bgX = 0;
    // 화면 너비에 비례하여 게임 속도 설정 (일관된 속도감 제공)
    gameSpeed = canvas.width / 200;
    if (obstacleInterval) clearInterval(obstacleInterval);
}

function startGame() {
    if (titleInterval) clearInterval(titleInterval);
    resetGame();
    gameState = 'playing';
    monsterInterval = setInterval(createMonster, 3000);
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
const jumpBtn = document.getElementById("jumpBtn");
const slideBtn = document.getElementById("slideBtn");
const attackBtn = document.getElementById("attackBtn");

// 캔버스 클릭/터치로 게임 시작/재시작
function handleCanvasInteraction(event) {
    event.preventDefault();
    if (gameState === 'title' || gameState === 'gameOver') {
        startGame();
    } else if (gameState === 'playing') {
        const rect = canvas.getBoundingClientRect();
        const touches = event.changedTouches ? Array.from(event.changedTouches) : [event];

        touches.forEach(touch => {
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            monsters.forEach((monster, index) => {
                if (
                    x > monster.x &&
                    x < monster.x + monster.width &&
                    y > monster.y &&
                    y < monster.y + monster.height
                ) {
                    monster.energy -= 1;
                    if (monster.energy <= 0) {
                        monsters.splice(index, 1);
                    }
                }
            });
        });
    }
}
canvas.addEventListener("click", handleCanvasInteraction);
canvas.addEventListener("touchstart", handleCanvasInteraction, { passive: false });


// 점프 버튼 이벤트
function handleJump(e) {
    e.preventDefault();
    if (gameState === 'playing' && cat.jumpCount < 2 && !cat.sliding) {
        cat.vy = -20;
        cat.jumping = true;
        cat.jumpCount++;
    }
}
jumpBtn.addEventListener("touchstart", handleJump);
jumpBtn.addEventListener("click", handleJump); // PC 클릭 지원


// 슬라이드 버튼 이벤트
function handleSlideStart(e) {
    e.preventDefault();
    if (gameState === 'playing' && !cat.jumping) {
        cat.sliding = true;
        cat.vy = 0;
    }
}
function handleSlideEnd(e) {
    e.preventDefault();
    cat.sliding = false;
}

function createProjectile() {
    projectiles.push({
        x: cat.x + cat.width,
        y: cat.y + cat.height / 2,
        width: 50,
        height: 50,
        rotation: 0,
        rotationSpeed: 0.2
    });
}

slideBtn.addEventListener("touchstart", handleSlideStart);
slideBtn.addEventListener("touchend", handleSlideEnd);
slideBtn.addEventListener("mousedown", handleSlideStart); // PC 마우스 지원
slideBtn.addEventListener("mouseup", handleSlideEnd);


function handleAttack(e) {
    e.preventDefault();
    if (gameState === 'playing') {
        createProjectile();
    }
}
attackBtn.addEventListener("touchstart", handleAttack);
attackBtn.addEventListener("click", handleAttack);




function createMonster() {
    const monsterKey = 'slime';
    const type = monsterTypes[monsterKey];

    monsters.push({
        x: canvas.width,
        y: canvas.height - 170,
        width: type.width,
        height: type.height,
        energy: type.energy,
        type: monsterKey
    });
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

    projectiles.forEach((projectile, pIndex) => {
        projectile.x += gameSpeed * 2;
        projectile.rotation += projectile.rotationSpeed;

        monsters.forEach((monster, mIndex) => {
            if (
                projectile.x < monster.x + monster.width &&
                projectile.x + projectile.width > monster.x &&
                projectile.y < monster.y + monster.height &&
                projectile.y + projectile.height > monster.y
            ) {
                projectiles.splice(pIndex, 1);
                monster.energy -= 1;
                if (monster.energy <= 0) {
                    monsters.splice(mIndex, 1);
                }
            }
        });

        if (projectile.x > canvas.width) {
            projectiles.splice(pIndex, 1);
        }
    });

    

    // 몬스터 로직
    monsters.forEach((monster, index) => {
        monster.x -= gameSpeed;

        let catActualY = cat.y;
        let catActualHeight = cat.height;
        if (cat.sliding) {
            catActualY = cat.y + cat.height / 2;
            catActualHeight = cat.height / 2;
        }

        if (
            cat.x < monster.x + monster.width &&
            cat.x + cat.width > monster.x &&
            catActualY < monster.y + monster.height &&
            catActualY + catActualHeight > monster.y
        ) {
            monsters.splice(index, 1);
            playerEnergy -= 1;
            if (playerEnergy <= 0) {
                gameState = 'gameOver';
                clearInterval(monsterInterval);
            }
        }

        if (monster.x + monster.width < 0) {
            monsters.splice(index, 1);
        }
    });

    if (cat.jumping) {
        if (cat.jumpCount === 2) {
            cat.rotation += 0.2;
        }
        cat.y += cat.vy;
        cat.vy += cat.gravity;
        if (cat.y >= canvas.height - 170) {
            cat.y = canvas.height - 170;
            cat.vy = 0;
            cat.jumping = false;
            cat.jumpCount = 0;
            cat.rotation = 0;
        }
    } else if (!cat.sliding) {
        cat.y = canvas.height - 170;
    }

    gameSpeed += 0.001;
}

// --- 그리기 ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 버튼 가시성 조절
    if (gameState === 'playing') {
        jumpBtn.style.display = 'block';
        slideBtn.style.display = 'block';
        attackBtn.style.display = 'block';
    } else {
        jumpBtn.style.display = 'none';
        slideBtn.style.display = 'none';
        attackBtn.style.display = 'none';
    }

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


        

        monsters.forEach(monster => {
            const type = monsterTypes[monster.type];
            ctx.drawImage(type.image, monster.x, monster.y, monster.width, monster.height);
        });

        projectiles.forEach(projectile => {
            ctx.save();
            ctx.translate(projectile.x + projectile.width / 2, projectile.y + projectile.height / 2);
            ctx.rotate(projectile.rotation);
            ctx.drawImage(obstacleImage, -projectile.width / 2, -projectile.height / 2, projectile.width, projectile.height);
            ctx.restore();
        });

        // 에너지 표시
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        ctx.textAlign = "left";
        ctx.fillText("Energy: " + playerEnergy, 20, 40);

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
cat.y = canvas.height - 170;
gameLoop();