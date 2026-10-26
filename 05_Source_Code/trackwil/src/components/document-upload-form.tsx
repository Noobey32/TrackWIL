'use client';

import { useActionState } from 'react';
import { uploadDocumentAction } from '@/app/actions/documents';
import { maxDocumentBytes } from '@/lib/documents';
import type { DocumentType } from '@/lib/types';

type UploadState = { error?: string; success?: boolean } | null;

/** Upload (or replace) one document slot of a placement. */
export function DocumentUploadForm({
	placementId,
	documentType,
	semester,
	hasFile,
}: {
	placementId: string;
	documentType: DocumentType;
	semester?: string;
	hasFile: boolean;
}) {
	const [state, formAction, isPending] = useActionState(
		async (_previousState: UploadState, formData: FormData) => {
			// Checked here first so an oversized file is never sent to the server.
			const file = formData.get('file');
			if (file instanceof File && file.size > maxDocumentBytes) {
				return { error: 'The file is larger than 10 MB.' };
			}
			return uploadDocumentAction(formData);
		},
		null,
	);

	return (
		<form action={formAction} className='space-y-1'>
			<input type='hidden' name='placementId' value={placementId} />
			<input type='hidden' name='documentType' value={documentType} />
			{semester ? <input type='hidden' name='semester' value={semester} /> : null}
			<div className='flex flex-wrap items-center gap-2'>
				<input
					name='file'
					type='file'
					required
					accept='.pdf,.png,.jpg,.jpeg'
					aria-label={hasFile ? 'Replacement file' : 'File to upload'}
					className='max-w-full text-sm file:mr-2 file:rounded-md file:border file:border-zinc-300 file:bg-white file:px-2 file:py-1 file:text-sm'
				/>
				<button
					type='submit'
					disabled={isPending}
					className='rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60'
				>
					{isPending ? 'Uploading...' : hasFile ? 'Replace' : 'Upload'}
				</button>
			</div>
			{state?.error ? (
				<p className='text-sm text-rose-600'>{state.error}</p>
			) : null}
		</form>
	);
}
