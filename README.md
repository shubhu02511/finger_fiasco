# Finger Fiasco – Typing Game

A fast, minimalist typing game built with plain HTML, CSS, and JavaScript. Choose a duration and difficulty, then type each word and press space. The HUD shows live WPM, accuracy, and score; your best WPM is saved locally.

## Features
- Adjustable session length: 30s, 60s, 120s
- Difficulty levels: Easy, Medium, Hard (larger and trickier vocabulary)
- Live stats: time, WPM, accuracy, score, best WPM (stored in `localStorage`)
- Visual feedback per letter: correct, wrong, pending
- Scroll-contained word list that auto-centers the current word
- Responsive UI with a clean, accessible design
- Zero dependencies; works entirely offline

## How to run
Pick one of the options below.

### Option A: Open directly (no server)
1. Download/clone the project.
2. Open `index.html` in your browser.

### Option B: Run a local server (optional)
Python:
```powershell
python -m http.server 8000
```
Open `http://localhost:8000/`.

Node (npx):
```powershell
npx serve -l 8000
```
Open `http://localhost:8000/`.

## How to play
1. Select duration and difficulty.
2. Click Start.
3. Type the highlighted word and press space to submit it.
4. Keep going until the timer ends. Click Restart to try again.

## Project structure
```
finger/
  index.html  # App markup and script/style includes
  style.css   # Theme and layout
  script.js   # Game logic, word generation, HUD, timers
```

## Customize
- Words: edit `DEFAULT_WORDS`, `MEDIUM_EXTRA`, `HARD_EXTRA` in `script.js`.
- Total generated words: change `totalToGenerate` in `populateWords()`.
- Theme: tweak CSS variables in `:root` inside `style.css`.

## Tech stack
- HTML5, CSS3, Vanilla JavaScript
- No frameworks, build tools, or external runtime dependencies

## Contact
- Phone: `7752993275`
- LinkedIn: https://www.linkedin.com/in/shubham-chaurasiya-5a64812b2/
- Email: shubhamchaurasiya095@gmail.com
