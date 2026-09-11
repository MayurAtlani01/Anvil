# Anvil — AI-Powered Learning Assistant (Chrome Extension)

Anvil is a serious, high-density Manifest V3 Chrome Extension built with React 18, TypeScript, Tailwind CSS, Vite, CRXJS, and Zustand.

Operates with **100% real application state and user-generated data**.

---

## 🚀 Key Highlights & Architecture

- **Manifest V3 Architecture**: Fully compliant with native `chrome.sidePanel`, lightweight `action` popup, background service worker, and Shadow DOM isolated content script.
- **Three Assistant Modes**:
  1. **Reading Mode**: Real in-page annotations, persistent colored highlights, native Web Speech API TTS player with speed controls (0.8x–1.5x), real dictionary definitions via the Free Dictionary API, and user-generated page notes.
  2. **Interview Mode**: Practice tracks, session runner for user answers, and resume matcher with clean backend API connection points.
  3. **Exam Mode**: User-managed and API-connected Previous Year Questions (PYQs), formula bank with variable definitions, and revision notes.
- **Shared Unified Subsystems**:
  - **SuperMemo SM-2 Spaced Repetition**: Flashcard review queue with interval and ease factor calculation on real user-created cards.
  - **Unified Bookmarks**: Cross-mode bookmarking with content-type differentiation.
  - **Real Study Analytics**: Incremental study duration, active streaks, and cards mastered.
- **Clean Backend Seam**: TypeScript API interfaces (`src/services/api/`) backed by persistent Chrome Extension storage (`src/services/storage/` + `chrome.storage.local`), swappable with backend endpoints via the Settings modal.

---

## 🛠️ Quick Start

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Or run with HMR live reload
npm run dev
```

### Load in Chrome
1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` directory.
