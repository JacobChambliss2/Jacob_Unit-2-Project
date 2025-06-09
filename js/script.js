const car = document.getElementById("car");
const person = document.getElementById("person");
const section = document.getElementById("carSection");
const resultText = document.getElementById("result");
const infoText = document.getElementById("reactionInfo");

let startTime = null;
let animationFrame;
let animationRunning = false;
let lastX = 0;
let lastXPerson = 0;
let clicked = false;
let allowScrollToSection2 = false;
let scrollLockActive = false;

const totalTime = 700; // ms
const distance = 1000; // pixels
const reactionTime = 670; // ms
const acceleration = (2 * distance) / Math.pow(totalTime / 1000, 2); // a = 2d/t²

function lockScroll() {
  if (!scrollLockActive) {
    scrollLockActive = true;
    document.body.style.overflow = 'hidden';
  }
}

function unlockScroll() {
  if (scrollLockActive) {
    scrollLockActive = false;
    document.body.style.overflow = '';
  }
}

function animateCarAndPerson() {
  startTime = null;
  animationRunning = true;
  clicked = false;
  resultText.textContent = "";
  infoText.style.opacity = "0";
  car.style.left = "10px";
  if (person) {
    person.style.transition = "none";
    person.style.transform = "none";
  }

  // Scroll to the bottom of the first .car-overlap when animation starts
  const firstSection = document.querySelector('.car-overlap');
  if (firstSection) {
    firstSection.scrollIntoView({ behavior: 'auto', block: 'end' });
  }
  allowScrollToSection2 = false;
  lockScroll();

  let personHit = false;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const t = elapsed / 1000;
    const x = 0.5 * acceleration * t * t;

    lastX = Math.min(x, distance);
    car.style.left = lastX + "px";

    // Trigger person hit at 80% of animation
    if (!personHit && elapsed >= (totalTime * 0.8)) {
      personHit = true;
      if (person) {
        person.style.transition = "transform 20.2s cubic-bezier(0.4,2,0.6,1)";
        person.style.transform = "translateX(200vw) rotate(1080deg)";
      }
    }

    if (elapsed < totalTime && animationRunning) {
      animationFrame = requestAnimationFrame(step);
    } else {
      animationRunning = false;
      showTooLate();
      allowScrollToSection2 = true;
      unlockScroll();
    }
  }

  requestAnimationFrame(step);
}

// Listen for click anywhere on the document
function handleReactionClick() {
  if (!animationRunning || clicked) return;
  clicked = true;
  animationRunning = false;
  cancelAnimationFrame(animationFrame);

  const elapsed = performance.now() - startTime;

  // Place the text exactly under the car
  infoText.style.left = lastX + "px";
  infoText.style.opacity = "1";

  // Show result
  const difference = Math.abs(elapsed - reactionTime);
  if (difference <= 100) {
    resultText.textContent = "Perfect timing! You reacted just in time.";
  } else if (elapsed < reactionTime) {
    resultText.textContent = "Pretty fast! You reacted quickly.";
  } else {
    resultText.textContent = "A bit slow – that could cost you at high speeds!";
  }
}

document.addEventListener("click", handleReactionClick);

function showTooLate() {
  if (!clicked) {
    infoText.style.left = lastX + "px";
    infoText.style.opacity = "1";
    resultText.textContent = "Too late! You didn’t react in time.";
  }
}

// Scroll lock for section2 after animation is over and user scrolls
let section2Scrolled = false;
window.addEventListener('scroll', function() {
  if (allowScrollToSection2 && !section2Scrolled) {
    const section2 = document.querySelector('.section2');
    if (section2) {
      section2.scrollIntoView({ behavior: 'auto', block: 'end' });
      section2Scrolled = true;
    }
  }
});

// Start animation when scrolled into view
const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCarAndPerson();
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.5
});

observer.observe(section);

