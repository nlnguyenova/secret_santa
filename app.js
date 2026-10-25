
// ==========================================
// SECRET SANTA — ASSIGNMENTS
// ==========================================

const assignments = {
  "Janek": "Ludek",
  "Ludvik": "Eva",
  "Ondrej": "Imge",
  "Svetlana": "Petr",
  "Valerie": "Marie",
  "Marie": "Yuliya",
  "Sabina": "Jasper",
  "Lan": "Pepa",
  "Jirka": "Svetlana",
  "Pepa": "Andreas",
  "Elif": "Lan",
  "Imge": "Julia",
  "Yuliya": "Janek",
  "Petr": "Sabina",
  "Eva": "Ondrej",
  "Jasper": "Ludvik",
  "Andreas": "Valerie",
  "Ludek": "Jirka",
  "Julia": "Elif"
};

// Alternative spellings and nicknames.
// Each value must match a name in assignments.
const aliases = {
  "Ondřej": "Ondrej",
  "Ondra": "Ondrej",
  "Luděk": "Ludek",
  "Ludvík": "Ludvik",
  "Světlana": "Svetlana",
  "Fany": "Eva"
};

// Ignore accents, capitalisation and extra spaces.
function normalizeName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

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
    const button = document.getElementById("reveal-button");

    if (!input || !message || !resultPanel || !recipientName) {
      console.error("Secret Santa: required HTML elements are missing.");
      return;
    }

    const enteredName = normalizeName(input.value);

    // Find an alias regardless of accents or capitalisation.
    const aliasEntry = Object.entries(aliases).find(
      ([alias]) => normalizeName(alias) === enteredName
    );

    const canonicalName = aliasEntry
      ? aliasEntry[1]
      : input.value.trim();

    // Find the participant in the draw.
    const matchedName = Object.keys(assignments).find(
      name => normalizeName(name) === normalizeName(canonicalName)
    );

    if (!matchedName) {
      message.textContent =
        "Name not found. Please check the spelling and try again.";
      resultPanel.classList.add("hidden");
      return;
    }

    recipientName.textContent = assignments[matchedName];
    resultPanel.classList.remove("hidden");
    message.textContent = "";

    if (heading) heading.textContent = "Your secret is revealed!";
    if (copy) copy.textContent = "Your Secret Santa assignment is:";

    input.disabled = true;
    if (button) button.disabled = true;
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
