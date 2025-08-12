/* Finger Fiasco – Inspired Typing Game */

const DEFAULT_WORDS = [
  "time", "world", "game", "fast", "type", "learn", "focus", "challenge",
  "speed", "accurate", "keyboard", "practice", "score", "timer", "random",
  "sharp", "skill", "round", "target", "clean", "mobile", "desktop",
  "script", "design", "shadow", "button", "letter", "space", "press",
  "update", "reset", "start", "finish", "record", "smooth", "sound",
  "player", "level", "hard", "easy", "medium", "number", "punctuation",
  "planet", "galaxy", "ocean", "forest", "mountain", "desert"
];

const MEDIUM_EXTRA = [
  "studio", "syntax", "browser", "pointer", "dynamic", "network", "latency",
  "storage", "render", "battery", "bundle", "module", "feature", "version"
];

const HARD_EXTRA = [
  "synchronize", "asynchronous", "characteristic", "compatibility", "architecture",
  "configuration", "microarchitecture", "bioluminescence", "interoperability"
];

function generateWordList(difficulty, size) {
  const base = [...DEFAULT_WORDS];
  if (difficulty === "medium") base.push(...MEDIUM_EXTRA);
  if (difficulty === "hard") base.push(...MEDIUM_EXTRA, ...HARD_EXTRA);
  const words = [];
  for (let i = 0; i < size; i += 1) {
    const word = base[Math.floor(Math.random() * base.length)];
    words.push(word);
  }
  return words;
}

function createWordElement(text) {
  const wordEl = document.createElement("span");
  wordEl.className = "word";
  for (const ch of text) {
    const chEl = document.createElement("span");
    chEl.className = "char pending";
    chEl.textContent = ch;
    wordEl.appendChild(chEl);
  }
  return wordEl;
}

function createWordsDom(words) {
  const frag = document.createDocumentFragment();
  for (const w of words) {
    frag.appendChild(createWordElement(w));
  }
  return frag;
}

function formatPercent(ratio) {
  return `${Math.round(ratio * 100)}%`;
}

function calculateWpm(totalTypedChars, elapsedSeconds) {
  if (elapsedSeconds <= 0) return 0;
  const words = totalTypedChars / 5;
  const minutes = elapsedSeconds / 60;
  return Math.round(words / minutes);
}

const state = {
  isRunning: false,
  config: { durationSec: 60, difficulty: "easy" },
  generatedWords: [],
  currentWordIndex: 0,
  totalTypedChars: 0,
  correctChars: 0,
  wrongChars: 0,
  remainingSec: 60,
  timerIntervalId: null
};

const elements = {
  durationSelect: document.getElementById("durationSelect"),
  difficultySelect: document.getElementById("difficultySelect"),
  startButton: document.getElementById("startButton"),
  restartButton: document.getElementById("restartButton"),
  inputField: document.getElementById("inputField"),
  wordsContainer: document.getElementById("wordsContainer"),
  timerValue: document.getElementById("timerValue"),
  wpmValue: document.getElementById("wpmValue"),
  accuracyValue: document.getElementById("accuracyValue"),
  scoreValue: document.getElementById("scoreValue"),
  bestValue: document.getElementById("bestValue")
};

function loadBestWpm() {
  const val = Number(localStorage.getItem("ff_best_wpm") || 0);
  if (Number.isFinite(val)) {
    elements.bestValue.textContent = `${val} WPM`;
  }
}

function saveBestWpm(wpm) {
  const val = Number(localStorage.getItem("ff_best_wpm") || 0);
  if (!Number.isFinite(val) || wpm > val) {
    localStorage.setItem("ff_best_wpm", String(wpm));
    elements.bestValue.textContent = `${wpm} WPM`;
  }
}

function resetState() {
  state.isRunning = false;
  state.generatedWords = [];
  state.currentWordIndex = 0;
  state.totalTypedChars = 0;
  state.correctChars = 0;
  state.wrongChars = 0;
  state.remainingSec = state.config.durationSec;
  if (state.timerIntervalId) {
    clearInterval(state.timerIntervalId);
    state.timerIntervalId = null;
  }
  elements.timerValue.textContent = String(state.config.durationSec);
  elements.wpmValue.textContent = "0";
  elements.accuracyValue.textContent = "100%";
  elements.scoreValue.textContent = "0";
  elements.wordsContainer.innerHTML = "";
  elements.inputField.value = "";
}

function populateWords() {
  const totalToGenerate = 200; // plenty for a session
  state.generatedWords = generateWordList(state.config.difficulty, totalToGenerate);
  elements.wordsContainer.appendChild(createWordsDom(state.generatedWords));
  highlightCurrentWord(0);
}

