export type UserRole = 'student' | 'coordinator' | 'lecturer';

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
	requiredHours: number;
};

export type LogbookEntry = {
	id: string;
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
	| 'overdue';

