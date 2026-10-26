/**
 * Data access for users, WIL placements, logbook entries, and mentor verification tokens.
 * Backed by SQLite (see database/schema.sql); columns are aliased to the
 * camelCase shapes in types.ts so callers never deal with SQL rows directly.
 */
import { getDatabase, inTransaction } from '@/lib/db';
import type {
	LogbookEntry,
	User,
	VerificationToken,
	WilPlacement,
} from '@/lib/types';

const userColumns = `id, full_name AS fullName, email, role,
	password_hash AS passwordHash`;

const placementColumns = `id, student_id AS studentId, title,
	company_name AS companyName, required_hours AS requiredHours,
	start_date AS startDate, created_at AS createdAt, updated_at AS updatedAt`;

// Entries do not store the student; it is read from the entry's placement.
const entryColumns = `e.id, e.placement_id AS placementId, p.student_id AS studentId,
	e.work_date AS workDate, e.description, e.hours,
	e.evidence_file_name AS evidenceFileName, e.status,
	e.mentor_email AS mentorEmail, e.created_at AS createdAt,
	e.updated_at AS updatedAt, e.verified_at AS verifiedAt`;

const entryTables = `logbook_entries e
	JOIN wil_placements p ON p.id = e.placement_id`;

const tokenColumns = `token, entry_id AS entryId, expires_at AS expiresAt,
	used_at AS usedAt, decision`;

export async function getUsers(): Promise<User[]> {
	return getDatabase()
		.prepare(`SELECT ${userColumns} FROM users ORDER BY full_name`)
		.all() as unknown as User[];
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
	// The email column is COLLATE NOCASE, so this match ignores letter case.
	return getDatabase()
		.prepare(`SELECT ${userColumns} FROM users WHERE email = ?`)
		.get(email) as unknown as User | undefined;
}

export async function getUserById(userId: string): Promise<User | undefined> {
	return getDatabase()
		.prepare(`SELECT ${userColumns} FROM users WHERE id = ?`)
		.get(userId) as unknown as User | undefined;
}

export async function createUser(user: User): Promise<void> {
	getDatabase()
		.prepare(
			`INSERT INTO users (id, full_name, email, role, password_hash)
			VALUES (?, ?, ?, ?, ?)`,
		)
		.run(user.id, user.fullName, user.email, user.role, user.passwordHash);
}

export async function getPlacements(): Promise<WilPlacement[]> {
	return getDatabase()
		.prepare(`SELECT ${placementColumns} FROM wil_placements`)
		.all() as unknown as WilPlacement[];
}

/** A student's placements, the most recently started first. */
export async function getPlacementsForStudent(
	studentId: string,
): Promise<WilPlacement[]> {
	return getDatabase()
		.prepare(
			`SELECT ${placementColumns} FROM wil_placements
			WHERE student_id = ? ORDER BY start_date DESC, created_at DESC`,
		)
		.all(studentId) as unknown as WilPlacement[];
}

export async function getPlacementById(
	placementId: string,
): Promise<WilPlacement | undefined> {
	return getDatabase()
		.prepare(`SELECT ${placementColumns} FROM wil_placements WHERE id = ?`)
		.get(placementId) as unknown as WilPlacement | undefined;
}

