# ANVIL — Testing & Verification Guide

This guide describes how to load, run, and test the **Anvil Learning Assistant** Chrome Extension with real application state.

---

## 1. Load the Unpacked Extension in Chrome

1. Open Google Chrome (or any Chromium browser: Edge, Arc, Brave).
2. Navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** (top-left button).
5. Select the `dist/` directory inside this project folder:
   ```
   c:\Users\Admin\OneDrive\Desktop\Anvil\dist
   ```
6. **Anvil — Learning Assistant** (v0.1.0) will appear in your extension list with its icon and permissions.

---

## 2. Testing Clean Real State & Features

### Surface A: Extension Popup (Quick Access)
- Click the **Anvil** icon in the Chrome toolbar.
- Shows your active assistant mode and real daily streak (starts at `0d Streak` until user activities occur).
- **Bookmark Page** button: Toggles real bookmark in persistent storage.
- **Open Full Anvil Side Panel** button: Launches native Chrome Side Panel.

### Surface B: Chrome Side Panel (Primary Study Hub)
- Click **Open Panel** or right-click any page → **Summarize Page in Anvil**.
- **Reading Mode**:
  - **TTS Player**: Click **Listen (TTS)** to read page text aloud via the browser's native Web Speech API (`speechSynthesis`).
  - **Page Notes**: Click **Add Note** to create real notes with custom tags and color tags; saved directly into `chrome.storage.local`.
- **Interview Mode**:
  - Starts in clean state without fabricated logs or fake scores.
  - Practice tracks display question counts from real user library or connected API.
  - Resume parser allows uploading real files and indexing metadata.
- **Exam Mode**:
  - Clean initial state for previous year questions, formula bank, and revision notes.
- **Top Action Modals**:
  - **Bookmarks (Bookmark Icon)**: Shows real bookmarks created by the user across pages and questions.
  - **Flashcards (Brain Icon)**: Starts empty until user creates flashcards; executes the SuperMemo SM-2 Spaced Repetition queue on real cards.
  - **Progress (Chart Icon)**: Displays "No study progress recorded yet" until user completes study actions, tracking real time and mastered cards.
  - **Settings (Gear Icon)**: Configure backend API endpoint URL and authorization tokens.

### Surface C: In-Page Content Script (Selection Toolbar & Highlights)
1. Open any web page.
2. Select any text:
   - Floating **SelectionToolbar** appears in isolated Shadow DOM.
   - **Highlight**: Creates visual highlight and saves persistent annotation.
   - **Note**: Attaches real study note.
   - **Flashcard**: Creates real flashcard in your deck.
   - **Read**: Reads selected text aloud using SpeechSynthesis.
   - **Meaning Popover**: Uses the Free Dictionary API to look up definitions dynamically.

---

## 3. Development Commands

- **Build Production Bundle**:
  ```bash
  npm run build
  ```
- **Run Live HMR Dev Server**:
  ```bash
  npm run dev
  ```
