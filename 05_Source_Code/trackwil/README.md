# TrackWIL (Next.js)

Capstone MVP for WIL logbook tracking: students add their WIL placements, log hours and upload their WIL documents for each one, mentors verify via a link (no account), coordinators see status at a glance.

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

Sessions are signed with a secret from `TRACKWIL_SESSION_SECRET`, or a random secret generated once into `data/session-secret` (ignored by git).

## Demo flow

1. Sign in as **student1@ctucareer.co.za**. Dylan has two WIL placements (WIL 1 and WIL 2), each with its own required hours. Open **WIL 2** and create a logbook entry (optionally upload evidence), or add a new placement with **Add WIL placement**.
2. Open the entry and **Submit for verification**, then copy the mentor link.
   On the placement page, the **Documents** section shows the MOU, Commencement Letter, Code of Conduct and one Attendance Register per semester. Dylan's WIL 2 paperwork is complete; WIL 1 is missing a register, so try uploading one (PDF, PNG or JPG, up to 10 MB).
3. Open the link in a private window (no login) and approve or reject.
   A ready-made open link for Sihle's pending entry is also seeded:
   `/verify/c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9`
4. Sign in as **coordinator@ctucareer.co.za** to see student status (on track, awaiting verification, overdue) and how many documents each student is missing. Click a student's name to open their profile: every placement with its hours, documents (view only) and logbook, including mentor emails and evidence.

## Data storage

TrackWIL uses SQLite through Node's built-in `node:sqlite` module, so there is no database server to install.

- `database/schema.sql`: tables `users`, `wil_placements`, `logbook_entries`, `verification_tokens`, `placement_documents` with primary keys, foreign keys and CHECK constraints. Each entry and document belongs to a placement, and each placement to a student with its own required hours
- `database/seed.sql`: synthetic demo data (dates are relative to today, so the coordinator dashboard always shows On track, Awaiting verification and Overdue students)
- `data/trackwil.db`: the database file, created and seeded automatically on first use (ignored by git)
- `data/uploads/`: evidence files, and WIL documents in `data/uploads/documents/` (ignored by git except `.gitkeep`). Files are stored under random names; the database keeps the original name
- `database/demo-documents/`: synthetic PDFs that the seed data refers to, copied into `data/uploads/documents/` when the database is seeded

To start again from the seed data, stop the dev server and run the command below. Run it once after pulling a version that changes `database/schema.sql` (for example the change that added WIL placements); the app stops with a message asking for this if the database file is out of date. It also restores the demo documents.

```bash
npm run db:reset
```

The `data/*.json` files are the original prototype storage from the first sprint. They are kept for reference and are no longer read by the app.

## Testing

The system test suite (TC-110 to TC-166 in the Test Cases workbook) runs against a running app and the database:

```bash
npm run build
npm start                         # terminal 1
npm run test:system               # terminal 2 (pass a URL if not http://localhost:3000)
npm run db:reset                  # afterwards: the tests add entries to the database
```

## Project layout

- `database/`: SQL schema and seed scripts
- `scripts/reset-db.mjs`: rebuilds the database from those scripts
- `src/lib/`: types, SQLite connection (`db.ts`), repository, auth session, metrics
- `src/app/actions/`: server actions (login, WIL placements, logbook, documents, mentor verify)
- `src/app/student/`: student dashboard and entries
- `src/app/coordinator/`: coordinator dashboard
- `src/app/verify/[token]/`: public mentor verification page

