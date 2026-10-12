# TrackWIL (Next.js)

Capstone MVP for WIL logbook tracking: students log hours, mentors verify via a link (no account), coordinators see status at a glance.

## Setup

```bash
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

## Demo flow

1. Sign in as **student1@ctucareer.co.za** and create a logbook entry (optionally upload evidence).
2. Open the entry and **Submit for verification**, then copy the mentor link.
3. Open the link in a private window (no login) and approve or reject.
4. Sign in as **coordinator@ctucareer.co.za** to see student status (on track, awaiting verification, overdue).

## Data storage

JSON files in `data/` mirror document collections you could move to MongoDB later:

- `users.json`
- `logbook_entries.json`
- `verification_tokens.json`
- `data/uploads/`: evidence files (ignored by git except `.gitkeep`)

## Project layout

- `src/lib/`: types, JSON store, auth session, metrics
- `src/app/actions/`: server actions (login, logbook, mentor verify)
- `src/app/student/`: student dashboard and entries
- `src/app/coordinator/`: coordinator dashboard
- `src/app/verify/[token]/`: public mentor verification page

