// =====================================
// SECRET SANTA — TEST PARTICIPANTS
// =====================================

const assignments = {
  "Alice Test": "Clara Test",
  "Ben Test": "Emma Test",
  "Clara Test": "David Test",
  "David Test": "Alice Test",
  "Emma Test": "Ben Test"
};

// =====================================
// ENVELOPE & REVEAL
// =====================================

// Find the elements on the page
const envelope = document.querySelector(".envelope");
const form = document.querySelector("form");
const nameInput = document.querySelector(
  'input[name="name"], #name, #username, input[type="text"]'
);
const revealButton = document.querySelector("button");
const result = document.querySelector(
  "#result, #recipient, .result, .recipient"
);

// Reveal the envelope when clicked
if (envelope) {
  envelope.addEventListener("click", () => {
    envelope.classList.toggle("open");
  });
}

// Handle the participant's name
function revealAssignment(event) {
  if (event) event.preventDefault();

  if (!nameInput) {
    alert("Name input not found. Check the input element in index.html.");
    return;
  }

  const enteredName = nameInput.value.trim().toLowerCase();

  const matchedName = Object.keys(assignments).find(
    name => name.toLowerCase() === enteredName
  );

  if (!matchedName) {
    alert("Name not found. Please enter your name exactly as provided.");
    return;
  }

  const recipient = assignments[matchedName];

  if (result) {
    result.textContent = `You're buying a gift for ${recipient}!`;
    result.style.display = "block";
  } else {
    alert(`You're buying a gift for ${recipient}!`);
  }
}

// Listen for form submission or button click
if (form) {
  form.addEventListener("submit", revealAssignment);
} else if (revealButton) {
  revealButton.addEventListener("click", revealAssignment);
}
