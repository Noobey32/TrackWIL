// TrackWIL system test suite: runs every automated test case (TC-110 to TC-169) against a running
// server and the SQLite database, and prints one line per test with the actual result.
// Usage: npm run build && npm start, then in another terminal: npm run test:system
// The tests add entries to the database; run npm run db:reset afterwards to restore the demo data.
import { DatabaseSync } from "node:sqlite";
import { existsSync, readFileSync, statSync, writeFileSync } from "fs";
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
// A protected page counts as blocked only if its content is absent from the response. A redirect
// alone is not enough: the body of a redirect response can still carry the page's data (DEF-07).
const blocked = (r, marker) => !r.text.includes(marker);
const entryRow = (id) => db.prepare("SELECT * FROM logbook_entries WHERE id = ?").get(id);
async function login(email, password) { return session((await form("loginAction", { email, password })).setCookie); }
const sihlePlacement = "placement-sihle-1";

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
record("TC-118", "Coordinator cannot open the student area", blocked(r, "My WIL placements"), `status ${r.status}; redirected to /coordinator: ${r.text.includes("NEXT_REDIRECT;replace;/coordinator") || r.location.includes("/coordinator")}; student page content in response: ${r.text.includes("My WIL placements")}`);
r = await get("/coordinator", sihle);
record("TC-119", "Student cannot open the coordinator dashboard", blocked(r, "Coordinator dashboard"), `status ${r.status}; redirected to /student: ${r.text.includes("NEXT_REDIRECT;replace;/student") || r.location.includes("/student")}; dashboard content in response: ${r.text.includes("Coordinator dashboard")}`);
r = await get("/student/entries/entry-1", sihle);
record("TC-120", "Student cannot view another student's entry", !r.text.includes("Assisted with customer intake"), `status ${r.status}; entry text shown: ${r.text.includes("Assisted with customer intake")}`);
const forged = await get("/coordinator", "trackwil_session=coordinator-1");
const sig = sihle.split(".").pop();
const tampered = await get("/coordinator", `trackwil_session=coordinator-1.${sig}`);
record("TC-121", "Forged or tampered session cookie is rejected (DEF-01 retest)", blocked(forged, "Coordinator dashboard") && blocked(tampered, "Coordinator dashboard"), `unsigned 'coordinator-1' -> status ${forged.status}, dashboard content in response: ${forged.text.includes("Coordinator dashboard")}; another user's signature -> status ${tampered.status}, dashboard content in response: ${tampered.text.includes("Coordinator dashboard")}`);

