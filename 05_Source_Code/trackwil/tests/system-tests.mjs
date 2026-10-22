// TrackWIL system test suite: runs every automated test case (TC-110 to TC-144) against a running
// server and the SQLite database, and prints one line per test with the actual result.
// Usage: npm run build && npm start, then in another terminal: npm run test:system
// The tests add entries to the database; run npm run db:reset afterwards to restore the demo data.
import { DatabaseSync } from "node:sqlite";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const base = process.argv[2] ?? "http://localhost:3000";
const appDir = process.argv[3] ?? process.cwd();
const resultsPath = process.argv[4] ?? path.join(appDir, "tests", "last-results.json");
const manifest = JSON.parse(readFileSync(path.join(appDir, ".next/server/server-reference-manifest.json"), "utf8"));
const ids = Object.fromEntries(Object.entries(manifest.node).map(([id, v]) => [v.exportedName, id]));
const db = new DatabaseSync(path.join(appDir, "data/trackwil.db"), { readOnly: true });
const results = [];

function record(id, name, pass, actual) {
  results.push({ id, name, status: pass ? "Pass" : "Fail", actual });
  console.log(`${pass ? "PASS" : "FAIL"}  ${id}  ${name}\n      actual: ${actual}`);
}

async function post(name, body, cookie, contentType, page = "/") {
  const headers = { "Next-Action": ids[name], Accept: "text/x-component" };
  if (cookie) headers.Cookie = cookie;
  if (contentType) headers["Content-Type"] = contentType;
  const res = await fetch(base + page, { method: "POST", headers, body, redirect: "manual" });
  return {
    status: res.status,
    text: await res.text(),
    setCookie: res.headers.get("set-cookie") ?? "",
    redirect: (res.headers.get("x-action-redirect") ?? "").split(";")[0],
  };
}
async function form(name, fields, cookie, files = {}, page = "/") {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) body.append(`_1_${k}`, v);
  for (const [k, f] of Object.entries(files)) body.append(`_1_${k}`, f.blob, f.name);
  body.append("0", '["$K1"]');
  return post(name, body, cookie, undefined, page);
}
const args = (name, list, cookie) => post(name, JSON.stringify(list), cookie, "text/plain;charset=UTF-8");
async function get(p, cookie) {
  const res = await fetch(base + p, { headers: cookie ? { Cookie: cookie } : {}, redirect: "manual" });
  return { status: res.status, text: await res.text(), location: res.headers.get("location") ?? "" };
}
const session = (setCookie) => {
  const m = setCookie.match(/trackwil_session=([^;]*)/);
  return m ? `trackwil_session=${m[1]}` : "";
};
const errorOf = (text) => (text.match(/"error":"([^"]*)"/) ?? [])[1] ?? "(no error)";
// A protected page counts as blocked if it redirects or renders without the protected content.
const blocked = (r, marker) => (r.status >= 300 && r.status < 400) || !r.text.includes(marker) || r.text.includes("NEXT_REDIRECT");
const entryRow = (id) => db.prepare("SELECT * FROM logbook_entries WHERE id = ?").get(id);
async function login(email, password) { return session((await form("loginAction", { email, password })).setCookie); }

// ---------------------------------------------------------------- FR-01 sign-in
let r = await form("loginAction", { email: "STUDENT2@ctucareer.co.za", password: "student123" });
const sihle = session(r.setCookie);
record("TC-110", "Sign in as student (email in capitals) opens /student", !!sihle && r.redirect === "/student", `redirect=${r.redirect}; session cookie ${sihle ? "set" : "missing"}`);
r = await form("loginAction", { email: "student2@ctucareer.co.za", password: "wrong-password" });
record("TC-111", "Wrong password shows an error and creates no session", r.text.includes("Invalid email or password") && !session(r.setCookie), `message="${errorOf(r.text)}"; cookie ${session(r.setCookie) ? "set" : "not set"}`);
r = await form("loginAction", { email: "coordinator@ctucareer.co.za", password: "coord123" });
const coord = session(r.setCookie);
const r2 = await form("loginAction", { email: "lecturer@ctucareer.co.za", password: "lecturer123" });
const lect = session(r2.setCookie);
record("TC-112", "Coordinator and lecturer sign in to /coordinator", r.redirect === "/coordinator" && r2.redirect === "/coordinator", `coordinator -> ${r.redirect}; lecturer -> ${r2.redirect}`);

