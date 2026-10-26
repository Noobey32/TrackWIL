-- TrackWIL synthetic demo data (no real student or staff information).
-- Dates are relative to "now" so the coordinator dashboard always shows a mix
-- of On track, Awaiting verification and Overdue students after a reset.
--
-- Demo passwords: students student123, coordinator coord123, lecturer lecturer123.
-- Students who signed up through the app use their own passwords.

INSERT INTO users (id, full_name, email, role, password_hash) VALUES
    ('student-1', 'Dylan Shepard', 'student1@ctucareer.co.za', 'student',
     '1d8a1fa74a0cf655ef89fad7215d8670:20ab83bd1e50567dad529be32cded9996024cba9622847fe0bac013607a8c15924635a8120ee79e3a57c86c54314c87e9877635048d91776d406bdfe8ecdc083'),
    ('student-2', 'Sihle Kayise', 'student2@ctucareer.co.za', 'student',
     '1d8a1fa74a0cf655ef89fad7215d8670:20ab83bd1e50567dad529be32cded9996024cba9622847fe0bac013607a8c15924635a8120ee79e3a57c86c54314c87e9877635048d91776d406bdfe8ecdc083'),
    ('student-2d8e765f-a1e3-4af7-8ff1-45000d926566', 'Moe Green', '20240053@ctucareer.co.za', 'student',
     '3b6856c00263f798e3642954f30e03a0:f0885a424d51402dd32b0570dc69925ee1a298572b674afb78f5841a7ac9a9f2ddaf20939dd1689298419f8d45d1415e3a3ef6b356086e93b6646f521ab044c0'),
    ('student-c122a892-6d0b-455f-a82d-39832d05e23e', 'Gedion Basson', '20240268@ctucareer.co.za', 'student',
     '71666a56383e383bed190431b2d605e1:1413ff4237ea25e78d0949cf754eb67379fff76cfeb8544d2da827b7f6f49c1fade9dc5869a7c512117e9110649e40dafcd5e467387c56b4ac0c57375aa7d182'),
    ('coordinator-1', 'Amenda Raganya', 'coordinator@ctucareer.co.za', 'coordinator',
     'b5c8c7e4af3d02d63354e220df113974:7eb7dac7110199eb548859e9b40e93847a96caec02fcbd00950b86886de8f96e6b4d503596b91a302a6194b0e0acd05db2c8e34b2e154ef974f0e79481a7c386'),
    ('lecturer-1', 'Demo Lecturer', 'lecturer@ctucareer.co.za', 'lecturer',
     '16733cf4e473f874b4e341a1bf0d2aad:21f58e36fb8ebfec5e50fa429f3cd76b5ab357730365fbbf2652b0bd803be300c1f37131360d69f97da94c7c0395c9731a50881fa448dee877509e175aab58aa');