// --- BEGIN ARCADE ROAD GAME CODE ---
// Game constants
const roadWidth = 400;
const laneCount = 3;
const laneWidth = roadWidth / laneCount;
const carWidth = 60;
const carHeight = 100;
let playerLane = 1; // 0 = left, 1 = center, 2 = right
let gameActive = false;
let enemyCars = [];
let gameAnimationFrame;

function startRoadGame() {
  const gameContainer = document.getElementById('road-game-container');
  if (!gameContainer) return;
  gameActive = true;
  playerLane = 1;
  enemyCars = [];
  gameContainer.innerHTML = '';

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = roadWidth;
  canvas.height = 500;
  canvas.style.display = 'block';
  canvas.style.margin = '0 auto';
  canvas.style.background = '#444';
  gameContainer.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // Draw road lines
  function drawRoad() {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, roadWidth, canvas.height);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    for (let i = 1; i < laneCount; i++) {
      ctx.setLineDash([20, 20]);
      ctx.beginPath();
      ctx.moveTo(i * laneWidth, 0);
      ctx.lineTo(i * laneWidth, canvas.height);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // Draw player car
  function drawPlayer() {
    ctx.save();
    ctx.fillStyle = '#e00';
    ctx.fillRect(playerLane * laneWidth + (laneWidth - carWidth) / 2, canvas.height - carHeight - 10, carWidth, carHeight);
    ctx.restore();
  }

  // Draw enemy cars
  function drawEnemies() {
    ctx.save();
    ctx.fillStyle = '#0af';
    enemyCars.forEach(car => {
      ctx.fillRect(car.lane * laneWidth + (laneWidth - carWidth) / 2, car.y, carWidth, carHeight);
    });
    ctx.restore();
  }

  // Move enemy cars
  function updateEnemies() {
    for (let car of enemyCars) {
      car.y += car.speed;
    }
    // Remove cars that are out of view
    enemyCars = enemyCars.filter(car => car.y < canvas.height);
  }

  // Collision detection
  function checkCollision() {
    for (let car of enemyCars) {
      if (
        car.lane === playerLane &&
        car.y + carHeight > canvas.height - carHeight - 10 &&
        car.y < canvas.height - 10
      ) {
        return true;
      }
    }
    return false;
  }

  // Game loop
  let lastEnemyTime = 0;
  function gameLoop(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRoad();
    drawPlayer();
    drawEnemies();
    updateEnemies();
    if (checkCollision()) {
      gameActive = false;
      ctx.font = '40px Arial';
      ctx.fillStyle = 'yellow';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', roadWidth / 2, canvas.height / 2);
      return;
    }
    // Add new enemy car every 1-1.5 seconds
    if (!lastEnemyTime || timestamp - lastEnemyTime > 1000 + Math.random() * 500) {
      const lane = Math.floor(Math.random() * laneCount);
      enemyCars.push({ lane, y: -carHeight, speed: 4 + Math.random() * 2 });
      lastEnemyTime = timestamp;
    }
    if (gameActive) {
      gameAnimationFrame = requestAnimationFrame(gameLoop);
    }
  }

  // Keyboard controls
  function handleKey(e) {
    if (!gameActive) return;
    if (e.key === 'ArrowLeft' && playerLane > 0) {
      playerLane--;
    } else if (e.key === 'ArrowRight' && playerLane < laneCount - 1) {
      playerLane++;
    }
  }
  document.addEventListener('keydown', handleKey);

  // Start game loop
  gameAnimationFrame = requestAnimationFrame(gameLoop);
}

// Start the road game when section2 is scrolled into view
const section2 = document.querySelector('.section2');
if (section2) {
  section2.innerHTML = '<div id="road-game-container" style="width: 400px; height: 500px; margin: 0 auto;"></div>';
  // Optionally, you can start the game immediately or on a button click
  startRoadGame();
}

// Prevent arrow keys and spacebar from scrolling the page
window.addEventListener('keydown', function(e) {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Spacebar"].includes(e.key)) {
    e.preventDefault();
  }
}, { passive: false });

