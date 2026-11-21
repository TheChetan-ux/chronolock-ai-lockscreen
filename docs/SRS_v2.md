# Software Requirements Specification (SRS v2.0) — ChronoLock

## 1. Functional Requirements
- **FR-2.1 (AI Milestone Planner):** `POST /api/generate` calls Google Gemini via `@google/genai` with strict JSON `responseSchema`, returning a `mantra` (<= 65 chars), `themeId`, and 4–5 backward-mapped milestones (<= 42 chars each).
- **FR-2.2 (Safe-Zone Canvas Engine):** Native HiDPI `<canvas>` renders `1080x2400` (Mobile 9:19.5) and `2560x1440` (Desktop 16:9) with top/bottom OS clock dead-zones and a toggleable overlay preview.
- **FR-2.3 (Cryptographic Sharing):** `POST /api/designs` persists sanitized state in SQLite, returning `{ slug, editToken, sharePath }`. `GET /api/designs/:slug` serves public read-only state; `PATCH /api/designs/:slug/milestones` requires a valid `X-Edit-Token`.
- **FR-2.4 (Dual Export):** Exports clean native lock screen PNGs and a `1600x900` framed showcase cover image.

## 2. Security Requirements
- **SEC-2.1 (Network & Headers):** `helmet` strict CSP (`default-src 'self'`), `X-Frame-Options: DENY`, `cors` origin lock, `16kb` JSON body limit, and sliding-window IP rate limiting.
- **SEC-2.2 (Prompt & SQL Defense):** Control-character stripping + XML-delimited prompt isolation against prompt injection; 100% parameterized SQLite statements with DB-level `CHECK` constraints.
- **SEC-2.3 (Storage Hygiene):** Hard cap of 5,000 stored designs with automatic pruning of oldest records; zero stack-trace leakage on `4xx/5xx` responses.