// ---------------------------------------------------------------- FR-15 WIL placements
const placementRow = (id) => db.prepare("SELECT * FROM wil_placements WHERE id = ?").get(id);
r = await form("createPlacementAction", { title: "WIL 1", companyName: "Test Host Company", requiredHours: "320", startDate: "2026-10-01" }, newStudent);
const newPlacementId = r.redirect.split("/student/placements/")[1];
const np = newPlacementId ? placementRow(newPlacementId) : null;
const newStudentId = db.prepare("SELECT id FROM users WHERE email=?").get(newEmail).id;
record("TC-145", "Student adds a WIL placement with its own required hours", !!np && np.required_hours === 320 && np.student_id === newStudentId, `redirect=${r.redirect}; title=${np?.title}; company=${np?.company_name}; required hours=${np?.required_hours}`);
const badPlacements = [];
for (const [fields, label] of [
  [{ title: "WIL 2", companyName: "Host", requiredHours: "0", startDate: "2026-10-01" }, "0 hours"],
  [{ title: "WIL 2", companyName: "Host", requiredHours: "-10", startDate: "2026-10-01" }, "-10 hours"],
  [{ title: "WIL 2", companyName: "Host", requiredHours: "6000", startDate: "2026-10-01" }, "6000 hours"],
  [{ title: "", companyName: "Host", requiredHours: "100", startDate: "2026-10-01" }, "no title"],
  [{ title: "WIL 2", companyName: "", requiredHours: "100", startDate: "2026-10-01" }, "no company"],
  [{ title: "WIL 2", companyName: "Host", requiredHours: "100", startDate: "" }, "no start date"],
]) {
  const b = await form("createPlacementAction", fields, newStudent);
  badPlacements.push(`${label} -> "${errorOf(b.text)}"`);
}
const extraPlacements = db.prepare("SELECT COUNT(*) c FROM wil_placements WHERE student_id = ? AND id <> ?").get(newStudentId, newPlacementId ?? "").c;
record("TC-146", "Invalid placement details are rejected", badPlacements.every((x) => !x.includes("(no error)")) && extraPlacements === 0, badPlacements.join("; ") + `; extra placements saved: ${extraPlacements}`);
await form("updatePlacementAction", { placementId: newPlacementId, title: "WIL 1", companyName: "Test Host Company", requiredHours: "300", startDate: "2026-10-01" }, newStudent);
const editedHours = placementRow(newPlacementId)?.required_hours;
const otherEdit = await form("updatePlacementAction", { placementId: sihlePlacement, title: "Taken over", companyName: "X", requiredHours: "1", startDate: "2026-10-01" }, newStudent);
record("TC-147", "Student can edit their own placement but not another student's", editedHours === 300 && otherEdit.text.includes("Placement not found") && placementRow(sihlePlacement).required_hours === 200, `own placement now ${editedHours} hours; editing Sihle's placement -> "${errorOf(otherEdit.text)}"; Sihle's hours still ${placementRow(sihlePlacement).required_hours}`);
r = await form("createLogbookEntryAction", { placementId: sihlePlacement, workDate: "2026-10-22", description: "Entry on another student's placement.", hours: "2", mentorEmail: "m@host.co.za" }, newStudent);
const r4 = await form("createLogbookEntryAction", { placementId: "no-such-placement", workDate: "2026-10-22", description: "Entry without a placement.", hours: "2", mentorEmail: "m@host.co.za" }, newStudent);
record("TC-148", "Entries can only be added to the student's own placement", r.text.includes("Choose one of your WIL placements") && r4.text.includes("Choose one of your WIL placements"), `Sihle's placement -> "${errorOf(r.text)}"; unknown placement -> "${errorOf(r4.text)}"`);
r = await get(`/student/placements/${sihlePlacement}`, newStudent);
const r5 = await get(`/student/placements/${newPlacementId}`, newStudent);
record("TC-149", "Student cannot open another student's placement", !r.text.includes("Table Bay Engineering") && r5.text.includes("Test Host Company"), `Sihle's placement shown: ${r.text.includes("Table Bay Engineering")}; own placement shown: ${r5.text.includes("Test Host Company")}`);
const newEntryPage = await get(`/student/entries/new?placement=${newPlacementId}`, newStudent);
const editPage = await get(`/student/placements/${newPlacementId}/edit`, newStudent);
record("TC-151", "New entry and edit placement pages open with the student's placements", newEntryPage.status === 200 && newEntryPage.text.includes("Test Host Company") && editPage.status === 200 && editPage.text.includes("Save changes"), `new entry page ${newEntryPage.status} (placement listed: ${newEntryPage.text.includes("Test Host Company")}); edit page ${editPage.status} (form shown: ${editPage.text.includes("Save changes")})`);

// ---------------------------------------------------------------- FR-04 / FR-05 entries and evidence
r = await form("createLogbookEntryAction", { placementId: sihlePlacement, workDate: "2026-10-22", description: "Test entry: updated the asset register.", hours: "4.5", mentorEmail: "mentor@host.co.za" }, sihle);
const draftId = r.redirect.split("/student/entries/")[1];
record("TC-122", "Valid entry is saved as Draft", !!draftId && entryRow(draftId)?.status === "draft", `redirect=${r.redirect}; status=${entryRow(draftId)?.status}; hours=${entryRow(draftId)?.hours}`);
const bad = [];
for (const [hours, desc] of [["30", "x"], ["0", "x"], ["-2", "x"], ["5", ""]]) {
  const b = await form("createLogbookEntryAction", { placementId: sihlePlacement, workDate: "2026-10-22", description: desc, hours, mentorEmail: "m@host.co.za" }, sihle);
  bad.push(`hours=${hours} desc=${desc ? "yes" : "empty"} -> "${errorOf(b.text)}"`);
}
record("TC-123", "Invalid hours (30, 0, -2) and empty description are rejected", bad.every((x) => !x.includes("(no error)")), bad.join("; "));
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
r = await form("createLogbookEntryAction", { placementId: sihlePlacement, workDate: "2026-10-21", description: "Test entry with evidence: photographed the completed installation.", hours: "6", mentorEmail: "mentor@host.co.za" }, sihle, { evidence: { blob: new Blob([png], { type: "image/png" }), name: "photo.png" } });
const evId = r.redirect.split("/student/entries/")[1];
const evName = entryRow(evId)?.evidence_file_name;
record("TC-124", "PNG evidence is accepted and stored under a random name", !!evName && /^[0-9a-f-]{36}\.png$/.test(evName), `stored as ${evName}`);
r = await form("createLogbookEntryAction", { placementId: sihlePlacement, workDate: "2026-10-21", description: "x", hours: "2", mentorEmail: "m@host.co.za" }, sihle, { evidence: { blob: new Blob(["MZ"], { type: "application/octet-stream" }), name: "virus.exe" } });
record("TC-125", "Non-PDF/image evidence (.exe) is rejected", r.text.includes("Evidence must be a PDF or image"), `message="${errorOf(r.text)}"`);
const owner = await get(`/api/evidence/${evName}`, sihle);
const other = await get(`/api/evidence/${evName}`, await login("student1@ctucareer.co.za", "student123"));
const anon = await get(`/api/evidence/${evName}`);
const staff = await get(`/api/evidence/${evName}`, coord);
const trav = await get(`/api/evidence/..%2F..%2Fdata%2Ftrackwil.db`, sihle);
record("TC-126", "Evidence download is limited to the owner and staff", owner.status === 200 && other.status === 403 && anon.status === 401 && staff.status === 200 && trav.status === 404, `owner ${owner.status}; other student ${other.status}; signed out ${anon.status}; coordinator ${staff.status}; path traversal attempt ${trav.status}`);

