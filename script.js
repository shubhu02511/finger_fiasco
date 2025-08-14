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
  themeToggle: document.getElementById("themeToggle"),
  loginButton: document.getElementById("loginButton"),
  logoutButton: document.getElementById("logoutButton"),
  userDisplay: document.getElementById("userDisplay"),
  avatar: document.getElementById("avatar"),
  avatarFileInput: document.getElementById("avatarFileInput"),
  authModal: document.getElementById("authModal"),
  modalClose: document.getElementById("modalClose"),
  tabLogin: document.getElementById("tabLogin"),
  tabCreate: document.getElementById("tabCreate"),
  emailInput: document.getElementById("emailInput"),
  passwordInput: document.getElementById("passwordInput"),
  emailLoginBtn: document.getElementById("emailLoginBtn"),
  loginFacebook: document.getElementById("loginFacebook"),
  loginGoogle: document.getElementById("loginGoogle"),
  // Create account
  loginContents: document.querySelector('.login-contents'),
  createContents: document.querySelector('.create-contents'),
  createAccountBtn: document.getElementById('createAccountBtn'),
  caName: document.getElementById('caName'),
  caEmail: document.getElementById('caEmail'),
  caPassword: document.getElementById('caPassword'),
  caPassword2: document.getElementById('caPassword2'),
  inputField: document.getElementById("inputField"),
  wordsContainer: document.getElementById("wordsContainer"),
  timerValue: document.getElementById("timerValue"),
  wpmValue: document.getElementById("wpmValue"),
  accuracyValue: document.getElementById("accuracyValue"),
  scoreValue: document.getElementById("scoreValue"),
  bestValue: document.getElementById("bestValue")
};

// THEME: day/night mode with persistence and system fallback
const THEME_STORAGE_KEY = "ff_theme"; // 'light' | 'dark'
const AUTH_STORAGE_KEY = "ff_user"; // string username
const prefersLightMql = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)");

function applyTheme(theme) {
  const root = document.documentElement; // <html>
  if (theme === "light") {
    root.setAttribute("data-theme", "light");
  } else {
    root.removeAttribute("data-theme"); // defaults to dark theme values
  }
}

function updateThemeToggleUi(theme) {
  if (!elements.themeToggle) return;
  const isLight = theme === "light";
  // Show the target theme icon to indicate what clicking will switch TO
  elements.themeToggle.textContent = isLight ? "🌙" : "☀️";
  elements.themeToggle.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
  elements.themeToggle.setAttribute("title", isLight ? "Switch to dark mode" : "Switch to light mode");
  elements.themeToggle.setAttribute("aria-pressed", String(!isLight));
}

function getInitialTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return prefersLightMql && prefersLightMql.matches ? "light" : "dark";
}

function initTheme() {
  const theme = getInitialTheme();
  applyTheme(theme);
  updateThemeToggleUi(theme);
  if (elements.themeToggle) {
    elements.themeToggle.addEventListener("click", () => {
      const currentIsLight = document.documentElement.getAttribute("data-theme") === "light";
      const next = currentIsLight ? "dark" : "light";
      localStorage.setItem(THEME_STORAGE_KEY, next);
      applyTheme(next);
      updateThemeToggleUi(next);
    });
  }
  if (prefersLightMql && prefersLightMql.addEventListener) {
    prefersLightMql.addEventListener("change", (e) => {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === "light" || saved === "dark") return; // user preference wins
      const next = e.matches ? "light" : "dark";
      applyTheme(next);
      updateThemeToggleUi(next);
      // refresh avatar color if present
      const savedUser = localStorage.getItem(AUTH_STORAGE_KEY) || "";
      if (savedUser) updateAuthUi(savedUser);
    });
  }
}

function getInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// Generate a pleasant HSL color from a string
function colorFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  const saturation = 70;
  const lightness = isLight ? 55 : 42;
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

// Simple local auth mock: stores a username; swap login/logout buttons
function updateAuthUi(username) {
  if (!elements.loginButton || !elements.logoutButton || !elements.userDisplay) return;
  const isLoggedIn = Boolean(username);
  elements.loginButton.hidden = isLoggedIn;
  elements.logoutButton.hidden = !isLoggedIn;
  elements.userDisplay.textContent = isLoggedIn ? `Hi, ${username}` : "";
  if (elements.avatar) {
    if (isLoggedIn) {
      renderAvatar(username);
      elements.avatar.hidden = false;
      elements.avatar.setAttribute("aria-hidden", "false");
    } else {
      elements.avatar.hidden = true;
      elements.avatar.setAttribute("aria-hidden", "true");
      clearAvatarElement();
    }
  }
}

