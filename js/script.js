const car = document.getElementById("car");
const section = document.getElementById("carSection");
const resultText = document.getElementById("result");
const infoText = document.getElementById("reactionInfo");

let startTime = null;
let animationFrame;
let animationRunning = false;
let lastX = 0;
let clicked = false;

const totalTime = 900; // ms
const distance = 1100; // pixels
const reactionTime = 670; // ms
const acceleration = (2 * distance) / Math.pow(totalTime / 1000, 2); // a = 2d/t²

function animateCar() {
  startTime = null;
  animationRunning = true;
  clicked = false;
  resultText.textContent = "";
  infoText.style.opacity = "0";
  car.style.left = "10px";

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const t = elapsed / 1000;
    const x = 0.5 * acceleration * t * t;

    lastX = Math.min(x, distance);
    car.style.left = lastX + "px";

    if (elapsed < totalTime && animationRunning) {
      animationFrame = requestAnimationFrame(step);
    } else {
      animationRunning = false;
      showTooLate();
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
    resultText.textContent = "Pretty fast! But you might be anticipating.";
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

// Start animation when scrolled into view
const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCar();
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.5
});

observer.observe(section);