// ---------------------------------------------------------------- FR-06 submit for verification
const noMentor = await form("createLogbookEntryAction", { placementId: sihlePlacement, workDate: "2026-10-20", description: "Entry without a mentor email.", hours: "3", mentorEmail: "" }, sihle);
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
const rj = await form("createLogbookEntryAction", { placementId: sihlePlacement, workDate: "2026-10-19", description: "Test entry to be rejected.", hours: "2", mentorEmail: "mentor@host.co.za" }, sihle);
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
  const e = await form("createLogbookEntryAction", { placementId: newPlacementId, workDate: "2026-10-12", description: "Entry whose link will expire.", hours: "3", mentorEmail: "mentor@host.co.za" }, s);
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
r = await get(`/student/placements/${sihlePlacement}`, sihle);
const verifiedHours = db.prepare("SELECT COALESCE(SUM(hours),0) h FROM logbook_entries WHERE placement_id=? AND status='verified'").get(sihlePlacement).h;
record("TC-138", "Placement logbook lists statuses and verified hours against its required hours", r.text.includes(`${verifiedHours}<!-- --> of <!-- -->200`) || r.text.includes(`${verifiedHours} of 200`), `expected "${verifiedHours} of 200 verified hours"; statuses shown: ${["Draft", "Pending verification", "Verified", "Rejected"].filter((s) => r.text.includes(s)).join(", ")}`);
r = await get("/coordinator", lect);
// Each student's row runs from their name to the closing </tr> of that row.
const rowFor = (name) => { const i = r.text.indexOf(name); return r.text.slice(i, r.text.indexOf("</tr>", i)); };
const statusOf = (name) => ["On track", "Awaiting verification", "Overdue"].find((s) => rowFor(name).includes(s));
const dashboardText = r.text;
record("TC-139", "Dashboard shows each student's status, hours and pending count", statusOf("Dylan Shepard") === "On track" && statusOf("Moe Green") === "Overdue" && statusOf("Sihle Kayise") === "Awaiting verification", `Dylan=${statusOf("Dylan Shepard")}; Moe=${statusOf("Moe Green")}; Sihle=${statusOf("Sihle Kayise")}; Gedion=${statusOf("Gedion Basson")}`);

