# Project Overview

- **Title:** TrackWIL: Work-Integrated Learning Management
- **Team:** Group 3 (SPM622, CTU Training Solutions, Cape Town Campus)
- **Problem:** Manual PDF/email logbook tracking loses entries and delays coordinator oversight.
- **Solution:** A web app where students add their WIL placements (each with its own required hours), keep a logbook and upload their WIL documents for each one; mentors verify entries from a one-time link; coordinators see every student's status, hours and missing documents on one dashboard and can open a student's full profile. A placement is marked *WIL completed* and locked once its verified hours reach its required hours.

## Technology Stack

- **Frontend / backend:** Next.js 16 (App Router, TypeScript, Server Actions), React 19
- **Styling:** Tailwind CSS 4
- **Database:** SQLite through Node's built-in `node:sqlite` module (file: `trackwil/data/trackwil.db`)
  - Schema: `trackwil/database/schema.sql`; synthetic seed data: `trackwil/database/seed.sql`
  - Uploaded evidence and WIL documents are stored in `trackwil/data/uploads/`

## Setup

1. Clone the repository.
2. Install Node.js 22.13 or newer, then `cd trackwil` and run `npm install`.
3. Optionally copy `trackwil/.env.example` to `trackwil/.env.local` and set a session secret (otherwise one is generated).
4. Run `npm run dev` and open http://localhost:3000. The database is created and seeded automatically on first use.
5. Use the demo accounts documented in `trackwil/README.md`.

## Demonstration

See `trackwil/README.md` for the demo accounts and the feature sequence (student placement and entry → mentor link → coordinator dashboard → student profile).