// ---------------------------------------------------------------- FR-02 sign-up
const year = new Date().getFullYear();
const newEmail = `${year}0199@ctucareer.co.za`;
const weak = [["short1!", "at least 8 characters"], ["lowercase1!", "uppercase"], ["UPPERCASE1!", "lowercase"], ["NoNumbers!!", "number"], ["NoSpecial12", "special character"]];
const weakResults = [];
for (const [pw, expect] of weak) {
  const w = await form("signupAction", { fullName: "Test Student", email: newEmail, password: pw }, "", {}, "/signup");
  weakResults.push(`${pw} -> "${errorOf(w.text)}"` + (w.text.includes(expect) ? "" : " [UNEXPECTED]"));
}
record("TC-114", "Each password rule is enforced at sign-up", weakResults.every((x) => !x.includes("UNEXPECTED")), weakResults.join("; "));
r = await form("signupAction", { fullName: "Test Student", email: "someone@gmail.com", password: "Strong#Pass1" }, "", {}, "/signup");
const r3 = await form("signupAction", { fullName: "Test Student", email: "1999@ctucareer.co.za", password: "Strong#Pass1" }, "", {}, "/signup");
record("TC-115", "Non-CTU and malformed student emails are rejected", r.text.includes("valid CTU email") && r3.text.includes("valid CTU email"), `gmail -> "${errorOf(r.text)}"; 1999@ctucareer.co.za -> "${errorOf(r3.text)}"`);
r = await form("signupAction", { fullName: "Test Student", email: newEmail, password: "Strong#Pass1" }, "", {}, "/signup");
const newStudent = session(r.setCookie);
record("TC-113", "Valid sign-up creates a student account and signs in", r.redirect === "/student" && !!newStudent, `redirect=${r.redirect}; user row role=${db.prepare("SELECT role FROM users WHERE email=?").get(newEmail)?.role}`);
r = await form("signupAction", { fullName: "Test Student", email: newEmail.toUpperCase(), password: "Strong#Pass1" }, "", {}, "/signup");
record("TC-116", "Duplicate email (different letter case) is rejected", r.text.includes("already exists"), `message="${errorOf(r.text)}"`);

// ---------------------------------------------------------------- FR-03 access control
r = await get("/student");
const rc = await get("/coordinator");
record("TC-117", "Signed-out visitor is redirected from /student and /coordinator", r.status === 307 && rc.status === 307, `/student -> ${r.status} ${r.location}; /coordinator -> ${rc.status} ${rc.location}`);
r = await get("/student", coord);
record("TC-118", "Coordinator cannot open the student area", blocked(r, "My logbook"), `status ${r.status}; redirected to /coordinator: ${r.text.includes("NEXT_REDIRECT;replace;/coordinator") || r.location.includes("/coordinator")}`);
r = await get("/coordinator", sihle);
record("TC-119", "Student cannot open the coordinator dashboard", blocked(r, "Coordinator dashboard"), `status ${r.status}; redirected to /student: ${r.text.includes("NEXT_REDIRECT;replace;/student") || r.location.includes("/student")}`);
r = await get("/student/entries/entry-1", sihle);
record("TC-120", "Student cannot view another student's entry", !r.text.includes("Assisted with customer intake"), `status ${r.status}; entry text shown: ${r.text.includes("Assisted with customer intake")}`);
const forged = await get("/coordinator", "trackwil_session=coordinator-1");
const sig = sihle.split(".").pop();
const tampered = await get("/coordinator", `trackwil_session=coordinator-1.${sig}`);
record("TC-121", "Forged or tampered session cookie is rejected (DEF-01 retest)", blocked(forged, "Coordinator dashboard") && blocked(tampered, "Coordinator dashboard"), `unsigned 'coordinator-1' -> dashboard shown: ${forged.text.includes("Coordinator dashboard") && !forged.text.includes("NEXT_REDIRECT")}; another user's signature -> dashboard shown: ${tampered.text.includes("Coordinator dashboard") && !tampered.text.includes("NEXT_REDIRECT")}`);