// ---------------------------------------------------------------- FR-17 student profile for staff
const profile = await get("/coordinator/students/student-1", coord);
const profileHas = (text) => profile.text.includes(text);
const readOnly = !profileHas("name=\"file\"") && !profileHas(">Replace<") && !profileHas(">Remove<");
record("TC-161", "Coordinator opens a student's profile with placements, logbook and documents", profile.status === 200 && profileHas("Dylan Shepard") && profileHas("Cape Legal Services") && profileHas("Harbour Admin Solutions") && profileHas("Assisted with customer intake forms") && profileHas("/api/documents/document-1") && profileHas("Memorandum of Understanding (MOU)") && readOnly, `status ${profile.status}; both placements: ${profileHas("Cape Legal Services") && profileHas("Harbour Admin Solutions")}; logbook entry shown: ${profileHas("Assisted with customer intake forms")}; document link shown: ${profileHas("/api/documents/document-1")}; read-only (no upload/replace/remove): ${readOnly}`);
const lectProfile = await get("/coordinator/students/student-2", lect);
record("TC-162", "Lecturer can open a student's profile", lectProfile.status === 200 && lectProfile.text.includes("Sihle Kayise") && lectProfile.text.includes("Table Bay Engineering"), `status ${lectProfile.status}; shows Sihle and her placement: ${lectProfile.text.includes("Sihle Kayise") && lectProfile.text.includes("Table Bay Engineering")}`);
const studentTry = await get("/coordinator/students/student-1", sihle);
record("TC-163", "Students cannot open the staff student profile", blocked(studentTry, "Back to dashboard") && !studentTry.text.includes("Harbour Admin Solutions"), `status ${studentTry.status}; Dylan's placement in the response to Sihle: ${studentTry.text.includes("Harbour Admin Solutions")}`);
const notStudent = await get("/coordinator/students/coordinator-1", coord);
const unknownStudent = await get("/coordinator/students/no-such-student", coord);
record("TC-164", "Profile of an unknown user or a staff account is not found", notStudent.status === 404 && unknownStudent.status === 404, `coordinator account -> ${notStudent.status}; unknown id -> ${unknownStudent.status}`);
const leakChecks = [
  ["student -> /coordinator", await get("/coordinator", sihle), ["student1@ctucareer.co.za", "20240053@ctucareer.co.za"]],
  ["made-up cookie -> /coordinator", await get("/coordinator", "trackwil_session=anything"), ["student1@ctucareer.co.za", "20240053@ctucareer.co.za"]],
  ["student -> another student's profile", await get("/coordinator/students/student-1", sihle), ["Harbour Admin Solutions", "Assisted with customer intake"]],
  ["made-up cookie -> student profile", await get("/coordinator/students/student-2", "trackwil_session=anything"), ["Table Bay Engineering"]],
  ["coordinator -> a student's placement page", await get(`/student/placements/${sihlePlacement}`, coord), ["Table Bay Engineering"]],
].map(([label, res, secrets]) => ({ label, status: res.status, leaked: secrets.filter((x) => res.text.includes(x)) }));
record("TC-166", "Blocked pages send none of their data in the redirect response (DEF-07 retest)", leakChecks.every((c) => c.leaked.length === 0 && c.status >= 300 && c.status < 400), leakChecks.map((c) => `${c.label}: ${c.status}, leaked ${c.leaked.length ? c.leaked.join(", ") : "nothing"}`).join("; "));
const dashRow = (name) => { const i = dashboardText.indexOf(name); return dashboardText.slice(i, dashboardText.indexOf("</tr>", i)); };
const linked = ["student-1", "student-2"].every((id) => dashboardText.includes(`href="/coordinator/students/${id}"`));
record("TC-165", "Dashboard links to each student and shows missing documents", linked && dashRow("Moe Green").includes("missing") && dashRow("Sihle Kayise").includes("missing") && dashboardText.includes("Documents"), `profile links: ${linked}; Moe row shows missing: ${dashRow("Moe Green").includes("missing")}; Sihle row shows missing: ${dashRow("Sihle Kayise").includes("missing")}`);

const dylan = await login("student1@ctucareer.co.za", "student123");
const overview = await get("/student", dylan);
const perPlacement = ["placement-dylan-1", "placement-dylan-2"].map((id) => {
  const pl = placementRow(id);
  const h = db.prepare("SELECT COALESCE(SUM(hours),0) h FROM logbook_entries WHERE placement_id=? AND status='verified'").get(id).h;
  const shown = overview.text.includes(`${h}<!-- --> of <!-- -->${pl.required_hours}`) || overview.text.includes(`${h} of ${pl.required_hours}`);
  return { label: `${pl.title} ${h} of ${pl.required_hours}`, shown };
});
record("TC-150", "Verified hours are counted separately for each placement", perPlacement.every((x) => x.shown), perPlacement.map((x) => `${x.label} shown: ${x.shown}`).join("; "));

// ---------------------------------------------------------------- FR-16 WIL documents
const documentsDir = path.join(appDir, "data/uploads/documents");
const docRows = (placementId, type) => db.prepare("SELECT * FROM placement_documents WHERE placement_id = ? AND document_type = ? ORDER BY semester").all(placementId, type);
const fakePdf = (label, size = 0) => { const head = Buffer.from(`%PDF-1.4\n% ${label}\n`); return Buffer.concat([head, Buffer.alloc(Math.max(0, size - head.length) , 32), Buffer.from("\n%%EOF\n")]); };
const pdfFile = (name, bytes) => ({ file: { blob: new Blob([bytes], { type: "application/pdf" }), name } });
const upload = (cookie, placementId, documentType, file, semester) =>
  form("uploadDocumentAction", { placementId, documentType, ...(semester ? { semester } : {}) }, cookie, file, `/student/placements/${placementId}`);

