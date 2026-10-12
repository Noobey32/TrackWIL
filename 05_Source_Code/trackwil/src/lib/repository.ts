/**
 * Data access for users, logbook entries, and mentor verification tokens.
 * Each collection is stored as a single JSON array file; callers load, mutate,
 * and save the full list (no partial updates at the file level).
 */
import {
	logbookEntriesFilePath,
	usersFilePath,
	verificationTokensFilePath,
} from '@/lib/paths';
import { readJsonFile, writeJsonFile } from '@/lib/json-store';
import type { LogbookEntry, User, VerificationToken } from '@/lib/types';

export async function getUsers(): Promise<User[]> {
	return readJsonFile<User[]>(usersFilePath, []);
}

export async function saveUsers(users: User[]): Promise<void> {
	await writeJsonFile(usersFilePath, users);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
	const users = await getUsers();
	return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export async function getUserById(userId: string): Promise<User | undefined> {
	const users = await getUsers();
	return users.find((user) => user.id === userId);
}

export async function getLogbookEntries(): Promise<LogbookEntry[]> {
	return readJsonFile<LogbookEntry[]>(logbookEntriesFilePath, []);
}

export async function saveLogbookEntries(
	entries: LogbookEntry[],
): Promise<void> {
	await writeJsonFile(logbookEntriesFilePath, entries);
}

export async function getEntriesForStudent(
	studentId: string,
): Promise<LogbookEntry[]> {
	const entries = await getLogbookEntries();
	return entries
		.filter((entry) => entry.studentId === studentId)
		.sort((left, right) => right.workDate.localeCompare(left.workDate));
}

export async function getLogbookEntryById(
	entryId: string,
): Promise<LogbookEntry | undefined> {
	const entries = await getLogbookEntries();
	return entries.find((entry) => entry.id === entryId);
}

export async function getVerificationTokens(): Promise<VerificationToken[]> {
	return readJsonFile<VerificationToken[]>(verificationTokensFilePath, []);
}

export async function saveVerificationTokens(
	tokens: VerificationToken[],
): Promise<void> {
	await writeJsonFile(verificationTokensFilePath, tokens);
}

export async function getVerificationToken(
	tokenValue: string,
): Promise<VerificationToken | undefined> {
	const tokens = await getVerificationTokens();
	return tokens.find((token) => token.token === tokenValue);
}

export async function getActiveVerificationTokenForEntry(
	entryId: string,
): Promise<VerificationToken | undefined> {
	const tokens = await getVerificationTokens();
	const now = new Date();
	return tokens.find(
		(token) =>
			token.entryId === entryId &&
			!token.usedAt &&
			new Date(token.expiresAt) > now,
	);
}