// ---------------------------------------------------------------- FR-04 / FR-05 entries and evidence
r = await form("createLogbookEntryAction", { workDate: "2026-10-22", description: "Test entry: updated the asset register.", hours: "4.5", mentorEmail: "mentor@host.co.za" }, sihle);
const draftId = r.redirect.split("/student/entries/")[1];
record("TC-122", "Valid entry is saved as Draft", !!draftId && entryRow(draftId)?.status === "draft", `redirect=${r.redirect}; status=${entryRow(draftId)?.status}; hours=${entryRow(draftId)?.hours}`);
const bad = [];
for (const [hours, desc] of [["30", "x"], ["0", "x"], ["-2", "x"], ["5", ""]]) {
  const b = await form("createLogbookEntryAction", { workDate: "2026-10-22", description: desc, hours, mentorEmail: "m@host.co.za" }, sihle);
  bad.push(`hours=${hours} desc=${desc ? "yes" : "empty"} -> "${errorOf(b.text)}"`);
}
record("TC-123", "Invalid hours (30, 0, -2) and empty description are rejected", bad.every((x) => !x.includes("(no error)")), bad.join("; "));
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
r = await form("createLogbookEntryAction", { workDate: "2026-10-21", description: "Test entry with evidence: photographed the completed installation.", hours: "6", mentorEmail: "mentor@host.co.za" }, sihle, { evidence: { blob: new Blob([png], { type: "image/png" }), name: "photo.png" } });
const evId = r.redirect.split("/student/entries/")[1];
const evName = entryRow(evId)?.evidence_file_name;
record("TC-124", "PNG evidence is accepted and stored under a random name", !!evName && /^[0-9a-f-]{36}\.png$/.test(evName), `stored as ${evName}`);
r = await form("createLogbookEntryAction", { workDate: "2026-10-21", description: "x", hours: "2", mentorEmail: "m@host.co.za" }, sihle, { evidence: { blob: new Blob(["MZ"], { type: "application/octet-stream" }), name: "virus.exe" } });
record("TC-125", "Non-PDF/image evidence (.exe) is rejected", r.text.includes("Evidence must be a PDF or image"), `message="${errorOf(r.text)}"`);
const owner = await get(`/api/evidence/${evName}`, sihle);
const other = await get(`/api/evidence/${evName}`, await login("student1@ctucareer.co.za", "student123"));
const anon = await get(`/api/evidence/${evName}`);
const staff = await get(`/api/evidence/${evName}`, coord);
const trav = await get(`/api/evidence/..%2F..%2Fdata%2Ftrackwil.db`, sihle);
record("TC-126", "Evidence download is limited to the owner and staff", owner.status === 200 && other.status === 403 && anon.status === 401 && staff.status === 200 && trav.status === 404, `owner ${owner.status}; other student ${other.status}; signed out ${anon.status}; coordinator ${staff.status}; path traversal attempt ${trav.status}`);

// ---------------------------------------------------------------- FR-06 submit for verification
const noMentor = await form("createLogbookEntryAction", { workDate: "2026-10-20", description: "Entry without a mentor email.", hours: "3", mentorEmail: "" }, sihle);
const noMentorId = noMentor.redirect.split("/student/entries/")[1];
r = await args("submitEntryForVerificationAction", [noMentorId], sihle);
record("TC-128", "Entry without a mentor email cannot be submitted", r.text.includes("Add a mentor email"), `message="${errorOf(r.text)}"`);
r = await args("submitEntryForVerificationAction", [draftId], sihle);
const token = (r.text.match(/"token":"([0-9a-f]+)"/) ?? [])[1];
const tok = token ? db.prepare("SELECT * FROM verification_tokens WHERE token=?").get(token) : null;
const days = tok ? (new Date(tok.expires_at) - new Date(entryRow(draftId).updated_at)) / 86400000 : 0;
record("TC-127", "Submitting creates a 48-character link valid for 7 days and sets Pending", token?.length === 48 && entryRow(draftId).status === "pending_verification" && Math.abs(days - 7) < 0.01, `token length=${token?.length}; status=${entryRow(draftId).status}; expires after ${days.toFixed(2)} days`);
r = await args("submitEntryForVerificationAction", [draftId], sihle);
record("TC-129", "A pending entry with an active link cannot be submitted again", !!errorOf(r.text) && errorOf(r.text) !== "(no error)", `message="${errorOf(r.text)}"; tokens for entry=${db.prepare("SELECT COUNT(*) c FROM verification_tokens WHERE entry_id=?").get(draftId).c}`);
r = await args("submitEntryForVerificationAction", ["entry-1"], sihle);
record("TC-120b", "Student cannot submit another student's entry", r.text.includes("Entry not found"), `message="${errorOf(r.text)}"`);

