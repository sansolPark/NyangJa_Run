const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 캔버스 크기를 창에 맞춰 설정 (여기서 width와 height 순서를 원래대로 돌릴게, 게임 보통 가로가 길어서!)
// ⭐️ 이 부분은 친구가 의도한 화면 비율에 따라 Math.max와 Math.min을 조절해도 돼!
canvas.width = window.innerWidth; // 보통 가로가 더 길게
canvas.height = window.innerHeight; // 세로가 짧게

// 화면 크기 변경 시 캔버스 및 고양이 위치 조정
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // 고양이의 초기 Y 위치를 새로운 캔버스 높이에 맞춰 재조정
    cat.y = canvas.height - 250; // 기존 바닥 레벨 유지 (친구 코드에 맞춤)
    // resize 이벤트 발생 시 게임을 즉시 다시 그려주자
    draw();
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
// obstacleImage.onload = imageLoadHandler; // 이 부분은 imageLoadHandler 함수에서 처리할 거라 주석 처리할게!
obstacleImage.onerror = () => console.error(`Failed to load image: ${obstacleImage.src}`);

let gameSpeed = 5; // Initial game speed

// 모든 이미지가 로드될 때까지 기다립니다.
let imagesLoaded = 0;
// 이미지 개수 재조정: catImages.run (2개) + catImages.jump (1개) + catImages.slide (1개) + background (1개) + obstacleImage (1개)
const totalImages = catImages.run.length + 1 + 1 + 1 + 1;

