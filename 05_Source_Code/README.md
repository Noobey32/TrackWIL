# Project Overview

- **Title:** TrackWIL: Work-Integrated Learning Management
- **Team:** Group 3
- **Problem:** Manual PDF/email logbook tracking loses entries and delays coordinator oversight.
- **Solution:** Web app with student logbooks, token-based mentor verification, and a coordinator dashboard.

## Technology Stack

- **Frontend / backend:** Next.js 16 (App Router, TypeScript, Server Actions)
- **Styling:** Tailwind CSS
- **Database:** SQLite through Node's built-in `node:sqlite` module (file: `trackwil/data/trackwil.db`)
  - Schema: `trackwil/database/schema.sql`; synthetic seed data: `trackwil/database/seed.sql`
  - The JSON files in `trackwil/data/` are the original prototype storage, kept for reference and no longer read by the app

## Setup

1. Clone the repository.
2. Install Node.js 22.13 or newer, then `cd trackwil` and run `npm install`.
3. Run `npm run dev` and open http://localhost:3000. The database is created and seeded automatically on first use.
4. Use demo accounts documented in `trackwil/README.md`.

## Demonstration

See `trackwil/README.md` for demo accounts and the feature sequence (student entry → mentor link → coordinator dashboard).
