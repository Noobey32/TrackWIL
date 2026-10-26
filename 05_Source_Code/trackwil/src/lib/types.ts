/** Shared shapes for the repository (database rows) and the UI. */

export type UserRole = 'student' | 'coordinator' | 'lecturer';

/** Entry lifecycle: draft → pending_verification (mentor link) → verified or rejected. */
export type LogbookEntryStatus =
	| 'draft'
	| 'pending_verification'
	| 'verified'
	| 'rejected';

export type User = {
	id: string;
	fullName: string;
	email: string;
	role: UserRole;
	passwordHash: string;
};

/** One WIL placement; a student can have several, each with its own required hours. */
export type WilPlacement = {
	id: string;
	studentId: string;
	title: string;
	companyName: string;
	requiredHours: number;
	startDate: string;
	createdAt: string;
	updatedAt: string;
};

export type LogbookEntry = {
	id: string;
	placementId: string;
	/** Read through the entry's placement; not stored on the entry itself. */
	studentId: string;
	workDate: string;
	description: string;
	hours: number;
	evidenceFileName: string | null;
	status: LogbookEntryStatus;
	mentorEmail: string | null;
	createdAt: string;
	updatedAt: string;
	verifiedAt: string | null;
};

/** One-time mentor link metadata; used on /verify/[token] without a user account. */
export type VerificationToken = {
	token: string;
	entryId: string;
	expiresAt: string;
	usedAt: string | null;
	decision: 'approved' | 'rejected' | null;
};

export type StudentOverviewStatus =
	| 'on_track'
	| 'awaiting_verification'
	| 'overdue'
	| 'wil_completed'
	| 'no_placement';


export type DocumentType =
	| 'mou'
	| 'commencement_letter'
	| 'code_of_conduct'
	| 'attendance_register';

/** Uploaded WIL paperwork for one placement; the file is stored on disk under a random name. */
export type PlacementDocument = {
	id: string;
	placementId: string;
	/** Read through the document's placement; not stored on the document itself. */
	studentId: string;
	documentType: DocumentType;
	/** Only attendance registers have a semester, e.g. "2026-S2". */
	semester: string | null;
	originalFileName: string;
	storedFileName: string;
	fileSize: number;
	uploadedAt: string;
};