export async function createPlacement(placement: WilPlacement): Promise<void> {
	getDatabase()
		.prepare(
			`INSERT INTO wil_placements (id, student_id, title, company_name,
				required_hours, start_date, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		)
		.run(
			placement.id,
			placement.studentId,
			placement.title,
			placement.companyName,
			placement.requiredHours,
			placement.startDate,
			placement.createdAt,
			placement.updatedAt,
		);
}

export async function updatePlacement(
	placement: Pick<
		WilPlacement,
		'id' | 'title' | 'companyName' | 'requiredHours' | 'startDate' | 'updatedAt'
	>,
): Promise<void> {
	getDatabase()
		.prepare(
			`UPDATE wil_placements
			SET title = ?, company_name = ?, required_hours = ?, start_date = ?, updated_at = ?
			WHERE id = ?`,
		)
		.run(
			placement.title,
			placement.companyName,
			placement.requiredHours,
			placement.startDate,
			placement.updatedAt,
			placement.id,
		);
}

export async function getLogbookEntries(): Promise<LogbookEntry[]> {
	return getDatabase()
		.prepare(`SELECT ${entryColumns} FROM ${entryTables}`)
		.all() as unknown as LogbookEntry[];
}

export async function getEntriesForStudent(
	studentId: string,
): Promise<LogbookEntry[]> {
	return getDatabase()
		.prepare(
			`SELECT ${entryColumns} FROM ${entryTables}
			WHERE p.student_id = ? ORDER BY e.work_date DESC, e.created_at DESC`,
		)
		.all(studentId) as unknown as LogbookEntry[];
}

export async function getEntriesForPlacement(
	placementId: string,
): Promise<LogbookEntry[]> {
	return getDatabase()
		.prepare(
			`SELECT ${entryColumns} FROM ${entryTables}
			WHERE e.placement_id = ? ORDER BY e.work_date DESC, e.created_at DESC`,
		)
		.all(placementId) as unknown as LogbookEntry[];
}

export async function getLogbookEntryById(
	entryId: string,
): Promise<LogbookEntry | undefined> {
	return getDatabase()
		.prepare(`SELECT ${entryColumns} FROM ${entryTables} WHERE e.id = ?`)
		.get(entryId) as unknown as LogbookEntry | undefined;
}

export async function getLogbookEntryByEvidenceFileName(
	evidenceFileName: string,
): Promise<LogbookEntry | undefined> {
	return getDatabase()
		.prepare(
			`SELECT ${entryColumns} FROM ${entryTables} WHERE e.evidence_file_name = ?`,
		)
		.get(evidenceFileName) as unknown as LogbookEntry | undefined;
}

export async function createLogbookEntry(entry: LogbookEntry): Promise<void> {
	getDatabase()
		.prepare(
			`INSERT INTO logbook_entries (id, placement_id, work_date, description, hours,
				evidence_file_name, status, mentor_email, created_at, updated_at, verified_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		)
		.run(
			entry.id,
			entry.placementId,
			entry.workDate,
			entry.description,
			entry.hours,
			entry.evidenceFileName,
			entry.status,
			entry.mentorEmail,
			entry.createdAt,
			entry.updatedAt,
			entry.verifiedAt,
		);
}

export async function getVerificationToken(
	tokenValue: string,
): Promise<VerificationToken | undefined> {
	return getDatabase()
		.prepare(`SELECT ${tokenColumns} FROM verification_tokens WHERE token = ?`)
		.get(tokenValue) as unknown as VerificationToken | undefined;
}

export async function getActiveVerificationTokenForEntry(
	entryId: string,
): Promise<VerificationToken | undefined> {
	return getDatabase()
		.prepare(
			`SELECT ${tokenColumns} FROM verification_tokens
			WHERE entry_id = ? AND used_at IS NULL AND expires_at > ?
			ORDER BY expires_at DESC LIMIT 1`,
		)
		.get(entryId, new Date().toISOString()) as unknown as
		| VerificationToken
		| undefined;
}

/** Store the new mentor link and move the entry to pending_verification together. */
export async function submitEntryForVerification(
	token: VerificationToken,
	submittedAt: string,
): Promise<void> {
	inTransaction((database) => {
		database
			.prepare(
				`INSERT INTO verification_tokens (token, entry_id, expires_at, used_at, decision)
				VALUES (?, ?, ?, NULL, NULL)`,
			)
			.run(token.token, token.entryId, token.expiresAt);
		database
			.prepare(
				`UPDATE logbook_entries SET status = 'pending_verification', updated_at = ?
				WHERE id = ?`,
			)
			.run(submittedAt, token.entryId);
	});
}

/**
 * Mark the token used and apply the mentor's decision to its entry together.
 * Returns false if the token was already used (e.g. a double click or a second tab).
 */
export async function recordMentorDecision(
	tokenValue: string,
	decision: 'approved' | 'rejected',
	decidedAt: string,
): Promise<boolean> {
	return inTransaction((database) => {
		const tokenUpdate = database
			.prepare(
				`UPDATE verification_tokens SET used_at = ?, decision = ?
				WHERE token = ? AND used_at IS NULL`,
			)
			.run(decidedAt, decision, tokenValue);
		if (tokenUpdate.changes === 0) {
			return false;
		}

		database
			.prepare(
				`UPDATE logbook_entries
				SET status = ?, updated_at = ?,
					verified_at = CASE WHEN ? = 'approved' THEN ? ELSE verified_at END
				WHERE id = (SELECT entry_id FROM verification_tokens WHERE token = ?)`,
			)
			.run(
				decision === 'approved' ? 'verified' : 'rejected',
				decidedAt,
				decision,
				decidedAt,
				tokenValue,
			);
		return true;
	});
}