r = await upload(newStudent, newPlacementId, "mou", pdfFile("Signed MOU.pdf", fakePdf("first MOU")));
let mouRows = docRows(newPlacementId, "mou");
const firstStored = mouRows[0]?.stored_file_name;
record("TC-152", "Student uploads an MOU for their placement", r.text.includes('"success":true') && mouRows.length === 1 && /^[0-9a-f-]{36}\.pdf$/.test(firstStored ?? "") && existsSync(path.join(documentsDir, firstStored)) && mouRows[0].original_file_name === "Signed MOU.pdf", `stored as ${firstStored}; file on disk: ${firstStored ? existsSync(path.join(documentsDir, firstStored)) : false}; name shown to users "${mouRows[0]?.original_file_name}"`);

r = await upload(newStudent, newPlacementId, "mou", pdfFile("Signed MOU v2.pdf", fakePdf("second MOU")));
mouRows = docRows(newPlacementId, "mou");
const secondStored = mouRows[0]?.stored_file_name;
record("TC-153", "Uploading a document again replaces the previous file", mouRows.length === 1 && secondStored !== firstStored && !existsSync(path.join(documentsDir, firstStored)) && mouRows[0].original_file_name === "Signed MOU v2.pdf", `MOU rows: ${mouRows.length}; new file ${secondStored}; old file removed: ${!existsSync(path.join(documentsDir, firstStored))}`);

// A placement that started 200 days ago always spans two semesters (a semester is about 182 days).
const semesterOfDate = (d) => `${d.getUTCFullYear()}-S${d.getUTCMonth() < 6 ? 1 : 2}`;
const nowDate = new Date();
const currentSemester = semesterOfDate(nowDate);
const longStart = new Date(nowDate.getTime() - 200 * 86400000);
r = await form("createPlacementAction", { title: "WIL 2", companyName: "Two Semester Host", requiredHours: "400", startDate: longStart.toISOString().slice(0, 10) }, newStudent);
const longPlacementId = r.redirect.split("/student/placements/")[1];
const registersBefore = docRows(longPlacementId, "attendance_register").map((d) => d.semester);
r = await upload(newStudent, longPlacementId, "attendance_register", pdfFile("Register.pdf", fakePdf("register")), currentSemester);
await upload(newStudent, longPlacementId, "attendance_register", pdfFile("Register again.pdf", fakePdf("register again")), currentSemester);
await upload(newStudent, longPlacementId, "attendance_register", pdfFile("First register.pdf", fakePdf("first register")), semesterOfDate(longStart));
const registersAfter = docRows(longPlacementId, "attendance_register").map((d) => d.semester);
const badSemesters = [];
for (const semester of ["2026-S3", "2020-S1", "2099-S1", ""]) {
  const b = await upload(newStudent, longPlacementId, "attendance_register", pdfFile("Register.pdf", fakePdf("bad")), semester);
  badSemesters.push(`"${semester}" -> "${errorOf(b.text)}"`);
}
record("TC-154", "Attendance registers are kept once per semester", r.text.includes('"success":true') && registersBefore.length === 0 && registersAfter.length === 2 && new Set(registersAfter).size === 2 && badSemesters.every((x) => !x.includes("(no error)")), `registers before: ${registersBefore.length}; after uploading ${currentSemester} twice and ${semesterOfDate(longStart)} once: ${registersAfter.join(", ")}; ${badSemesters.join("; ")}`);

const badFiles = [];
for (const [label, file, type] of [
  [".exe file", { file: { blob: new Blob(["MZ"]), name: "setup.exe" } }, "code_of_conduct"],
  ["program renamed to .pdf", { file: { blob: new Blob(["MZ not a pdf"]), name: "conduct.pdf" } }, "code_of_conduct"],
  ["PNG renamed to .pdf", { file: { blob: new Blob([png]), name: "conduct.pdf" } }, "code_of_conduct"],
  ["empty file", { file: { blob: new Blob([]), name: "conduct.pdf" } }, "code_of_conduct"],
  ["10.5 MB PDF", pdfFile("big.pdf", fakePdf("big", 10.5 * 1024 * 1024)), "code_of_conduct"],
  ["unknown document type", pdfFile("id.pdf", fakePdf("id")), "id_copy"],
]) {
  const b = await upload(newStudent, newPlacementId, type, file);
  badFiles.push(`${label} -> "${errorOf(b.text)}"`);
}
const conductRows = docRows(newPlacementId, "code_of_conduct").length;
record("TC-155", "Invalid or oversized documents are rejected", badFiles.every((x) => !x.includes("(no error)")) && conductRows === 0, badFiles.join("; ") + `; code of conduct rows saved: ${conductRows}`);

