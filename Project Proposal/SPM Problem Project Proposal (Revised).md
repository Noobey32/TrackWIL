# Software Engineering 2: Problem Project Proposal

Research Group Dissertation & Presentation. Revised after topic acceptance (minor changes). All work finishes by 29 October 2026.

**Client:** Amenda Raganya · **Group:** Group 3 – Cape Town Campus  
**Members:** Willem Basson, Dylan Shepard, Moegammad Green, Sihle Kayise  
**Submission date:** 2 October 2026 · **Group lead:** Willem Basson (Teams liaison, milestones, repository, dissertation)

## Problem Statement

- **Domain:** Higher education administration and workplace compliance.
- **Context:** Occupational qualifications require workplace hours, workshops, and portfolios before the final external assessment. Tracking still uses PDF forms, emailed spreadsheets, and physical sign-offs.
- **Core problem:** Entries are lost or unverified, at-risk students are noticed late, coordinators have no live view, and audits are slow. An LMS grades classwork and does not verify host employers. Dedicated placement systems (Chapter 2) assume a full university rollout.
- **Solution:** TrackWIL, a role-based web app. Core product: logbook entry, secure token verification, and a coordinator dashboard. Analytics, bulk exports, and audit logs are stretch goals, and only if the core is finished before 29 October 2026.
- **Data:** Questionnaires, time-on-task comparisons, and usability tests with staff and students. No personal information is collected until written campus permission, and it is protected under POPIA.

## Stakeholders, Core Product, and Stretch Goals

- **Students:** Log tasks, upload evidence, and see hours completed. **Host employers:** Sign off from a secure link, with no account. **Coordinators:** See on-track, awaiting verification, and overdue logbooks.
- **Core:** (1) logbook entry with evidence and hour progress; (2) a time-limited token so the employer verifies without an account; (3) the coordinator dashboard.
- **Stretch, only after the core works and only before 29 October:** analytics beyond the dashboard, bulk compliance exports, and an audit log.

## Chapter 2: Existing WIL and Placement Tools

Record hours, have the host verify them, and show the coordinator who is behind. Existing tools already do this. TrackWIL keeps those three jobs and removes the account and licence burden on the host employer.

| Tool | Logbook | Employer check | Coordinator view | Limit for this project |
| --- | --- | --- | --- | --- |
| PDF, email, paper | Form or sheet | Physical or email sign-off | Manual collation | Current process; entries get lost |
| Moodle (LMS) | Assignment upload | Needs an enrolled account | Gradebook | Built for classroom grading |
| InPlace | Student Log Book | Supervisor portal account | Portal and analytics | Licensed university WIL suite |
| SONIA | Timesheets | Mentor account | Placement console | Built for a placement office |
| PebblePad | Workbook activity log | External assessor access | Workbook reports | Portfolio, not hour compliance |
| **TrackWIL** | Entry and evidence | Token link, no account | Status and overdue flags | Core product for this window |

InPlace, SONIA, and PebblePad show that digital sign-off is established practice, and that it comes with licences, portals, and a mentor account. This campus is still manual, so TrackWIL delivers the three core jobs by 29 October 2026. Analytics, bulk export, and audit history stay on the stretch list.

## Methodology (ends 29 October 2026)

Hybrid Agile-Scrum and a 4+1 view. The week 1–7 plan ran past the window and is replaced below. Build is 3-tier: relational database, REST API with role-based access, responsive web frontend. GitHub holds the code and board. Nothing is scheduled after 29 October 2026.

- **2–8 October — Requirements.** Confirm core and stretch. UML use cases and activity diagrams. No personal data until written campus permission; use synthetic examples until then.
- **9–15 October — Sprint 1.** Logbook entry: create, view, evidence, hours completed.
- **16–22 October — Sprint 2.** Expiring token, employer sign-off, coordinator dashboard. Stretch work only if the core is already demonstrable.
- **23–29 October — Test and submit.** Tests of the three core features. SUS and time-on-task only with consent after permission; otherwise synthetic data, stated in the report. Dissertation, including this chapter, and presentation.

## Personal Information (POPIA)

Written campus permission comes before any staff or student data is collected. Topic approval is not that permission. Participation is voluntary; people are told the purpose and that only the group and the supervising lecturer see the data. Only what the core evaluation needs is kept, in access-controlled storage. Demonstrations use synthetic data and tokens expire. Personal information is deleted after the result is finalised, unless the campus sets another period. If permission is late or refused, the build uses synthetic data and the dissertation says so.