document.addEventListener('DOMContentLoaded', function() {
  const section2 = document.querySelector('.section2');
  if (!section2) return;
  section2.innerHTML = '<div id="road-game-container" style="width: 100vw; height: 80vh; margin: 0; position: relative;"></div>';

  // Sideways game: lanes are horizontal rows, player moves left to right
  const roadWidth = Math.floor(window.innerWidth * 0.95);
  const roadHeight = Math.floor(window.innerHeight * 0.8);
  const laneCount = 6;
  const laneHeight = roadHeight / laneCount;
  const carWidth = 80;
  const carHeight = Math.max(40, Math.floor(laneHeight * 0.8));
  let playerLane = Math.floor(laneCount / 2);
  let playerX = 10;
  let playerSpeed = 4; // Start at low speed
  const minPlayerSpeed = 4;
  const maxPlayerSpeed = 18;
  let speedStep = 2; // How much to increase speed each round
  let roundTime = 4000; // ms per round before speed increases
  let enemyCars = [];
  let gameActive = true;
  let gameAnimationFrame;
  let speedMeter;
  let roundTimer;
  let currentRound = 0;

  function setupSpeedMeter() {
    if (!speedMeter) {
      speedMeter = document.createElement('div');
      speedMeter.id = 'speed-meter';
      speedMeter.style.position = 'absolute';
      speedMeter.style.top = '10px';
      speedMeter.style.left = '50%';
      speedMeter.style.transform = 'translateX(-50%)';
      speedMeter.style.background = 'rgba(0,0,0,0.7)';
      speedMeter.style.color = '#fff';
      speedMeter.style.fontSize = '28px';
      speedMeter.style.fontFamily = 'Arial, sans-serif';
      speedMeter.style.padding = '8px 24px';
      speedMeter.style.borderRadius = '12px';
      speedMeter.style.zIndex = '10';
      speedMeter.style.textAlign = 'center';
      section2.appendChild(speedMeter);
    }
    speedMeter.textContent = `Speed: ${playerSpeed.toFixed(1)}`;
  }

  function startGameAtSpeed(speed) {
    playerSpeed = speed;
    playerLane = Math.floor(laneCount / 2);
    playerX = 10;
    enemyCars = [];
    // Spawn initial enemy cars, spaced out, going left-to-right
    for (let i = 0; i < laneCount; i++) {
      // Place 2-3 cars per lane, spaced out
      let numCars = 2 + Math.floor(Math.random() * 2); // 2 or 3
      for (let j = 0; j < numCars; j++) {
        let x = 100 + Math.random() * (roadWidth * 0.7) + j * 120;
        // For player's lane, ensure at least one car is present, but not right on top of player
        if (i === playerLane && j === 0) {
          x = 200 + Math.random() * (roadWidth * 0.5); // always at least 200px away from left
        }
        // For player's lane, skip cars that would be too close to the player
        if (i === playerLane && x < 120) continue;
        // Enemy speed is random and constant, not based on playerSpeed, centered around 3.5 px/frame
        const enemySpeed = 2.5 + Math.random() * 2; // 2.5 to 4.5 px/frame
        enemyCars.push({ lane: i, x: x, speed: enemySpeed });
      }
    }
    // Guarantee at least one car in player's lane if not already
    if (!enemyCars.some(car => car.lane === playerLane)) {
      let x = 200 + Math.random() * (roadWidth * 0.5);
      const enemySpeed = 2.5 + Math.random() * 2;
      enemyCars.push({ lane: playerLane, x: x, speed: enemySpeed });
    }
    gameActive = true;
    setupSpeedMeter();
    drawGameInit();
    if (gameAnimationFrame) cancelAnimationFrame(gameAnimationFrame);
    gameAnimationFrame = requestAnimationFrame(gameLoop);
  }

  // Create canvas
  const gameContainer = document.getElementById('road-game-container');
  let canvas = document.createElement('canvas');
  canvas.width = roadWidth;
  canvas.height = roadHeight;
  canvas.style.display = 'block';
  canvas.style.margin = '0 auto';
  canvas.style.background = '#444';
  gameContainer.appendChild(canvas);
  let ctx = canvas.getContext('2d');

  function drawRoad() {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, roadWidth, roadHeight);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    for (let i = 1; i < laneCount; i++) {
      ctx.setLineDash([20, 20]);
      ctx.beginPath();
      ctx.moveTo(0, i * laneHeight);
      ctx.lineTo(roadWidth, i * laneHeight);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  function drawPlayer() {
    ctx.save();
    ctx.fillStyle = '#e00';
    ctx.fillRect(playerX, playerLane * laneHeight + (laneHeight - carHeight) / 2, carWidth, carHeight);
    ctx.restore();
  }

  function drawEnemies() {
    ctx.save();
    ctx.fillStyle = '#0af';
    enemyCars.forEach(car => {
      ctx.fillRect(car.x, car.lane * laneHeight + (laneHeight - carHeight) / 2, carWidth, carHeight);
    });
    ctx.restore();
  }

  function updateEnemies() {
    for (let car of enemyCars) {
      car.x += car.speed; // Move right (same as player)
    }
    enemyCars = enemyCars.filter(car => car.x < roadWidth);
  }

  function checkCollision() {
    const playerY = playerLane * laneHeight + (laneHeight - carHeight) / 2;
    for (let car of enemyCars) {
      const enemyY = car.lane * laneHeight + (laneHeight - carHeight) / 2;
      if (
        playerLane === car.lane &&
        playerX + carWidth > car.x &&
        playerX < car.x + carWidth &&
        playerY < enemyY + carHeight &&
        playerY + carHeight > enemyY
      ) {
        return true;
      }
    }
    return false;
  }

  function drawGameInit() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRoad();
    drawPlayer();
    drawEnemies();
  }

  let lastEnemyTime = 0;
  function gameLoop(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRoad();
    drawPlayer();
    drawEnemies();
    updateEnemies();
    playerX += playerSpeed; // Move player right
    if (playerX > roadWidth - carWidth) {
      playerX = roadWidth - carWidth;
      if (gameActive) {
        currentRound++;
        let nextSpeed = Math.min(playerSpeed + speedStep, maxPlayerSpeed);
        startGameAtSpeed(nextSpeed);
        return;
      }
    }
    if (checkCollision()) {
      gameActive = false;
      ctx.font = '40px Arial';
      ctx.fillStyle = 'yellow';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', roadWidth / 2, roadHeight / 2);
      return;
    }
    // Spawn more cars, left-to-right
    if (!lastEnemyTime || timestamp - lastEnemyTime > 700 + Math.random() * 400) {
      const occupiedLanes = new Set();
      for (let car of enemyCars) {
        if (car.x < carWidth * 1.5) {
          occupiedLanes.add(car.lane);
        }
      }
      const freeLanes = [];
      for (let i = 0; i < laneCount; i++) {
        if (!occupiedLanes.has(i)) freeLanes.push(i);
      }
      if (freeLanes.length > 0) {
        const lane = freeLanes[Math.floor(Math.random() * freeLanes.length)];
        const enemySpeed = 2.5 + Math.random() * 2;
        enemyCars.push({ lane, x: 0, speed: enemySpeed });
      }
      lastEnemyTime = timestamp;
    }
    speedMeter.textContent = `Speed: ${playerSpeed.toFixed(1)}`;
    if (gameActive) {
      gameAnimationFrame = requestAnimationFrame(gameLoop);
    }
  }

  function handleKeyDown(e) {
    if (!gameActive) return;
    if ((e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') && playerLane > 0) {
      playerLane -= 1;
    } else if ((e.key === 'ArrowDown' || e.key.toLowerCase() === 's') && playerLane < laneCount - 1) {
      playerLane += 1;
    }
  }
  document.addEventListener('keydown', handleKeyDown);

  // Start the first round
  startGameAtSpeed(minPlayerSpeed);
});
