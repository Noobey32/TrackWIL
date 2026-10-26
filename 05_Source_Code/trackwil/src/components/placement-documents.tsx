import { DeleteDocumentButton } from '@/components/delete-document-button';
import { DocumentUploadForm } from '@/components/document-upload-form';
import {
	attendanceSemesters,
	documentTypeLabel,
	formatFileSize,
	oncePerPlacementDocumentTypes,
	semesterLabel,
	semestersForPlacement,
} from '@/lib/documents';
import type {
	DocumentType,
	PlacementDocument,
	WilPlacement,
} from '@/lib/types';

type DocumentSlot = {
	key: string;
	label: string;
	documentType: DocumentType;
	semester?: string;
	document?: PlacementDocument;
	/** False for a register whose semester is outside the placement's dates. */
	canUpload: boolean;
};

/**
 * A placement's WIL documents: the once-off documents and one attendance register per semester.
 * Students (canEdit) can upload, replace and remove; staff only view.
 */
export function PlacementDocuments({
	placement,
	documents,
	canEdit,
}: {
	placement: WilPlacement;
	documents: PlacementDocument[];
	canEdit: boolean;
}) {
	const onceOffSlots: DocumentSlot[] = oncePerPlacementDocumentTypes.map(
		(documentType) => ({
			key: documentType,
			label: documentTypeLabel(documentType),
			documentType,
			document: documents.find((document) => document.documentType === documentType),
			canUpload: true,
		}),
	);
	const validSemesters = semestersForPlacement(placement.startDate);
	const registerSlots: DocumentSlot[] = attendanceSemesters(
		placement,
		documents,
	).map((semester) => ({
		key: `attendance_register-${semester}`,
		label: semesterLabel(semester),
		documentType: 'attendance_register',
		semester,
		document: documents.find(
			(document) =>
				document.documentType === 'attendance_register' &&
				document.semester === semester,
		),
		canUpload: validSemesters.includes(semester),
	}));

	return (
		<section className='space-y-4'>
			<div>
				<h2 className='text-lg font-semibold text-zinc-900'>Documents</h2>
				{canEdit ? (
					<p className='mt-1 text-sm text-zinc-600'>
						Upload PDF, PNG or JPG files up to 10 MB. Uploading again replaces
						the previous file.
					</p>
				) : null}
			</div>
			<DocumentList
				title='Placement documents'
				slots={onceOffSlots}
				placementId={placement.id}
				canEdit={canEdit}
			/>
			<DocumentList
				title='Attendance registers (one per semester)'
				slots={registerSlots}
				placementId={placement.id}
				canEdit={canEdit}
			/>
		</section>
	);
}

function DocumentList({
	title,
	slots,
	placementId,
	canEdit,
}: {
	title: string;
	slots: DocumentSlot[];
	placementId: string;
	canEdit: boolean;
}) {
	return (
		<div className='rounded-lg border border-zinc-200 bg-white'>
			<h3 className='border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-600'>
				{title}
			</h3>
			<ul className='divide-y divide-zinc-100'>
				{slots.map((slot) => (
					<li
						key={slot.key}
						className='flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between'
					>
						<div className='min-w-0 space-y-1'>
							<div className='flex flex-wrap items-center gap-2'>
								<p className='font-medium text-zinc-900'>{slot.label}</p>
								<DocumentStatusBadge uploaded={Boolean(slot.document)} />
							</div>
							{slot.document ? (
								<p className='text-xs break-all text-zinc-500'>
									{slot.document.originalFileName} ·{' '}
									{formatFileSize(slot.document.fileSize)} · uploaded{' '}
									{slot.document.uploadedAt.slice(0, 10)}
								</p>
							) : null}
							{slot.document ? (
								<div className='flex flex-wrap items-center gap-3'>
									<a
										href={`/api/documents/${slot.document.id}`}
										target='_blank'
										rel='noreferrer'
										className='text-sm font-medium text-zinc-900 underline'
									>
										View
									</a>
									{canEdit ? (
										<DeleteDocumentButton
											documentId={slot.document.id}
											documentName={
												slot.semester
													? `attendance register for ${slot.label}`
													: slot.label
											}
										/>
									) : null}
								</div>
							) : null}
						</div>
						{canEdit && slot.canUpload ? (
							<div className='sm:max-w-xs'>
								<DocumentUploadForm
									placementId={placementId}
									documentType={slot.documentType}
									semester={slot.semester}
									hasFile={Boolean(slot.document)}
								/>
							</div>
						) : null}
					</li>
				))}
			</ul>
		</div>
	);
}

function DocumentStatusBadge({ uploaded }: { uploaded: boolean }) {
	return uploaded ? (
		<span className='inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800'>
			Uploaded
		</span>
	) : (
		<span className='inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800'>
			Missing
		</span>
	);
}
