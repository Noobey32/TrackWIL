/**
 * WIL document rules shared by the upload action, the pages and the download route:
 * which documents a placement needs, which files are accepted, and how semesters are named.
 */
import type { DocumentType, PlacementDocument, WilPlacement } from '@/lib/types';

/** Documents needed once per placement, in the order they are shown. */
export const oncePerPlacementDocumentTypes = [
	'mou',
	'commencement_letter',
	'code_of_conduct',
] as const satisfies readonly DocumentType[];

export const documentTypes: readonly DocumentType[] = [
	...oncePerPlacementDocumentTypes,
	'attendance_register',
];

export function documentTypeLabel(documentType: DocumentType): string {
	switch (documentType) {
		case 'mou':
			return 'Memorandum of Understanding (MOU)';
		case 'commencement_letter':
			return 'Commencement Letter';
		case 'code_of_conduct':
			return 'Code of Conduct';
		case 'attendance_register':
			return 'Attendance Register';
	}
}

export const maxDocumentBytes = 10 * 1024 * 1024;
export const allowedDocumentExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];

export function documentContentType(extension: string): string {
	switch (extension) {
		case '.pdf':
			return 'application/pdf';
		case '.png':
			return 'image/png';
		default:
			return 'image/jpeg';
	}
}

/** True when the file starts with the signature of the type its extension claims. */
export function fileMatchesExtension(bytes: Uint8Array, extension: string): boolean {
	const startsWith = (signature: number[]) =>
		signature.every((byte, index) => bytes[index] === byte);
	switch (extension) {
		case '.pdf':
			return startsWith([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
		case '.png':
			return startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
		case '.jpg':
		case '.jpeg':
			return startsWith([0xff, 0xd8, 0xff]);
		default:
			return false;
	}
}

export function formatFileSize(bytes: number): string {
	if (bytes < 1024 * 1024) {
		return `${Math.max(1, Math.round(bytes / 1024))} KB`;
	}
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Semester 1 runs January to June and semester 2 July to December, written as "2026-S2". */
export function semesterOf(date: string | Date): string {
	const value = typeof date === 'string' ? new Date(`${date}T00:00:00Z`) : date;
	return `${value.getUTCFullYear()}-S${value.getUTCMonth() < 6 ? 1 : 2}`;
}

export function semesterLabel(semester: string): string {
	const [year, half] = semester.split('-S');
	return `Semester ${half}, ${year}`;
}

/**
 * Semesters a placement can have an attendance register for: from the semester it
 * started up to the current one (or the one it was completed in), newest first.
 */
export function semestersForPlacement(
	startDate: string,
	until: string | Date | null = null,
): string[] {
	const first = semesterOf(startDate);
	const current = semesterOf(until ?? new Date());
	const semesters: string[] = [];
	let [year, half] = first.split('-S').map(Number);
	for (
		let semester = first;
		semester <= current || semesters.length === 0;
		semester = `${year}-S${half}`
	) {
		semesters.push(semester);
		[year, half] = half === 1 ? [year, 2] : [year + 1, 1];
	}
	return semesters.reverse();
}

/**
 * Attendance register semesters to show for a placement: every semester it has run,
 * plus any semester that already has a register (e.g. after the start date was changed).
 */
export function attendanceSemesters(
	placement: WilPlacement,
	documents: PlacementDocument[],
	completedOn: string | null = null,
): string[] {
	const semesters = new Set(
		semestersForPlacement(placement.startDate, completedOn),
	);
	for (const document of documents) {
		if (document.documentType === 'attendance_register' && document.semester) {
			semesters.add(document.semester);
		}
	}
	return [...semesters].sort().reverse();
}

/**
 * How much of a placement's paperwork has been uploaded. A completed placement only
 * expects attendance registers up to the semester it was completed in.
 */
export function documentProgress(
	placement: WilPlacement,
	documents: PlacementDocument[],
	completedOn: string | null = null,
) {
	const placementDocuments = documents.filter(
		(document) => document.placementId === placement.id,
	);
	const expectedSemesters = semestersForPlacement(
		placement.startDate,
		completedOn,
	);
	return {
		uploadedOnce: oncePerPlacementDocumentTypes.filter((documentType) =>
			placementDocuments.some((document) => document.documentType === documentType),
		).length,
		requiredOnce: oncePerPlacementDocumentTypes.length,
		uploadedRegisters: expectedSemesters.filter((semester) =>
			placementDocuments.some(
				(document) =>
					document.documentType === 'attendance_register' &&
					document.semester === semester,
			),
		).length,
		expectedRegisters: expectedSemesters.length,
	};
}