r = await upload(newStudent, sihlePlacement, "commencement_letter", pdfFile("letter.pdf", fakePdf("letter")));
const coordUpload = await upload(coord, sihlePlacement, "commencement_letter", pdfFile("letter.pdf", fakePdf("letter")));
const sihleLetters = docRows(sihlePlacement, "commencement_letter").length;
record("TC-156", "Documents can only be uploaded to the student's own placement", r.text.includes("Placement not found") && sihleLetters === 0 && !coordUpload.text.includes('"success":true'), `other student's placement -> "${errorOf(r.text)}"; coordinator upload accepted: ${coordUpload.text.includes('"success":true')}; letters on Sihle's placement: ${sihleLetters}`);

const mouId = mouRows[0].id;
const ownerRes = await fetch(`${base}/api/documents/${mouId}`, { headers: { Cookie: newStudent } });
const ownerBody = Buffer.from(await ownerRes.arrayBuffer()).subarray(0, 5).toString();
const docOther = await get(`/api/documents/${mouId}`, sihle);
const docAnon = await get(`/api/documents/${mouId}`);
const docCoord = await get(`/api/documents/${mouId}`, coord);
const docLect = await get(`/api/documents/${mouId}`, lect);
const docUnknown = await get("/api/documents/no-such-document", newStudent);
record("TC-157", "Document download is limited to the owner and staff", ownerRes.status === 200 && ownerRes.headers.get("content-type") === "application/pdf" && ownerBody === "%PDF-" && docOther.status === 403 && docAnon.status === 401 && docCoord.status === 200 && docLect.status === 200 && docUnknown.status === 404, `owner ${ownerRes.status} (${ownerRes.headers.get("content-type")}); other student ${docOther.status}; signed out ${docAnon.status}; coordinator ${docCoord.status}; lecturer ${docLect.status}; unknown id ${docUnknown.status}`);

const otherDelete = await args("deleteDocumentAction", [mouId], sihle);
const stillThere = docRows(newPlacementId, "mou").length === 1;
const ownDelete = await args("deleteDocumentAction", [mouId], newStudent);
const removed = docRows(newPlacementId, "mou").length === 0 && !existsSync(path.join(documentsDir, secondStored));
record("TC-158", "Students can remove their own documents only", otherDelete.text.includes("Document not found") && stillThere && ownDelete.text.includes('"success":true') && removed, `other student -> "${errorOf(otherDelete.text)}" (document kept: ${stillThere}); owner -> row and file removed: ${removed}`);

const dylanWil2 = await get("/student/placements/placement-dylan-2", dylan);
const sihleDocs = await get(`/student/placements/${sihlePlacement}`, sihle);
const overviewAgain = await get("/student", dylan);
const pageShows = (page, text) => page.text.includes(text);
record("TC-159", "Placement pages show each document as Uploaded or Missing", dylanWil2.status === 200 && pageShows(dylanWil2, "Memorandum of Understanding (MOU)") && pageShows(dylanWil2, "Attendance registers") && !pageShows(dylanWil2, "Missing") && pageShows(sihleDocs, "Missing") && pageShows(sihleDocs, "Uploaded") && (overviewAgain.text.includes("documents <!-- -->3<!-- --> of<!-- --> <!-- -->3") || overviewAgain.text.includes("documents 3 of 3")), `Dylan WIL 2 complete (no Missing): ${!pageShows(dylanWil2, "Missing")}; Sihle shows Uploaded and Missing: ${pageShows(sihleDocs, "Uploaded") && pageShows(sihleDocs, "Missing")}; placement card shows documents 3 of 3: ${overviewAgain.text.includes("documents <!-- -->3<!-- --> of<!-- --> <!-- -->3") || overviewAgain.text.includes("documents 3 of 3")}`);

const bigPdf = fakePdf("large scan", 9.5 * 1024 * 1024);
r = await upload(newStudent, newPlacementId, "code_of_conduct", pdfFile("Scanned code of conduct.pdf", bigPdf));
const bigRow = docRows(newPlacementId, "code_of_conduct")[0];
record("TC-160", "A 9.5 MB scanned document uploads through the student page", r.text.includes('"success":true') && bigRow?.file_size === bigPdf.length && statSync(path.join(documentsDir, bigRow.stored_file_name)).size === bigPdf.length, `response: ${r.text.includes('"success":true') ? "success" : errorOf(r.text) + " (status " + r.status + ")"}; stored size ${bigRow?.file_size ?? "none"} of ${bigPdf.length} bytes`);