function initAuth() {
  const savedUser = localStorage.getItem(AUTH_STORAGE_KEY) || "";
  updateAuthUi(savedUser);
  if (elements.loginButton) {
    elements.loginButton.addEventListener("click", openAuthModal);
  }
  if (elements.logoutButton) {
    elements.logoutButton.addEventListener("click", () => {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem("ff_avatar");
      updateAuthUi("");
      openAuthModal();
    });
  }

  // Avatar interactions
  if (elements.avatar && elements.avatarFileInput) {
    elements.avatar.addEventListener("click", () => {
      if (!localStorage.getItem(AUTH_STORAGE_KEY)) return;
      elements.avatarFileInput.click();
    });
    // Right-click to remove avatar image
    elements.avatar.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      localStorage.removeItem("ff_avatar");
      const username = localStorage.getItem(AUTH_STORAGE_KEY) || "";
      if (username) renderAvatar(username);
    });
    elements.avatarFileInput.addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const dataUrl = await readFileAsDataUrl(file);
      const resized = await resizeImageToDataUrl(dataUrl, 96);
      localStorage.setItem("ff_avatar", resized);
      const username = localStorage.getItem(AUTH_STORAGE_KEY) || "";
      if (username) renderAvatar(username);
      elements.avatarFileInput.value = "";
    });
  }
  // Modal wiring
  if (elements.modalClose) elements.modalClose.addEventListener("click", closeAuthModal);
  if (elements.authModal) {
    elements.authModal.addEventListener("click", (e) => {
      if (e.target.classList && e.target.classList.contains("modal-backdrop")) {
        closeAuthModal();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !elements.authModal.hidden) closeAuthModal();
    });
  }

  if (elements.emailLoginBtn) {
    elements.emailLoginBtn.addEventListener("click", () => {
      const email = (elements.emailInput?.value || "").trim();
      const password = (elements.passwordInput?.value || "").trim();
      if (!email || !password) { alert("Please enter email and password."); return; }
      const users = JSON.parse(localStorage.getItem("ff_users") || "{}");
      if (users[email] && users[email].pass === password) {
        const displayName = users[email].name || email.split("@")[0];
        localStorage.setItem(AUTH_STORAGE_KEY, displayName);
        updateAuthUi(displayName);
        closeAuthModal();
      } else {
        alert("Invalid email or password. You can create an account on the Create Account tab.");
      }
    });
  }
  if (elements.loginFacebook) {
    elements.loginFacebook.addEventListener("click", () => {
      const name = "Facebook User";
      localStorage.setItem(AUTH_STORAGE_KEY, name);
      updateAuthUi(name);
      closeAuthModal();
    });
  }
  if (elements.loginGoogle) {
    elements.loginGoogle.addEventListener("click", () => {
      const name = "Google User";
      localStorage.setItem(AUTH_STORAGE_KEY, name);
      updateAuthUi(name);
      closeAuthModal();
    });
  }
  // Tabs and Create Account
  if (elements.tabLogin && elements.tabCreate) {
    const showLogin = () => {
      elements.tabLogin.classList.add("active");
      elements.tabLogin.setAttribute("aria-selected", "true");
      elements.tabCreate.classList.remove("active");
      elements.tabCreate.setAttribute("aria-selected", "false");
      if (elements.loginContents) elements.loginContents.hidden = false;
      if (elements.createContents) elements.createContents.hidden = true;
    };
    const showCreate = () => {
      elements.tabCreate.classList.add("active");
      elements.tabCreate.setAttribute("aria-selected", "true");
      elements.tabLogin.classList.remove("active");
      elements.tabLogin.setAttribute("aria-selected", "false");
      if (elements.loginContents) elements.loginContents.hidden = true;
      if (elements.createContents) elements.createContents.hidden = false;
    };
    elements.tabLogin.addEventListener("click", showLogin);
    elements.tabCreate.addEventListener("click", showCreate);
  }
  if (elements.createAccountBtn) {
    elements.createAccountBtn.addEventListener("click", () => {
      const name = (elements.caName?.value || "").trim();
      const email = (elements.caEmail?.value || "").trim();
      const pass = (elements.caPassword?.value || "").trim();
      const pass2 = (elements.caPassword2?.value || "").trim();
      if (!name || !email || !pass || !pass2) { alert("Please fill all fields."); return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { alert("Please enter a valid email."); return; }
      if (pass.length < 6) { alert("Password must be at least 6 characters."); return; }
      if (pass !== pass2) { alert("Passwords do not match."); return; }
      const users = JSON.parse(localStorage.getItem("ff_users") || "{}");
      if (users[email]) { alert("An account with this email already exists."); return; }
      users[email] = { name, email, pass };
      localStorage.setItem("ff_users", JSON.stringify(users));
      localStorage.setItem(AUTH_STORAGE_KEY, name);
      updateAuthUi(name);
      closeAuthModal();
    });
  }
}

function openAuthModal() {
  if (!elements.authModal) return;
  elements.authModal.hidden = false;
  elements.authModal.setAttribute("aria-hidden", "false");
  // default to Login tab
  if (elements.tabLogin && elements.tabCreate) {
    elements.tabLogin.classList.add("active");
    elements.tabLogin.setAttribute("aria-selected", "true");
    elements.tabCreate.classList.remove("active");
    elements.tabCreate.setAttribute("aria-selected", "false");
  }
  if (elements.loginContents) elements.loginContents.hidden = false;
  if (elements.createContents) elements.createContents.hidden = true;
  (elements.emailInput || {}).focus?.();
}

function closeAuthModal() {
  if (!elements.authModal) return;
  elements.authModal.hidden = true;
  elements.authModal.setAttribute("aria-hidden", "true");
}

function clearAvatarElement() {
  if (!elements.avatar) return;
  elements.avatar.textContent = "";
  elements.avatar.removeAttribute("style");
  elements.avatar.removeAttribute("title");
  const img = elements.avatar.querySelector("img");
  if (img) img.remove();
}

function renderAvatar(username) {
  if (!elements.avatar) return;
  clearAvatarElement();
  const stored = localStorage.getItem("ff_avatar");
  if (stored) {
    const img = document.createElement("img");
    img.alt = username;
    img.src = stored;
    elements.avatar.appendChild(img);
    elements.avatar.title = username;
    return;
  }
  const initials = getInitials(username);
  const color = colorFromString(username);
  elements.avatar.textContent = initials;
  elements.avatar.style.background = color;
  elements.avatar.title = username;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function resizeImageToDataUrl(dataUrl, sizePx) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = sizePx;
      canvas.height = sizePx;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(dataUrl); return; }
      // cover fit
      const scale = Math.max(sizePx / img.width, sizePx / img.height);
      const sw = sizePx / scale;
      const sh = sizePx / scale;
      const sx = (img.width - sw) / 2;
      const sy = (img.height - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sizePx, sizePx);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

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
initTheme();
initAuth();

