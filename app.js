
// ==========================================
// SECRET SANTA — TEST ASSIGNMENTS
// Change these names when you're ready!
// ==========================================

const assignments = {
  "Alice Test": "Clara Test",
  "Ben Test": "Emma Test",
  "Clara Test": "David Test",
  "David Test": "Alice Test",
  "Emma Test": "Ben Test"
};

// ==========================================
// ENVELOPE
// ==========================================

const letter = document.getElementById("letter");
const envelope = document.getElementById("envelope");
const revealForm = document.getElementById("reveal-form");

if (envelope && letter) {
  envelope.addEventListener("click", () => {
    letter.classList.add("open");
  });
}

// ==========================================
// REVEAL THE ASSIGNMENT
// ==========================================

if (revealForm) {
  revealForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const input = document.getElementById("participant-name");
    const message = document.getElementById("message");
    const resultPanel = document.getElementById("reveal-panel");
    const recipientName = document.getElementById("recipient-name");
    const heading = document.getElementById("paper-heading");
    const copy = document.getElementById("paper-copy");

    const enteredName = input.value.trim().toLowerCase();

    const matchedName = Object.keys(assignments).find(
      name => name.toLowerCase() === enteredName
    );

    if (!matchedName) {
      message.textContent =
        "We couldn't find that name. Please check the spelling and try again.";
      resultPanel.classList.add("hidden");
      return;
    }

    recipientName.textContent = assignments[matchedName];
    resultPanel.classList.remove("hidden");
    message.textContent = "";
    heading.innerHTML = "Your secret<br>is revealed!";
    copy.textContent = "Your Secret Santa assignment is:";
    input.disabled = true;

    const button = document.getElementById("reveal-button");
    button.disabled = true;
  });
}

// ==========================================
// FALLING SNOW
// ==========================================

const canvas = document.getElementById("snow");
const ctx = canvas ? canvas.getContext("2d") : null;

if (canvas && ctx) {
  let width = 0;
  let height = 0;
  let flakes = [];

  function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    const count = Math.min(100, Math.floor(width / 12));

    flakes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.5 + 0.5,
      speed: Math.random() * 1 + 0.3,
      drift: (Math.random() - 0.5) * 0.6
    }));
  }

  function drawSnow() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255, 248, 237, 0.8)";

    flakes.forEach(flake => {
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      ctx.fill();

      flake.y += flake.speed;
      flake.x += flake.drift;

      if (flake.y > height) {
        flake.y = -5;
        flake.x = Math.random() * width;
      }

      if (flake.x > width) flake.x = 0;
      if (flake.x < 0) flake.x = width;
    });

    requestAnimationFrame(drawSnow);
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  drawSnow();
}
