const car = document.getElementById("car");
const section = document.getElementById("carSection");

const totalTime = 900;
const distance = 1100;
const acceleration = (2 * distance) / Math.pow(totalTime / 1000, 2); // a = 2d/t²

function animateCar() {
  let startTime = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const t = elapsed / 1000;
    const x = 0.5 * acceleration * t * t; //d = 0.5at²
    car.style.left = Math.min(x, distance) + "px";

    if (elapsed < totalTime) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

// Observe the section
const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCar();          
      observer.unobserve(entry.target); //only run once
    }
  });
}, {
  threshold: 0.5 // 50% of the section is visible
});

// Start observing
observer.observe(section);
