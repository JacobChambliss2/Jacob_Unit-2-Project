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
function animateCar2(selectedSpeed) {
  const car2 = document.getElementById("car2");
  const scale = document.getElementById("speed-scale");
  if (!car2 || !scale) return;

  // Constants for the hill and physics
  const hillHeight = 300; // px
  const hillWidth = 600; // px
  const minSpeed = 10; // mph
  const maxSpeed = 100; // mph
  const baseDuration = 6000; // ms for minSpeed

  // Air resistance increases exponentially with speed (drag ~ v^2)
  // We'll use a simple model: duration = baseDuration * (minSpeed/selectedSpeed) * (1 + 0.01 * selectedSpeed^2)
  const dragFactor = 1 + 0.01 * Math.pow(selectedSpeed, 2);
  const duration = baseDuration * (minSpeed / selectedSpeed) * dragFactor;

  // Exponential path for the hill: y = hillHeight * (1 - exp(-3x/hillWidth))
  // We'll animate x from 0 to hillWidth
  let start = null;
  function step(timestamp) {
    if (!start) start = timestamp;
    const elapsed = timestamp - start;
    const progress = Math.min(elapsed / duration, 1);
    const x = hillWidth * progress;
    const y = hillHeight * (1 - Math.exp(-3 * x / hillWidth));
    car2.style.left = x + "px";
    car2.style.bottom = y + "px";
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }
  // Reset car2 position
  car2.style.left = "0px";
  car2.style.bottom = "0px";
  requestAnimationFrame(step);
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
document.addEventListener('DOMContentLoaded', function() {
      const slider = document.getElementById('speed-slider');
      const label = document.getElementById('selected-speed-label');
      const btn = document.getElementById('start-hill-btn');
      let selectedSpeed = parseInt(slider.value, 10);
      slider.addEventListener('input', function() {
        selectedSpeed = parseInt(slider.value, 10);
        label.textContent = `Speed: ${selectedSpeed} mph`;
      });
      btn.addEventListener('click', function() {
        animateCar2(selectedSpeed);
      });
    });
// Start the road game when section2 is scrolled into view
const section2 = document.querySelector('.section2');
if (section2) {
  section2.innerHTML = '<div id="road-game-container" style="width: 400px; height: 500px; margin: 0 auto;"></div>';
  // Optionally, you can start the game immediately or on a button click
  startRoadGame();
}

document.addEventListener('DOMContentLoaded', function() {
  const slider = document.getElementById('speed-slider');
  const label = document.getElementById('selected-speed-label');
  const btn = document.getElementById('start-hill-btn');
  let selectedSpeed = parseInt(slider.value, 10);
  slider.addEventListener('input', function() {
    selectedSpeed = parseInt(slider.value, 10);
    label.textContent = `Speed: ${selectedSpeed} mph`;
  });
  btn.addEventListener('click', function() {
    animateCar2(selectedSpeed);
  });
});

// Prevent arrow keys and spacebar from scrolling the page
window.addEventListener('keydown', function(e) {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Spacebar"].includes(e.key)) {
    e.preventDefault();
  }
}, { passive: false });
