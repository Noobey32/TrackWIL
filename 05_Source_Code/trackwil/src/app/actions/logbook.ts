'use server';

/**
 * Student logbook actions: create entries for one of the student's WIL placements (optional evidence upload),
 * then submit for mentor verification.
 * Submitting issues a token and moves the entry to pending_verification.
 */

import { randomBytes, randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { maxDocumentBytes } from '@/lib/documents';
import { uploadsDirectory } from '@/lib/paths';
import {
	createLogbookEntry,
	getActiveVerificationTokenForEntry,
	getLogbookEntryById,
	getPlacementById,
	submitEntryForVerification,
} from '@/lib/repository';
import { getCurrentUser } from '@/lib/session';
import type { LogbookEntry, VerificationToken } from '@/lib/types';

const tokenLifetimeDays = 7;
const allowedEvidenceExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];

function extensionForFileName(fileName: string): string {
	return path.extname(fileName).toLowerCase();
}

export async function createLogbookEntryAction(formData: FormData) {
	const user = await getCurrentUser();
	if (!user || user.role !== 'student') {
		redirect('/');
	}

	const placementId = String(formData.get('placementId') ?? '');
	const placement = await getPlacementById(placementId);
	if (!placement || placement.studentId !== user.id) {
		return { error: 'Choose one of your WIL placements for this entry.' };
	}

	const workDate = String(formData.get('workDate') ?? '').trim();
	const description = String(formData.get('description') ?? '').trim();
	const hoursValue = Number(formData.get('hours'));
	const mentorEmail = String(formData.get('mentorEmail') ?? '').trim();

	if (
		!workDate ||
		!description ||
		!Number.isFinite(hoursValue) ||
		hoursValue <= 0
	) {
		return {
			error: 'Work date, description, and positive hours are required.',
		};
	}
	if (hoursValue > 24) {
		return { error: 'Hours for one day cannot be more than 24.' };
	}

	let evidenceFileName: string | null = null;
	const evidenceFile = formData.get('evidence');
	if (evidenceFile instanceof File && evidenceFile.size > 0) {
		const extension = extensionForFileName(evidenceFile.name);
		if (!allowedEvidenceExtensions.includes(extension)) {
			return { error: 'Evidence must be a PDF or image file.' };
		}
		if (evidenceFile.size > maxDocumentBytes) {
			return { error: 'Evidence files cannot be larger than 10 MB.' };
		}
		evidenceFileName = `${randomUUID()}${extension}`;
		await mkdir(uploadsDirectory, { recursive: true });
		const buffer = Buffer.from(await evidenceFile.arrayBuffer());
		await writeFile(`${uploadsDirectory}/${evidenceFileName}`, buffer);
	}

	const now = new Date().toISOString();
	const newEntry: LogbookEntry = {
		id: randomUUID(),
		placementId: placement.id,
		studentId: user.id,
		workDate,
		description,
		hours: hoursValue,
		evidenceFileName,
		status: 'draft',
		mentorEmail: mentorEmail || null,
		createdAt: now,
		updatedAt: now,
		verifiedAt: null,
	};

	await createLogbookEntry(newEntry);

	revalidatePath('/student');
	revalidatePath(`/student/placements/${placement.id}`);
	redirect(`/student/entries/${newEntry.id}`);
}

export async function submitEntryForVerificationAction(entryId: string) {
	const user = await getCurrentUser();
	if (!user || user.role !== 'student') {
		redirect('/');
	}

	const entry = await getLogbookEntryById(entryId);
	if (!entry || entry.studentId !== user.id) {
		return { error: 'Entry not found.' };
	}
	// A pending entry whose link expired before the mentor responded may be sent again.
	const isPendingWithoutActiveLink =
		entry.status === 'pending_verification' &&
		!(await getActiveVerificationTokenForEntry(entry.id));
	if (
		entry.status !== 'draft' &&
		entry.status !== 'rejected' &&
		!isPendingWithoutActiveLink
	) {
		return {
			error:
				'Only draft or rejected entries, or entries whose link has expired, can be submitted.',
		};
	}
	if (!entry.mentorEmail) {
		return { error: 'Add a mentor email on the entry before submitting.' };
	}

	const now = new Date();
	const expiresAt = new Date(now);
	expiresAt.setDate(expiresAt.getDate() + tokenLifetimeDays);

	const tokenValue = randomBytes(24).toString('hex');
	const verificationToken: VerificationToken = {
		token: tokenValue,
		entryId: entry.id,
		expiresAt: expiresAt.toISOString(),
		usedAt: null,
		decision: null,
	};

	await submitEntryForVerification(verificationToken, now.toISOString());

	revalidatePath('/student');
	revalidatePath(`/student/placements/${entry.placementId}`);
	revalidatePath(`/student/entries/${entryId}`);
	revalidatePath('/coordinator');

	return { token: tokenValue };
}