-- Each student's WIL placement(s). Dylan has two: an earlier WIL 1 and the current WIL 2.
INSERT INTO wil_placements (id, student_id, title, company_name, required_hours, start_date, created_at, updated_at) VALUES
    ('placement-dylan-1', 'student-1', 'WIL 1', 'Cape Legal Services', 120, date('now', '-240 days'),
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-240 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-240 days')),
    ('placement-dylan-2', 'student-1', 'WIL 2', 'Harbour Admin Solutions', 200, date('now', '-30 days'),
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days')),
    ('placement-sihle-1', 'student-2', 'WIL 1', 'Table Bay Engineering', 200, date('now', '-30 days'),
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days')),
    ('placement-moe-1', 'student-2d8e765f-a1e3-4af7-8ff1-45000d926566', 'WIL 1', 'Southern IT Support', 200, date('now', '-45 days'),
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-45 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-45 days')),
    ('placement-gedion-1', 'student-c122a892-6d0b-455f-a82d-39832d05e23e', 'WIL 1', 'Northgate Warehousing', 200, date('now', '-30 days'),
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days'));

INSERT INTO logbook_entries
    (id, placement_id, work_date, description, hours, evidence_file_name, status, mentor_email, created_at, updated_at, verified_at)
VALUES
    -- Dylan, WIL 1: older verified work from the earlier placement
    ('entry-8', 'placement-dylan-1', date('now', '-230 days'),
     'Indexed and scanned client case files.', 8, NULL, 'verified', 'legal.mentor@host.co.za',
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-230 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-229 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-229 days')),
    ('entry-9', 'placement-dylan-1', date('now', '-225 days'),
     'Drafted meeting minutes for the partners meeting.', 7, NULL, 'verified', 'legal.mentor@host.co.za',
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-225 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-224 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-224 days')),

    -- Dylan, WIL 2: recently verified work plus a draft -> On track
    ('entry-1', 'placement-dylan-2', date('now', '-4 days'),
     'Assisted with customer intake forms and filing.', 8, NULL, 'verified', 'mentor@host.co.za',
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-4 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days')),
    ('entry-4', 'placement-dylan-2', date('now', '-1 days'),
     'Updated the client contact list and archived closed files.', 6, NULL, 'draft', 'mentor@host.co.za',
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 days'), NULL),

    -- Sihle: one verified entry and one waiting for the mentor -> Awaiting verification
    ('entry-3', 'placement-sihle-1', date('now', '-12 days'),
     'Completed safety induction and site orientation.', 6, NULL, 'verified', 'mentor@host.co.za',
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-11 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-10 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-10 days')),
    ('entry-2', 'placement-sihle-1', date('now', '-2 days'),
     'Shadowed technician during equipment checks.', 7.5, NULL, 'pending_verification', 'mentor@host.co.za',
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 days'), NULL),

    -- Moe: last verified entry is older than 14 days -> Overdue
    ('entry-5', 'placement-moe-1', date('now', '-21 days'),
     'Configured workstations for new staff members.', 8, NULL, 'verified', 'it.mentor@host.co.za',
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-21 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-20 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-20 days')),

    -- Gedion: verified entry plus a rejected one to resubmit -> On track
    ('460d1500-5d1f-4015-b2dc-b4c1e45d29e0', 'placement-gedion-1', date('now', '-3 days'),
     'Built a stock-take spreadsheet for the warehouse team.', 3.5, NULL, 'verified', 'mentor@host.co.za',
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 days')),
    ('entry-6', 'placement-gedion-1', date('now', '-2 days'),
     'Helped at the front desk.', 9, NULL, 'rejected', 'mentor@host.co.za',
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 days'), NULL),
    -- Submitted 10 days ago; the mentor never responded and the link has expired (can be resubmitted)
    ('entry-7', 'placement-gedion-1', date('now', '-10 days'),
     'Prepared the monthly stock report.', 5, NULL, 'pending_verification', 'mentor@host.co.za',
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-10 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-10 days'), NULL);

INSERT INTO verification_tokens (token, entry_id, expires_at, used_at, decision) VALUES
    ('b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4', 'entry-8',
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-223 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-229 days'), 'approved'),
    ('c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5', 'entry-9',
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-218 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-224 days'), 'approved'),
    ('a1f3c9e0b7d24e6f8a5c1b3d9e7f2a4c6b8d0e1f3a5c7b9d', 'entry-1',
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+3 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days'), 'approved'),
    ('b2e4d6f8a0c1e3f5b7d9a1c3e5f7b9d1a3c5e7f9b1d3a5c7', 'entry-3',
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-4 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-10 days'), 'approved'),
    -- Open link for the demo: /verify/c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9
    ('c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9', 'entry-2',
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+6 days'), NULL, NULL),
    ('d4c6e8a0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0', 'entry-5',
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-13 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-20 days'), 'approved'),
    ('e5b7d9f1c3e5a7b9d1f3c5e7a9b1d3f5c7e9a1b3d5f7c9e1', '460d1500-5d1f-4015-b2dc-b4c1e45d29e0',
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+4 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 days'), 'approved'),
    ('f6a8c0e2d4f6b8d0a2c4e6f8b0d2a4c6e8f0b2d4a6c8e0f2', 'entry-6',
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+5 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 days'), 'rejected'),
    -- Expired, never used: /verify/a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3 shows "expired"
    ('a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3', 'entry-7',
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days'), NULL, NULL);

-- Uploaded WIL documents. The files are synthetic PDFs from database/demo-documents/,
-- copied into data/uploads/documents/ when the database is seeded.
-- Dylan's WIL 2 paperwork is complete; WIL 1 is missing later attendance registers;
-- Sihle has only uploaded the MOU; Moe and Gedion have uploaded nothing yet.
-- A semester is written as e.g. 2026-S2 (S1 = January to June, S2 = July to December).
INSERT INTO placement_documents
    (id, placement_id, document_type, semester, original_file_name, stored_file_name, file_size, uploaded_at)
VALUES
    ('document-1', 'placement-dylan-2', 'mou', NULL,
     'MOU - Harbour Admin Solutions.pdf', 'demo-dylan-wil2-mou.pdf', 1087, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-29 days')),
    ('document-2', 'placement-dylan-2', 'commencement_letter', NULL,
     'Commencement letter.pdf', 'demo-dylan-wil2-commencement.pdf', 1079, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-29 days')),
    ('document-3', 'placement-dylan-2', 'code_of_conduct', NULL,
     'Signed code of conduct.pdf', 'demo-dylan-wil2-conduct.pdf', 1075, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-28 days')),
    ('document-4', 'placement-dylan-2', 'attendance_register',
     strftime('%Y', 'now') || '-S' || CASE WHEN CAST(strftime('%m', 'now') AS INTEGER) <= 6 THEN '1' ELSE '2' END,
     'Attendance register.pdf', 'demo-dylan-wil2-register.pdf', 1079, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 days')),
    ('document-5', 'placement-dylan-1', 'mou', NULL,
     'MOU - Cape Legal Services.pdf', 'demo-dylan-wil1-mou.pdf', 1083, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-239 days')),
    ('document-6', 'placement-dylan-1', 'commencement_letter', NULL,
     'Commencement letter.pdf', 'demo-dylan-wil1-commencement.pdf', 1075, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-239 days')),
    ('document-7', 'placement-dylan-1', 'code_of_conduct', NULL,
     'Code of conduct.pdf', 'demo-dylan-wil1-conduct.pdf', 1071, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-238 days')),
    ('document-8', 'placement-dylan-1', 'attendance_register',
     strftime('%Y', 'now', '-240 days') || '-S' || CASE WHEN CAST(strftime('%m', 'now', '-240 days') AS INTEGER) <= 6 THEN '1' ELSE '2' END,
     'Attendance register.pdf', 'demo-dylan-wil1-register.pdf', 1075, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-200 days')),
    ('document-9', 'placement-sihle-1', 'mou', NULL,
     'MOU.pdf', 'demo-sihle-wil1-mou.pdf', 1084, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-25 days'));
