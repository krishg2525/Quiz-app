// app.js - Plain JS Quiz with dynamic loading + instant feedback

// Elements
const startCard = document.getElementById("start-card");
const quizCard = document.getElementById("quiz-card");
const resultCard = document.getElementById("result-card");

const startBtn = document.getElementById("start-btn");
const loadBtn = document.getElementById("load-btn");
const questionText = document.getElementById("question-text");
const choicesDiv = document.getElementById("choices");
const nextBtn = document.getElementById("next-btn");
const skipBtn = document.getElementById("skip-btn");
const feedback = document.getElementById("feedback");
const progressEl = document.getElementById("progress");
const scoreEl = document.getElementById("score");

const resultText = document.getElementById("result-text");
const breakdown = document.getElementById("breakdown");
const retryBtn = document.getElementById("retry-btn");
const startOverBtn = document.getElementById("start-over-btn");

let questions = []; // loaded questions
let currentIndex = 0;
let score = 0;
let answeredCount = 0;
let answeredLog = []; // record of answers

// Sample fallback questions (used if fetch fails)
const FALLBACK_QUESTIONS = [
  {
    id: 1,
    text: "What is the output of: console.log(typeof []);",
    choices: ["'object'", "'array'", "'list'", "'undefined'"],
    correctIndex: 0,
    explanation: "In JS arrays are objects; typeof returns 'object'.",
  },
  {
    id: 2,
    text: "Which HTTP status means 'Not Found'?",
    choices: ["200", "301", "404", "500"],
    correctIndex: 2,
    explanation: "404 indicates resource not found.",
  },
  {
    id: 3,
    text: "Which method adds an item to the end of an array?",
    choices: ["push()", "pop()", "shift()", "unshift()"],
    correctIndex: 0,
    explanation: "push() appends to the array's end.",
  },
];

// UTIL: shuffle array
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Load questions from questions.json (expects array of objects)
async function loadQuestionsFromFile(url = "questions.json") {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Network response not ok");
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0)
      throw new Error("Invalid data");
    return data;
  } catch (err) {
    console.warn("Loading failed, using fallback questions.", err);
    return FALLBACK_QUESTIONS;
  }
}

// Initialize quiz state
function initQuiz(qs) {
  questions = shuffle(qs); // randomize questions order
  currentIndex = 0;
  score = 0;
  answeredCount = 0;
  answeredLog = [];
  updateMeta();
  showCard("quiz");
  renderQuestion();
}

// UI helpers
function showCard(which) {
  startCard.classList.add("hidden");
  quizCard.classList.add("hidden");
  resultCard.classList.add("hidden");
  if (which === "start") startCard.classList.remove("hidden");
  if (which === "quiz") quizCard.classList.remove("hidden");
  if (which === "result") resultCard.classList.remove("hidden");
}

function updateMeta() {
  progressEl.textContent = `Question ${Math.min(
    currentIndex + 1,
    questions.length
  )} / ${questions.length}`;
  scoreEl.textContent = `Score: ${score}`;
}

// Render question and choices
function renderQuestion() {
  feedback.textContent = "";
  nextBtn.disabled = true;
  skipBtn.disabled = false;

  const q = questions[currentIndex];
  if (!q) {
    showResults();
    return;
  }
  questionText.textContent = q.text;
  choicesDiv.innerHTML = "";

  q.choices.forEach((choice, idx) => {
    const btn = document.createElement("div");
    btn.className = "choice";
    btn.tabIndex = 0;
    btn.textContent = choice;
    btn.dataset.index = idx;
    btn.addEventListener("click", () => handleChoiceSelect(idx));
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleChoiceSelect(idx);
    });
    choicesDiv.appendChild(btn);
  });

  updateMeta();
}

// Handle choice selection with instant feedback
function handleChoiceSelect(selectedIdx) {
  const q = questions[currentIndex];

  // disable further selection
  Array.from(choicesDiv.children).forEach((c) => c.classList.add("disabled"));

  const choiceElems = choicesDiv.children;
  const correctIdx = q.correctIndex;
  // mark correct and wrong
  for (let i = 0; i < choiceElems.length; i++) {
    const el = choiceElems[i];
    if (parseInt(el.dataset.index, 10) === correctIdx) {
      el.classList.add("correct");
    }
    if (
      parseInt(el.dataset.index, 10) === selectedIdx &&
      selectedIdx !== correctIdx
    ) {
      el.classList.add("wrong");
    }
  }

  // feedback text
  if (selectedIdx === correctIdx) {
    feedback.style.color = "var(--correct)";
    feedback.textContent = "Correct! " + (q.explanation || "");
    score += 1;
  } else {
    feedback.style.color = "var(--wrong)";
    feedback.textContent =
      "Wrong. " +
      (q.explanation
        ? q.explanation
        : `Correct answer: ${q.choices[correctIdx]}`);
  }

  answeredCount++;
  answeredLog.push({
    questionId: q.id ?? currentIndex,
    chosen: selectedIdx,
    correct: selectedIdx === correctIdx,
    question: q.text,
    correctAnswer: q.choices[correctIdx],
  });

  nextBtn.disabled = false;
  skipBtn.disabled = true;
  updateMeta();
}

// Next question or finish
function nextQuestion() {
  currentIndex++;
  if (currentIndex >= questions.length) {
    showResults();
  } else {
    renderQuestion();
  }
}

// Skip question (counts as unanswered)
function skipQuestion() {
  // log it as skipped
  const q = questions[currentIndex];
  answeredLog.push({
    questionId: q.id ?? currentIndex,
    skipped: true,
    question: q.text,
  });
  currentIndex++;
  if (currentIndex >= questions.length) showResults();
  else renderQuestion();
}

// Show final result
function showResults() {
  showCard("result");
  const total = questions.length;
  resultText.textContent = `You scored ${score} out of ${total} (${Math.round(
    (score / total) * 100
  )}%)`;
  // breakdown: top 5 recent answers
  breakdown.innerHTML = "";
  const list = document.createElement("ul");
  answeredLog.forEach((a, i) => {
    const li = document.createElement("li");
    if (a.skipped) {
      li.textContent = `Q${i + 1}: Skipped — ${a.question}`;
    } else {
      li.textContent = `Q${i + 1}: ${a.correct ? "Correct" : "Wrong"} — ${
        a.question
      } ${a.correct ? "" : `(Correct: ${a.correctAnswer})`}`;
    }
    list.appendChild(li);
  });
  breakdown.appendChild(list);
}

// Event listeners
startBtn.addEventListener("click", () => {
  initQuiz(FALLBACK_QUESTIONS);
});

loadBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  loadBtn.disabled = true;
  const loaded = await loadQuestionsFromFile("questions.json");
  startBtn.disabled = false;
  loadBtn.disabled = false;
  initQuiz(loaded);
});

nextBtn.addEventListener("click", () => nextQuestion());
skipBtn.addEventListener("click", () => skipQuestion());
retryBtn.addEventListener("click", () => {
  // replay same set
  currentIndex = 0;
  score = 0;
  answeredCount = 0;
  answeredLog = [];
  renderQuestion();
  showCard("quiz");
});
startOverBtn.addEventListener("click", () => {
  showCard("start");
});

// Allow starting by pressing Enter on start card
startCard.addEventListener("keydown", (e) => {
  if (e.key === "Enter") startBtn.click();
});

// Start view
showCard("start");
