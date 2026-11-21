# ChronoLock — AI Countdown Lock Screen Architect

Minimalist, lock-screen-ready AI countdown studio powered by Google Gemini, hardened Node.js/Express, and WAL-mode SQLite.

## Folder Structure

- `frontend/` — Minimalistic HiDPI Canvas Studio (`index.html`, `styles.css`, `app.js`)
- `backend/` — Hardened Express API, Zod validation, cryptographic ownership tokens, and Gemini SDK integration (`server.js`, `gemini.js`, `security.js`, `db.js`)
- `database/` — Parameterized SQLite WAL schema with DB-level `CHECK` constraints (`schema.sql`)
- `docs/` — Refined Software Requirements Specification (`SRS_v2.md`)

## Quick Start (VS Code)

1. Open the `chronolock` folder in VS Code.
2. Copy `.env.example` to `.env` and add your Google AI Studio `GEMINI_API_KEY`.
3. Install dependencies and start the server:
   ```bash
   npm install
   npm start
   ```
4. Open `http://localhost:3000` in your browser.
