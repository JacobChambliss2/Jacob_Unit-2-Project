function runAnimation() {
  const elements = document.getElementsByClassName("section1Animate");

  for (let el of elements) {
    el.classList.remove("animate"); // Reset in case it's already applied
    void el.offsetWidth; // Force reflow to restart animation
    el.classList.add("animate");
  }
}

const playButton = document.querySelector('.play1');
playButton.addEventListener('click', runAnimation);