// ---------------------------------------------------------------- FR-18 WIL completion
const today = new Date().toISOString().slice(0, 10);
r = await form("createPlacementAction", { title: "WIL 3", companyName: "Short Course Host", requiredHours: "4", startDate: today }, newStudent);
const quickId = r.redirect.split("/student/placements/")[1];
const quickEntry = (await form("createLogbookEntryAction", { placementId: quickId, workDate: today, description: "Worked the four required hours.", hours: "4", mentorEmail: "mentor@host.co.za" }, newStudent)).redirect.split("/student/entries/")[1];
const draftLeft = (await form("createLogbookEntryAction", { placementId: quickId, workDate: today, description: "A draft left after the hours were met.", hours: "2", mentorEmail: "mentor@host.co.za" }, newStudent)).redirect.split("/student/entries/")[1];
const beforeApproval = await get(`/student/placements/${quickId}`, newStudent);
const quickToken = (await args("submitEntryForVerificationAction", [quickEntry], newStudent)).text.match(/"token":"([0-9a-f]+)"/)[1];
await args("mentorDecisionAction", [quickToken, "approved"]);
const afterApproval = await get(`/student/placements/${quickId}`, newStudent);
const dashNow = await get("/coordinator", coord);
const statusIn = (html, name) => { const i = html.indexOf(name); const rowHtml = html.slice(i, html.indexOf("</tr>", i)); return ["On track", "Awaiting verification", "Overdue", "WIL completed", "No placement"].find((x) => rowHtml.includes(x)); };
const dylanProfile = await get("/coordinator/students/student-1", coord);
record("TC-167", "A placement is completed automatically when its verified hours reach the required hours", !beforeApproval.text.includes("WIL completed") && afterApproval.text.includes("WIL completed") && !afterApproval.text.includes("New entry") && statusIn(dashNow.text, "Lerato Mokoena") === "WIL completed" && dylanProfile.text.includes("WIL completed"), `4-hour placement before approval completed: ${beforeApproval.text.includes("WIL completed")}; after approval: ${afterApproval.text.includes("WIL completed")} (New entry button hidden: ${!afterApproval.text.includes("New entry")}); Lerato on dashboard: ${statusIn(dashNow.text, "Lerato Mokoena")}; Dylan's profile marks WIL 1 completed: ${dylanProfile.text.includes("WIL completed")}`);

const locked = [
  ["new entry", await form("createLogbookEntryAction", { placementId: quickId, workDate: today, description: "Too late.", hours: "1", mentorEmail: "m@host.co.za" }, newStudent)],
  ["submit remaining draft", await args("submitEntryForVerificationAction", [draftLeft], newStudent)],
  ["upload document", await upload(newStudent, quickId, "mou", pdfFile("MOU.pdf", fakePdf("late MOU")))],
  ["edit placement", await form("updatePlacementAction", { placementId: quickId, title: "WIL 3", companyName: "Short Course Host", requiredHours: "40", startDate: today }, newStudent)],
  ["remove document (Dylan, WIL 1)", await args("deleteDocumentAction", ["document-5"], dylan)],
].map(([label, res]) => `${label} -> "${errorOf(res.text)}"`);
const quickEntries = db.prepare("SELECT COUNT(*) c FROM logbook_entries WHERE placement_id = ?").get(quickId).c;
const dylanMouKept = !!db.prepare("SELECT 1 FROM placement_documents WHERE id = 'document-5'").get();
record("TC-168", "A completed placement is locked against entries, submissions, documents and edits", locked.every((x) => x.includes("completed and locked")) && quickEntries === 2 && entryRow(draftLeft).status === "draft" && placementRow(quickId).required_hours === 4 && dylanMouKept, locked.join("; ") + `; entries still ${quickEntries}; draft still ${entryRow(draftLeft).status}; required hours still ${placementRow(quickId).required_hours}; Dylan's MOU kept: ${dylanMouKept}`);

