# Project Overview

- **Title:** TrackWIL: Work-Integrated Learning Management
- **Team:** Group 3
- **Problem:** Manual PDF/email logbook tracking loses entries and delays coordinator oversight.
- **Solution:** Web app with student logbooks, token-based mentor verification, and a coordinator dashboard.

## Technology Stack

- **Frontend / backend:** Next.js 16 (App Router, TypeScript, Server Actions)
- **Styling:** Tailwind CSS
- **Database (local demo):** JSON files in `trackwil/data/`
  - For prduction, MongoDB would be used instead of JSON files

## Setup

1. Clone the repository.
2. `cd trackwil` and run `npm install`.
3. Run `npm run dev` and open http://localhost:3000.
4. Use demo accounts documented in `trackwil/README.md`.

## Demonstration

See `trackwil/README.md` for demo accounts and the feature sequence (student entry → mentor link → coordinator dashboard).