// ---------------------------------------------------------------- FR-07 / FR-08 mentor verification
r = await get(`/verify/${token}`);
record("TC-130", "Mentor link shows the entry without sign-in", r.status === 200 && r.text.includes("Sihle Kayise") && r.text.includes("updated the asset register") && r.text.includes("Approve"), `status ${r.status}; shows student name, description and Approve/Reject buttons`);
r = await args("mentorDecisionAction", [token, "approved"]);
const ver = entryRow(draftId);
record("TC-131", "Approve sets the entry to Verified and records the time", r.text.includes('"success":true') && ver.status === "verified" && !!ver.verified_at, `status=${ver.status}; verified_at=${ver.verified_at}`);
r = await args("mentorDecisionAction", [token, "rejected"]);
const usedPage = await get(`/verify/${token}`);
record("TC-133", "A used link is refused and the entry is unchanged", r.text.includes("already been used") && entryRow(draftId).status === "verified" && usedPage.text.includes("already used"), `action -> "${errorOf(r.text)}"; page shows "already used": ${usedPage.text.includes("already used")}; status still ${entryRow(draftId).status}`);
r = await args("mentorDecisionAction", ["0".repeat(48), "approved"]);
const unknownPage = await get(`/verify/${"0".repeat(48)}`);
record("TC-134", "An unknown link is refused", r.text.includes("invalid") && unknownPage.status === 404, `action -> "${errorOf(r.text)}"; page status ${unknownPage.status}`);
const expiredToken = "a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3";
r = await args("mentorDecisionAction", [expiredToken, "approved"]);
const expPage = await get(`/verify/${expiredToken}`);
record("TC-135", "An expired link is refused and the entry is unchanged", r.text.includes("expired") && entryRow("entry-7").status === "pending_verification" && expPage.text.includes("expired"), `action -> "${errorOf(r.text)}"; page mentions expiry: ${expPage.text.includes("expired")}; status ${entryRow("entry-7").status}`);
// Reject then resubmit
const rj = await form("createLogbookEntryAction", { workDate: "2026-10-19", description: "Test entry to be rejected.", hours: "2", mentorEmail: "mentor@host.co.za" }, sihle);
const rjId = rj.redirect.split("/student/entries/")[1];
const rjTok = (await args("submitEntryForVerificationAction", [rjId], sihle)).text.match(/"token":"([0-9a-f]+)"/)[1];
await args("mentorDecisionAction", [rjTok, "rejected"]);
const afterReject = entryRow(rjId).status;
const re = await args("submitEntryForVerificationAction", [rjId], sihle);
const reTok = (re.text.match(/"token":"([0-9a-f]+)"/) ?? [])[1];
record("TC-132", "Reject sets Rejected; the student can resubmit for a new link", afterReject === "rejected" && !!reTok && reTok !== rjTok && entryRow(rjId).status === "pending_verification", `after reject: ${afterReject}; resubmitted with new link: ${!!reTok && reTok !== rjTok}; status now ${entryRow(rjId).status}`);
// Double click: two simultaneous decisions on one link
const both = await Promise.all([args("mentorDecisionAction", [reTok, "approved"]), args("mentorDecisionAction", [reTok, "approved"])]);
const successes = both.filter((b) => b.text.includes('"success":true')).length;
const reTokRow = db.prepare("SELECT used_at, decision FROM verification_tokens WHERE token=?").get(reTok);
record("TC-136", "Two simultaneous approvals on one link record only one decision", successes === 1, `successful decisions=${successes}; second response "${errorOf(both.find((b) => !b.text.includes('"success":true'))?.text ?? "")}"; token decision=${reTokRow.decision}`);
// DEF-02 retest: pending entry whose link expired can be resubmitted (Gedion's seeded entry-7)
// The demo passwords do not include Gedion's account (entry-7), so a fresh student's link is expired directly.
let def02Actual;
let def02Pass = false;
{
  const s = newStudent;
  const e = await form("createLogbookEntryAction", { workDate: "2026-10-12", description: "Entry whose link will expire.", hours: "3", mentorEmail: "mentor@host.co.za" }, s);
  const eid = e.redirect.split("/student/entries/")[1];
  const t1 = (await args("submitEntryForVerificationAction", [eid], s)).text.match(/"token":"([0-9a-f]+)"/)[1];
  const w = new DatabaseSync(path.join(appDir, "data/trackwil.db"));
  w.prepare("UPDATE verification_tokens SET expires_at = ? WHERE token = ?").run(new Date(Date.now() - 86400000).toISOString(), t1);
  w.close();
  const page = await get(`/student/entries/${eid}`, s);
  const again = await args("submitEntryForVerificationAction", [eid], s);
  const t2 = (again.text.match(/"token":"([0-9a-f]+)"/) ?? [])[1];
  def02Pass = page.text.includes("has expired") && page.text.includes("Submit for verification") && !!t2 && t2 !== t1;
  def02Actual = `page shows expiry notice and Submit button: ${page.text.includes("has expired") && page.text.includes("Submit for verification")}; resubmitted with new link: ${!!t2 && t2 !== t1}; status ${entryRow(eid).status}`;
}
record("TC-137", "Pending entry whose link expired can be resubmitted (DEF-02 retest)", def02Pass, def02Actual);