const freshEmail = `${year}0198@ctucareer.co.za`;
const fresh = session((await form("signupAction", { fullName: "Fresh Student", email: freshEmail, password: "Strong#Pass1" }, "", {}, "/signup")).setCookie);
const freshBefore = statusIn((await get("/coordinator", coord)).text, "Fresh Student");
await form("createPlacementAction", { title: "WIL 1", companyName: "Brand New Host", requiredHours: "200", startDate: today }, fresh);
const freshAfter = statusIn((await get("/coordinator", coord)).text, "Fresh Student");
record("TC-169", "A student without a placement shows No placement; a new placement is not overdue", freshBefore === "No placement" && freshAfter === "On track", `before adding a placement: ${freshBefore}; after adding one that starts today: ${freshAfter}`);

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
w.exec("INSERT INTO users VALUES ('u1','A','a@x.co','student','h'); INSERT INTO wil_placements VALUES ('p1','u1','WIL 1','Host',200,'2026-10-01','t','t')");
const attempts = [
  ["hours = 30", "INSERT INTO logbook_entries VALUES ('e1','p1','2026-10-01','d',30,NULL,'draft',NULL,'t','t',NULL)"],
  ["unknown status", "INSERT INTO logbook_entries VALUES ('e2','p1','2026-10-01','d',5,NULL,'approved',NULL,'t','t',NULL)"],
  ["entry for missing placement", "INSERT INTO logbook_entries VALUES ('e3','nobody','2026-10-01','d',5,NULL,'draft',NULL,'t','t',NULL)"],
  ["placement with 0 required hours", "INSERT INTO wil_placements VALUES ('p2','u1','WIL 2','Host',0,'2026-10-01','t','t')"],
  ["placement for missing student", "INSERT INTO wil_placements VALUES ('p3','nobody','WIL 1','Host',200,'2026-10-01','t','t')"],
  ["unknown role", "INSERT INTO users VALUES ('u2','B','b@x.co','admin','h')"],
  ["duplicate email (case)", "INSERT INTO users VALUES ('u3','C','A@X.CO','student','h')"],
  ["document with an unknown type", "INSERT INTO placement_documents VALUES ('d1','p1','id_copy',NULL,'a.pdf','s1.pdf',10,'t')"],
  ["attendance register without a semester", "INSERT INTO placement_documents VALUES ('d2','p1','attendance_register',NULL,'a.pdf','s2.pdf',10,'t')"],
  ["second MOU for one placement", "INSERT INTO placement_documents VALUES ('d3','p1','mou',NULL,'a.pdf','s3.pdf',10,'t'); INSERT INTO placement_documents VALUES ('d4','p1','mou',NULL,'b.pdf','s4.pdf',10,'t')"],
  ["token used without decision", "INSERT INTO logbook_entries VALUES ('e4','p1','2026-10-01','d',5,NULL,'draft',NULL,'t','t',NULL); INSERT INTO verification_tokens VALUES ('k','e4','t','used',NULL)"],
];
const out = attempts.map(([label, sql]) => { try { w.exec(sql); return `${label}: ACCEPTED`; } catch (e) { return `${label}: rejected (${e.message.split(":")[0]})`; } });
record("TC-143", "Database constraints reject invalid data", out.every((o) => o.includes("rejected")), out.join("; "));

// ---------------------------------------------------------------- NFR-02 performance
const s2 = await login("student2@ctucareer.co.za", "student123");
const pages = [["/", ""], ["/student", s2], [`/student/placements/${sihlePlacement}`, s2], ["/student/entries/new", s2], ["/coordinator", coord], ["/coordinator/students/student-1", coord], [`/verify/c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9`, ""]];
const perf = [];
let worst = 0;
const failedPages = [];
for (const [p, c] of pages) {
  const times = [];
  for (let i = 0; i < 10; i++) {
    const t0 = performance.now();
    const res = await get(p, c);
    times.push(performance.now() - t0);
    const failure = `${p.startsWith("/verify/") ? "/verify/<token>" : p} -> ${res.status}`;
    if (res.status !== 200 && !failedPages.includes(failure)) failedPages.push(failure);
  }
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const max = Math.max(...times);
  worst = Math.max(worst, max);
  perf.push(`${p.startsWith("/verify/") ? "/verify/<token>" : p} avg ${avg.toFixed(0)} ms, max ${max.toFixed(0)} ms`);
}
const t0 = performance.now();
const pf = await form("createLogbookEntryAction", { placementId: sihlePlacement, workDate: "2026-10-18", description: "Timing test entry.", hours: "1", mentorEmail: "m@host.co.za" }, s2);
const createMs = performance.now() - t0;
record("TC-144", "Pages and actions respond within 2 seconds (10 requests each)", worst < 2000 && createMs < 2000 && !!pf.redirect && failedPages.length === 0, perf.join("; ") + `; create entry ${createMs.toFixed(0)} ms; pages with errors: ${failedPages.join(", ") || "none"}`);

writeFileSync(resultsPath, JSON.stringify(results, null, 2));
const failed = results.filter((x) => x.status !== "Pass").length;
console.log(`\n${results.length} automated tests: ${results.length - failed} passed, ${failed} failed`);
