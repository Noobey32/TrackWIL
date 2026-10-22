/**
 * Data access for users, logbook entries, and mentor verification tokens.
 * Backed by SQLite (see database/schema.sql); columns are aliased to the
 * camelCase shapes in types.ts so callers never deal with SQL rows directly.
 */
import { getDatabase, inTransaction } from '@/lib/db';
import type { LogbookEntry, User, VerificationToken } from '@/lib/types';

const userColumns = `id, full_name AS fullName, email, role,
	password_hash AS passwordHash, required_hours AS requiredHours`;

const entryColumns = `id, student_id AS studentId, work_date AS workDate,
	description, hours, evidence_file_name AS evidenceFileName, status,
	mentor_email AS mentorEmail, created_at AS createdAt,
	updated_at AS updatedAt, verified_at AS verifiedAt`;

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
			`INSERT INTO users (id, full_name, email, role, password_hash, required_hours)
			VALUES (?, ?, ?, ?, ?, ?)`,
		)
		.run(
			user.id,
			user.fullName,
			user.email,
			user.role,
			user.passwordHash,
			user.requiredHours,
		);
}

export async function getLogbookEntries(): Promise<LogbookEntry[]> {
	return getDatabase()
		.prepare(`SELECT ${entryColumns} FROM logbook_entries`)
		.all() as unknown as LogbookEntry[];
}

export async function getEntriesForStudent(
	studentId: string,
): Promise<LogbookEntry[]> {
	return getDatabase()
		.prepare(
			`SELECT ${entryColumns} FROM logbook_entries
			WHERE student_id = ? ORDER BY work_date DESC, created_at DESC`,
		)
		.all(studentId) as unknown as LogbookEntry[];
}

export async function getLogbookEntryById(
	entryId: string,
): Promise<LogbookEntry | undefined> {
	return getDatabase()
		.prepare(`SELECT ${entryColumns} FROM logbook_entries WHERE id = ?`)
		.get(entryId) as unknown as LogbookEntry | undefined;
}

export async function getLogbookEntryByEvidenceFileName(
	evidenceFileName: string,
): Promise<LogbookEntry | undefined> {
	return getDatabase()
		.prepare(
			`SELECT ${entryColumns} FROM logbook_entries WHERE evidence_file_name = ?`,
		)
		.get(evidenceFileName) as unknown as LogbookEntry | undefined;
}

export async function createLogbookEntry(entry: LogbookEntry): Promise<void> {
	getDatabase()
		.prepare(
			`INSERT INTO logbook_entries (id, student_id, work_date, description, hours,
				evidence_file_name, status, mentor_email, created_at, updated_at, verified_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		)
		.run(
			entry.id,
			entry.studentId,
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
