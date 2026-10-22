# TrackWIL (Next.js)

Capstone MVP for WIL logbook tracking: students log hours, mentors verify via a link (no account), coordinators see status at a glance.

## Setup

Requires Node.js 22.13 or newer (for the built-in `node:sqlite` module).

```bash
cd 05_Source_Code\trackwil
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo accounts (synthetic data)

| Role        | Email                       | Password   |
| ----------- | --------------------------- | ---------- |
| Student     | student1@ctucareer.co.za    | student123 |
| Student     | student2@ctucareer.co.za    | student123 |
| Coordinator | coordinator@ctucareer.co.za | coord123   |
| Lecturer    | lecturer@ctucareer.co.za    | lecturer123 |

## Demo flow

1. Sign in as **student1@ctucareer.co.za** and create a logbook entry (optionally upload evidence).
2. Open the entry and **Submit for verification**, then copy the mentor link.
3. Open the link in a private window (no login) and approve or reject.
   A ready-made open link for Sihle's pending entry is also seeded:
   `/verify/c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9`
4. Sign in as **coordinator@ctucareer.co.za** to see student status (on track, awaiting verification, overdue).

## Data storage

TrackWIL uses SQLite through Node's built-in `node:sqlite` module, so there is no database server to install.

- `database/schema.sql`: tables `users`, `logbook_entries`, `verification_tokens` with primary keys, foreign keys and CHECK constraints
- `database/seed.sql`: synthetic demo data (dates are relative to today, so the coordinator dashboard always shows On track, Awaiting verification and Overdue students)
- `data/trackwil.db`: the database file, created and seeded automatically on first use (ignored by git)
- `data/uploads/`: evidence files (ignored by git except `.gitkeep`)

To start again from the seed data, stop the dev server and run:

```bash
npm run db:reset
```

The `data/*.json` files are the original prototype storage from the first sprint. They are kept for reference and are no longer read by the app.

## Project layout

- `database/`: SQL schema and seed scripts
- `scripts/reset-db.mjs`: rebuilds the database from those scripts
- `src/lib/`: types, SQLite connection (`db.ts`), repository, auth session, metrics
- `src/app/actions/`: server actions (login, logbook, mentor verify)
- `src/app/student/`: student dashboard and entries
- `src/app/coordinator/`: coordinator dashboard
- `src/app/verify/[token]/`: public mentor verification page