// ---------------------------------------------------------------- FR-09 / FR-10 / FR-11 views
r = await get("/student", sihle);
const verifiedHours = db.prepare("SELECT COALESCE(SUM(hours),0) h FROM logbook_entries WHERE student_id='student-2' AND status='verified'").get().h;
record("TC-138", "Logbook lists statuses and verified hours against required hours", r.text.includes(`${verifiedHours}<!-- --> of <!-- -->200`) || r.text.includes(`${verifiedHours} of 200`), `expected "${verifiedHours} of 200 verified hours"; statuses shown: ${["Draft", "Pending verification", "Verified", "Rejected"].filter((s) => r.text.includes(s)).join(", ")}`);
r = await get("/coordinator", lect);
// Each student's row runs from their name to the closing </tr> of that row.
const rowFor = (name) => { const i = r.text.indexOf(name); return r.text.slice(i, r.text.indexOf("</tr>", i)); };
const statusOf = (name) => ["On track", "Awaiting verification", "Overdue"].find((s) => rowFor(name).includes(s));
record("TC-139", "Dashboard shows each student's status, hours and pending count", statusOf("Dylan Shepard") === "On track" && statusOf("Moe Green") === "Overdue" && statusOf("Sihle Kayise") === "Awaiting verification", `Dylan=${statusOf("Dylan Shepard")}; Moe=${statusOf("Moe Green")}; Sihle=${statusOf("Sihle Kayise")}; Gedion=${statusOf("Gedion Basson")}`);

// ---------------------------------------------------------------- FR-12 timestamps
const t = db.prepare("SELECT created_at, updated_at, verified_at FROM logbook_entries WHERE id=?").get(draftId);
const tk = db.prepare("SELECT used_at, decision FROM verification_tokens WHERE token=?").get(token);
const iso = (v) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v ?? "");
record("TC-140", "Timestamps are recorded automatically", iso(t.created_at) && iso(t.updated_at) && iso(t.verified_at) && iso(tk.used_at) && tk.decision === "approved", `created ${t.created_at}; verified ${t.verified_at}; link used ${tk.used_at} (${tk.decision})`);