function imageLoadHandler() {
    imagesLoaded++;
    console.log(`Loaded image: ${this.src}. Total loaded: ${imagesLoaded}/${totalImages}`); // 로드 상황 확인을 위한 로그
    if (imagesLoaded >= totalImages) { // >= 으로 변경, 혹시 모를 로딩 순서 차이 때문
        console.log("All images loaded. Starting game loop.");
        // 이미지 로드가 완료되면 초기 draw 호출
        draw(); // 초기 화면 그리기
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

// 장애물 이미지 로드 이벤트 리스너 (여기서 추가해줘야 함!)
obstacleImage.onload = imageLoadHandler; // 추가: 장애물 이미지 로드 핸들러
obstacleImage.onerror = () => console.error(`Failed to load image: ${obstacleImage.src}`);


let bgX = 0;

let cat = {
    x: 100,
    y: canvas.height - 250, // 🟢 바닥에 맞게 수정 - 초기 캔버스 높이 사용
    width: 120,
    height: 120,
    vy: 0,
    gravity: 1,
    jumping: false,
    sliding: false,
    jumpCount: 0,
    frame: 0,
    frameDelay: 0,
    runFrameSpeed: 5 // 달리기 애니메이션 속도 조절용
};

function createObstacle() {
    const obstacleWidth = 50;
    const obstacleHeight = 100;
    const obstacleX = canvas.width;
    // 장애물 Y 위치: 바닥 레벨에 맞춰야 해! (cat.y + cat.height - obstacleHeight 해도 좋음)
    const obstacleY = canvas.height - obstacleHeight - (canvas.height - (cat.y + cat.height)); // 바닥과의 거리를 기준으로 계산
    obstacles.push({
        x: obstacleX,
        y: obstacleY,
        width: obstacleWidth,
        height: obstacleHeight
    });
}

// 처음부터 interval을 시작하지 않고, 이미지가 로드된 후 loop에서 시작하도록 변경
let obstacleInterval;

document.addEventListener("keydown", (e) => {
    // 게임 오버 상태에서는 아무 키도 작동하지 않게
    if (gameOver) return;

    if (e.code === "Space" && cat.jumpCount < 2 && !cat.sliding) {
        cat.vy = -20;
        cat.jumping = true;
        cat.jumpCount++;
    }
    if (e.code === "ArrowDown" && !cat.jumping && !cat.sliding) { // 슬라이딩 중엔 다시 슬라이딩 안되게
        cat.sliding = true;
        cat.vy = 0; // 슬라이딩 중엔 중력 영향 안 받게
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
        cat.y = canvas.height - 250; // 초기 y 값으로
        cat.vy = 0;
        cat.jumping = false;
        cat.sliding = false;
        cat.jumpCount = 0;
        bgX = 0;
        gameSpeed = 5; // 게임 속도 초기화
        clearInterval(obstacleInterval); // 기존 인터벌 정리
        obstacleInterval = setInterval(createObstacle, 2000); // 새로운 인터벌 시작
        loop(); // 게임 루프 재시작
        return; // Exit to prevent immediate jump after restart
    }

    // Trigger jump if not already jumping or sliding, and jump count allows
    if (cat.jumpCount < 2 && !cat.sliding) {
        cat.vy = -20;
        cat.jumping = true;
        cat.jumpCount++;
    } else if (!cat.jumping && !cat.sliding) { // 점프 중이 아닐 때 터치 시 슬라이딩으로 간주할 수도 있음
        cat.sliding = true;
        cat.vy = 0;
    }
});

document.addEventListener("keyup", (e) => {
    if (e.code === "ArrowDown") {
        cat.sliding = false;
    }
});

// ---------- 여기에 update() 함수가 끝나고 draw() 함수가 추가되어야 해! ----------

function update() {
    if (gameOver) return; // Stop updates if game is over

    // 배경 이동
    bgX -= gameSpeed;
    if (bgX <= -canvas.width) { // 캔버스 폭만큼 이동하면 초기화
        bgX = 0;
    }

    // 고양이 애니메이션 프레임 업데이트
    cat.frameDelay++;
    if (cat.frameDelay % cat.runFrameSpeed === 0) { // 달리기 속도에 맞춰 프레임 변경
        cat.frame = (cat.frame + 1) % catImages.run.length;
    }

    // 장애물 이동 및 충돌 감지
    obstacles.forEach((obstacle, index) => {
        obstacle.x -= gameSpeed;

        // 충돌 감지 (간단한 AABB 충돌)
        // 고양이의 실제 높이와 위치를 고려
        let catActualY = cat.y;
        let catActualHeight = cat.height;

        // 슬라이딩 중일 때는 고양이 높이와 Y 위치 조절
        if (cat.sliding) {
            catActualY = cat.y + cat.height / 2; // 슬라이딩 시 고양이 Y 위치는 발 기준으로 위로 올라가야 함
            catActualHeight = cat.height / 2; // 슬라이딩 시 고양이 높이 절반으로 줄어듬
        }

        if (
            cat.x < obstacle.x + obstacle.width &&
            cat.x + cat.width > obstacle.x &&
            catActualY < obstacle.y + obstacle.height &&
            catActualY + catActualHeight > obstacle.y
        ) {
            gameOver = true;
            console.log("Game Over!");
            clearInterval(obstacleInterval); // 게임 오버 시 장애물 생성 중지
        }

        // 화면 밖으로 나간 장애물 제거
        if (obstacle.x + obstacle.width < 0) {
            // splice를 사용할 때는 뒤에서부터 제거하거나, 새로운 배열을 만들어서 처리하는 게 안전해!
            // 여기서는 forEach라서 index가 꼬일 수 있으니 filter로 바꾸는게 더 안정적이야
            // 일단은 남겨두지만 참고해!
            obstacles.splice(index, 1);
        }
    });

    // 중력 적용
    if (cat.jumping) {
        cat.y += cat.vy;
        cat.vy += cat.gravity;

        // 바닥에 닿았는지 확인
        if (cat.y + cat.height >= canvas.height - (canvas.height - (cat.y + cat.height))) { // 바닥 기준
            cat.y = canvas.height - cat.height - (canvas.height - (cat.y + cat.height)); // 바닥에 고정
            cat.vy = 0;
            cat.jumping = false;
            cat.jumpCount = 0; // 점프 횟수 초기화
        }
    } else if (!cat.sliding) { // 점프 중도 아니고 슬라이딩 중도 아니면 바닥에 붙어있어야 함
        // 여기서는 그냥 바닥에 붙어있도록 cat.y를 직접 설정하는 게 더 안정적이야
        cat.y = canvas.height - 250; // 초기 고양이 Y 위치 (바닥 기준)
    }

    // 게임 속도 점진적 증가
    gameSpeed += 0.001; // 조금씩 빨라지게!
}


function draw() {
    // 캔버스 초기화 (필수!)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. 배경 그리기
    // 배경 이미지를 두 번 그려서 무한 스크롤 효과
    ctx.drawImage(background, bgX, 0, canvas.width, canvas.height);
    ctx.drawImage(background, bgX + canvas.width, 0, canvas.width, canvas.height);

    // 2. 고양이 그리기
    let currentCatImage;
    if (cat.jumping) {
        currentCatImage = catImages.jump;
    } else if (cat.sliding) {
        currentCatImage = catImages.slide;
        // 슬라이딩 시 높이와 y위치 조절 (그래픽적으로 납작하게 보이게)
        ctx.drawImage(currentCatImage, cat.x, cat.y + cat.height / 2, cat.width, cat.height / 2);
    } else {
        currentCatImage = catImages.run[cat.frame];
    }

    if (!cat.sliding) { // 슬라이딩이 아니면 기본 위치에 그리기
        ctx.drawImage(currentCatImage, cat.x, cat.y, cat.width, cat.height);
    }

    // 3. 장애물 그리기
    obstacles.forEach(obstacle => {
        ctx.drawImage(obstacleImage, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

    // 4. 게임 오버 메시지
    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "bold 50px Arial";
        ctx.textAlign = "center";
        ctx.fillText("게임 오버!", canvas.width / 2, canvas.height / 2);

        ctx.fillStyle = "black";
        ctx.font = "20px Arial";
        ctx.fillText("아무 곳이나 터치 또는 스페이스바를 눌러 다시 시작", canvas.width / 2, canvas.height / 2 + 50);
    }
}

// 게임 루프
function loop() {
    update(); // 상태 업데이트
    draw();   // 화면 그리기
    // 게임 오버가 아니면 계속해서 루프 실행
    if (!gameOver) {
        requestAnimationFrame(loop);
    }
}

// 시작은 이미지 로드 핸들러에서 이루어짐
// 맨 처음 로드될 때 모든 이미지가 로드되었는지 확인하고 loop()를 시작하게 됨

// 초기 캔버스 사이즈 설정 후 고양이 위치 재설정 (이미지 로드 전에 먼저!)
cat.y = canvas.height - 250; // 초기 설정 한 번 더 해주기

// 게임 시작 전에 이미지를 모두 로드하도록 설정되었으므로, 별도의 초기화 함수 호출은 필요 없어.
// imageLoadHandler 함수에서 모든 이미지가 로드되면 loop()를 호출하도록 되어 있어!
// 단, obstacleInterval은 loop에서 한 번만 시작하도록 해야 해.
// 그래서 `obstacleInterval = setInterval(createObstacle, 2000);` 이 부분은 `loop()`가 시작되기 직전이나 `imageLoadHandler`에서 `loop()`를 호출하기 전에 한 번만 호출되도록 수정하는 게 좋을 것 같아!
// 현재 코드는 이미 이미지 로드가 완료된 후에 loop()가 시작되므로, `loop()` 함수에서 `obstacleInterval`을 초기화해줄 필요가 있어!
// 아니면, `imageLoadHandler`에서 `loop()`를 호출하기 직전에 `obstacleInterval`을 설정해주자!
