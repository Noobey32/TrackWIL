'use server';

/**
 * Student document actions: upload a WIL document for one of their placements, or remove it.
 * The MOU, Commencement Letter and Code of Conduct are kept once per placement and the
 * Attendance Register once per semester; uploading again replaces the previous file.
 */

import { randomUUID } from 'crypto';
import { mkdir, rm, writeFile } from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
	allowedDocumentExtensions,
	documentTypes,
	fileMatchesExtension,
	maxDocumentBytes,
	semestersForPlacement,
} from '@/lib/documents';
import { documentsDirectory } from '@/lib/paths';
import {
	deleteDocument,
	getDocumentById,
	getPlacementById,
	saveDocument,
} from '@/lib/repository';
import { getCurrentUser } from '@/lib/session';
import type { DocumentType } from '@/lib/types';

/** Keep the name the student sees, without folders, control characters or quotes. */
function cleanOriginalFileName(fileName: string): string {
	const baseName = path.basename(fileName.replaceAll('\\', '/'));
	const cleaned = baseName.replace(/[\u0000-\u001f"]/g, '').trim();
	return (cleaned || 'document').slice(0, 200);
}

function revalidateDocumentPages(placementId: string) {
	revalidatePath('/student');
	revalidatePath(`/student/placements/${placementId}`);
	revalidatePath('/coordinator');
}

export async function uploadDocumentAction(formData: FormData) {
	const user = await getCurrentUser();
	if (!user || user.role !== 'student') {
		redirect('/');
	}

	const placementId = String(formData.get('placementId') ?? '');
	const placement = await getPlacementById(placementId);
	if (!placement || placement.studentId !== user.id) {
		return { error: 'Placement not found.' };
	}

	const documentType = String(formData.get('documentType') ?? '') as DocumentType;
	if (!documentTypes.includes(documentType)) {
		return { error: 'Choose which document you are uploading.' };
	}

	let semester: string | null = null;
	if (documentType === 'attendance_register') {
		semester = String(formData.get('semester') ?? '');
		if (!semestersForPlacement(placement.startDate).includes(semester)) {
			return {
				error: 'Choose a semester between the placement start and now.',
			};
		}
	}

	const file = formData.get('file');
	if (!(file instanceof File) || file.size === 0) {
		return { error: 'Choose a file to upload.' };
	}
	if (file.size > maxDocumentBytes) {
		return { error: 'The file is larger than 10 MB.' };
	}
	const extension = path.extname(file.name).toLowerCase();
	const bytes = new Uint8Array(await file.arrayBuffer());
	if (
		!allowedDocumentExtensions.includes(extension) ||
		!fileMatchesExtension(bytes, extension)
	) {
		return { error: 'Documents must be PDF, PNG or JPG files.' };
	}

	const storedFileName = `${randomUUID()}${extension}`;
	await mkdir(documentsDirectory, { recursive: true });
	await writeFile(path.join(documentsDirectory, storedFileName), bytes);

	let replacedFileName: string | null;
	try {
		replacedFileName = await saveDocument({
			id: randomUUID(),
			placementId: placement.id,
			documentType,
			semester,
			originalFileName: cleanOriginalFileName(file.name),
			storedFileName,
			fileSize: file.size,
			uploadedAt: new Date().toISOString(),
		});
	} catch (error) {
		await rm(path.join(documentsDirectory, storedFileName), { force: true });
		throw error;
	}
	if (replacedFileName) {
		await rm(path.join(documentsDirectory, replacedFileName), { force: true });
	}

	revalidateDocumentPages(placement.id);
	return { success: true };
}

export async function deleteDocumentAction(documentId: string) {
	const user = await getCurrentUser();
	if (!user || user.role !== 'student') {
		redirect('/');
	}

	const document = await getDocumentById(documentId);
	if (!document || document.studentId !== user.id) {
		return { error: 'Document not found.' };
	}

	await deleteDocument(document.id);
	await rm(path.join(documentsDirectory, document.storedFileName), {
		force: true,
	});

	revalidateDocumentPages(document.placementId);
	return { success: true };
}
