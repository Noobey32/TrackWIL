# TrackWIL - Work-Integrated Learning Management System

TrackWIL is the SPM622 Capstone Project of Group 3 (CTU Training Solutions, Cape Town Campus). It replaces the paper, PDF and email workflow that occupational students use to keep their Work-Integrated Learning (WIL) logbooks.

## About The Project

* **Students** sign up with their CTU student email and add each of their WIL placements with the hours it requires. For each placement they record each day's work (date, description, hours), attach evidence and submit entries for verification. Each placement's logbook shows every entry's status and its verified hours against its required total.
* **Workplace mentors** verify an entry from a secure one-time link, without needing an account. The link expires after 7 days and can be used only once.
* **WIL coordinators and lecturers** see every student on one dashboard, labelled *On track*, *Awaiting verification* or *Overdue*, with verified hours and pending verifications.

## Current Submission (Week 4)

Everything for Weekly Submission 4 (23 October 2026) is in the **[Week 4 Submission](Week%204%20Submission/)** folder:

* **`Group3_Week4.pdf`**: the complete submission in one PDF.
* Numbered PDFs of each document: cover page, dissertation draft (Chapters 1 to 5 and an outline of Chapter 6), Chapters 4 and 5, Test Plan, Test Cases and Results, Defect Log, Requirements Traceability Matrix, demo script and slide outline, Individual Contribution Forms, SRS, Database Design, Weekly Progress Report, Sprint Backlog and Risk Register.
* **`Workbooks/`**: the Excel originals of the testing and project-management workbooks.

Earlier submissions are in [Week 2 Submission](Week%202%20Submission/) and [Week 3 Submission](Week%203%20Submission/).

## Running the Application

Requires **Node.js 22.13 or newer**.

```bash
cd 05_Source_Code/trackwil
npm install
npm run dev
```

Open http://localhost:3000. The SQLite database is created and filled with synthetic demonstration data on first run (`npm run db:reset` restores it).

| Role        | Email                       | Password    |
| ----------- | --------------------------- | ----------- |
| Student     | student1@ctucareer.co.za    | student123  |
| Student     | student2@ctucareer.co.za    | student123  |
| Coordinator | coordinator@ctucareer.co.za | coord123    |
| Lecturer    | lecturer@ctucareer.co.za    | lecturer123 |

**Testing:** with the app running (`npm run build`, then `npm start`), `npm run test:system` runs the 42 automated system tests. See [05_Source_Code/trackwil/README.md](05_Source_Code/trackwil/README.md) for details.

## Technologies and Architecture

* **Application:** Next.js 16 (App Router, Server Actions), React 19, TypeScript, Tailwind CSS 4
* **Database:** SQLite through Node.js's built-in `node:sqlite` module, with primary and foreign keys, CHECK constraints and transactions
* **Security:** salted scrypt password hashes, signed HttpOnly session cookies, server-side role checks, 48-character one-time verification tokens, restricted evidence uploads and downloads
* **Architecture:** three layers (presentation, Server Actions, repository and database) in a single Next.js application
* **Version control:** Git and GitHub, with name/task branches merged through pull requests

## Repository Structure

| Folder | Contents |
| ------ | -------- |
| `00_Project_Administration` | Topic acceptance, group declaration and roles, ethical clearance |
| `01_Introduction` - `03_Requirements_and_Methodology` | Chapters 1 to 3 and the Software Requirements Specification |
| `04_System_Design_and_Development` | Chapter 4, Database Design document, draw.io diagrams (with PNG exports) and UI screenshots |
| `05_Source_Code` | The TrackWIL application (`trackwil/`) |
| `06_Testing_Results_and_Evaluation` | Chapter 5, Test Plan, testing workbooks and test evidence |
| `07_Conclusion_and_Recommendations` | Chapter 6 (outline) |
| `08_Final_Dissertation` | Full dissertation draft |
| `09_Project_Management_Evidence` | Project charter, sprint backlog, risk register, weekly progress reports |
| `10_Git_and_Version_Control` | Git evidence guide |
| `11_Presentation_and_Demonstration` | Demo script and slide outline, presentation template |
| `12_Assessment` | Rubric, submission checklist, Individual Contribution Forms |
| `Week 2 Submission` - `Week 4 Submission` | The weekly submissions |

## Group Members (Group 3)

* **Willem (Gedion) Basson:** Group Lead (client contact, repository management, milestones, ethical clearance)
* **Moegammad (Moe) Green:** Development Lead
* **Dylan Shepard:** Testing / Quality Assurance
* **Sihle Kayise:** Group Member (documentation and testing)
* *All members share responsibility for design, the core build, testing, the final dissertation and the demonstration.*

## Project Milestones

* **2 October 2026:** Project proposal and topic acceptance *(done)*
* **9 October 2026:** Chapters 1 and 2, Project Charter, Ethical Clearance, GitHub repository *(done)*
* **16 October 2026:** Chapter 3, SRS, system design and development evidence *(done)*
* **23 October 2026:** Working application, Chapters 4 and 5, testing workbooks, dissertation draft, presentation plan *(current submission)*
* **29 October 2026:** Final dissertation, working application, evidence folders and live demonstration

---

*CTU Training Solutions (PTY) Ltd - Capstone Project 2026*