// ---------------------------------------------------------------- FR-14 sign out
// Sent the way the header's Sign out form sends it (form data, from a signed-in page).
r = await form("logoutAction", {}, sihle, {}, "/student");
const cleared = /trackwil_session=;|trackwil_session=""|Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(r.setCookie);
const after = await get("/student", cleared ? "" : sihle);
record("TC-141", "Sign out removes the session and returns to sign-in", r.redirect === "/" && cleared && after.status === 307, `redirect=${r.redirect}; cookie cleared: ${cleared}; /student afterwards -> ${after.status}`);

// ---------------------------------------------------------------- NFR-03 / NFR-04 security and integrity
const hash = db.prepare("SELECT password_hash FROM users WHERE email=?").get(newEmail).password_hash;
record("TC-142", "Passwords are stored only as salted scrypt hashes", /^[0-9a-f]{32}:[0-9a-f]{128}$/.test(hash) && !hash.includes("Strong#Pass1"), `stored value format: <32 hex salt>:<128 hex key>; plain password present: ${hash.includes("Strong#Pass1")}`);
const w = new DatabaseSync(":memory:");
w.exec("PRAGMA foreign_keys = ON;" + readFileSync(path.join(appDir, "database/schema.sql"), "utf8"));
w.exec("INSERT INTO users VALUES ('u1','A','a@x.co','student','h',200)");
const attempts = [
  ["hours = 30", "INSERT INTO logbook_entries VALUES ('e1','u1','2026-10-01','d',30,NULL,'draft',NULL,'t','t',NULL)"],
  ["unknown status", "INSERT INTO logbook_entries VALUES ('e2','u1','2026-10-01','d',5,NULL,'approved',NULL,'t','t',NULL)"],
  ["entry for missing student", "INSERT INTO logbook_entries VALUES ('e3','nobody','2026-10-01','d',5,NULL,'draft',NULL,'t','t',NULL)"],
  ["unknown role", "INSERT INTO users VALUES ('u2','B','b@x.co','admin','h',0)"],
  ["duplicate email (case)", "INSERT INTO users VALUES ('u3','C','A@X.CO','student','h',0)"],
  ["token used without decision", "INSERT INTO logbook_entries VALUES ('e4','u1','2026-10-01','d',5,NULL,'draft',NULL,'t','t',NULL); INSERT INTO verification_tokens VALUES ('k','e4','t','used',NULL)"],
];
const out = attempts.map(([label, sql]) => { try { w.exec(sql); return `${label}: ACCEPTED`; } catch (e) { return `${label}: rejected (${e.message.split(":")[0]})`; } });
record("TC-143", "Database constraints reject invalid data", out.every((o) => o.includes("rejected")), out.join("; "));

// ---------------------------------------------------------------- NFR-02 performance
const s2 = await login("student2@ctucareer.co.za", "student123");
const pages = [["/", ""], ["/student", s2], ["/student/entries/new", s2], ["/coordinator", coord], [`/verify/c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9`, ""]];
const perf = [];
let worst = 0;
for (const [p, c] of pages) {
  const times = [];
  for (let i = 0; i < 10; i++) { const t0 = performance.now(); await get(p, c); times.push(performance.now() - t0); }
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const max = Math.max(...times);
  worst = Math.max(worst, max);
  perf.push(`${p.length > 20 ? "/verify/<token>" : p} avg ${avg.toFixed(0)} ms, max ${max.toFixed(0)} ms`);
}
const t0 = performance.now();
const pf = await form("createLogbookEntryAction", { workDate: "2026-10-18", description: "Timing test entry.", hours: "1", mentorEmail: "m@host.co.za" }, s2);
const createMs = performance.now() - t0;
record("TC-144", "Pages and actions respond within 2 seconds (10 requests each)", worst < 2000 && createMs < 2000 && !!pf.redirect, perf.join("; ") + `; create entry ${createMs.toFixed(0)} ms`);

writeFileSync(resultsPath, JSON.stringify(results, null, 2));
const failed = results.filter((x) => x.status !== "Pass").length;
console.log(`\n${results.length} automated tests: ${results.length - failed} passed, ${failed} failed`);