function highlightCurrentWord(index) {
  const children = elements.wordsContainer.children;
  for (let i = 0; i < children.length; i += 1) {
    children[i].classList.toggle("current", i === index);
  }
  // Ensure the current word is visible within the scrollable container
  const current = children[index];
  if (current) {
    current.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
}

function updateHud() {
  elements.timerValue.textContent = String(state.remainingSec);
  const elapsed = state.config.durationSec - state.remainingSec;
  const wpm = calculateWpm(state.totalTypedChars, Math.max(elapsed, 1));
  elements.wpmValue.textContent = String(wpm);
  const total = state.correctChars + state.wrongChars || 1;
  const accuracy = state.correctChars / total;
  elements.accuracyValue.textContent = formatPercent(accuracy);
  elements.scoreValue.textContent = String(state.correctChars);
}

function startTimer() {
  state.remainingSec = state.config.durationSec;
  elements.timerValue.textContent = String(state.remainingSec);
  state.timerIntervalId = setInterval(() => {
    state.remainingSec -= 1;
    if (state.remainingSec <= 0) {
      state.remainingSec = 0;
      stopGame();
    }
    updateHud();
  }, 1000);
}

function startGame() {
  state.config.durationSec = Number(elements.durationSelect.value);
  state.config.difficulty = elements.difficultySelect.value;
  resetState();
  populateWords();
  state.isRunning = true;
  elements.inputField.disabled = false;
  elements.inputField.focus();
  elements.startButton.disabled = true;
  elements.restartButton.disabled = false;
  startTimer();
}

function stopGame() {
  state.isRunning = false;
  if (state.timerIntervalId) {
    clearInterval(state.timerIntervalId);
    state.timerIntervalId = null;
  }
  elements.inputField.disabled = true;
  elements.startButton.disabled = false;
  elements.restartButton.disabled = true;
  const elapsed = state.config.durationSec - state.remainingSec;
  const wpm = calculateWpm(state.totalTypedChars, Math.max(elapsed, 1));
  saveBestWpm(wpm);
}

function onSpace() {
  const typed = elements.inputField.value.trim();
  const currentWord = state.generatedWords[state.currentWordIndex] || "";
  const wordEl = elements.wordsContainer.children[state.currentWordIndex];
  const chars = wordEl ? wordEl.querySelectorAll(".char") : [];

  for (let i = 0; i < currentWord.length; i += 1) {
    const typedChar = typed[i];
    const correctChar = currentWord[i];
    const el = chars[i];
    if (!el) continue;
    if (typedChar == null) {
      el.classList.remove("correct", "wrong");
      el.classList.add("pending");
      continue;
    }
    el.classList.remove("pending");
    if (typedChar === correctChar) {
      el.classList.add("correct");
      el.classList.remove("wrong");
    } else {
      el.classList.add("wrong");
      el.classList.remove("correct");
    }
  }

  let wordCorrect = typed.length === currentWord.length;
  for (let i = 0; i < Math.max(typed.length, currentWord.length); i += 1) {
    if (typed[i] !== currentWord[i]) {
      wordCorrect = false;
      break;
    }
  }

  state.totalTypedChars += typed.length;
  let correct = 0;
  for (let i = 0; i < Math.min(typed.length, currentWord.length); i += 1) {
    if (typed[i] === currentWord[i]) correct += 1;
  }
  state.correctChars += correct;
  state.wrongChars += typed.length - correct + Math.max(0, currentWord.length - typed.length);

  state.currentWordIndex += 1;
  elements.inputField.value = "";
  highlightCurrentWord(state.currentWordIndex);
  updateHud();
}

function onInput() {
  if (!state.isRunning) return;
  const typed = elements.inputField.value;
  const currentWord = state.generatedWords[state.currentWordIndex] || "";
  const wordEl = elements.wordsContainer.children[state.currentWordIndex];
  const chars = wordEl ? wordEl.querySelectorAll(".char") : [];

  // live feedback on current word
  for (let i = 0; i < currentWord.length; i += 1) {
    const el = chars[i];
    if (!el) continue;
    const typedChar = typed[i];
    if (typedChar == null) {
      el.classList.remove("correct", "wrong");
      el.classList.add("pending");
    } else if (typedChar === currentWord[i]) {
      el.classList.add("correct");
      el.classList.remove("wrong", "pending");
    } else {
      el.classList.add("wrong");
      el.classList.remove("correct", "pending");
    }
  }

  if (typed.endsWith(" ")) {
    onSpace();
  }
}

elements.startButton.addEventListener("click", startGame);
elements.restartButton.addEventListener("click", () => {
  resetState();
  populateWords();
  elements.inputField.disabled = false;
  elements.inputField.focus();
  elements.startButton.disabled = true;
  elements.restartButton.disabled = false;
  startTimer();
});
elements.inputField.addEventListener("input", onInput);

elements.durationSelect.addEventListener("change", () => {
  state.config.durationSec = Number(elements.durationSelect.value);
  elements.timerValue.textContent = String(state.config.durationSec);
});

elements.difficultySelect.addEventListener("change", () => {
  state.config.difficulty = elements.difficultySelect.value;
});

loadBestWpm();
resetState();

