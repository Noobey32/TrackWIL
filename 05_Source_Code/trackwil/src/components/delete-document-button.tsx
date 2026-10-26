'use client';

import { useState, useTransition } from 'react';
import { deleteDocumentAction } from '@/app/actions/documents';

export function DeleteDocumentButton({
	documentId,
	documentName,
}: {
	documentId: string;
	documentName: string;
}) {
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	function handleClick() {
		if (!window.confirm(`Remove the ${documentName}?`)) {
			return;
		}
		startTransition(async () => {
			const result = await deleteDocumentAction(documentId);
			setError(result.error ?? null);
		});
	}

	return (
		<>
			<button
				type='button'
				onClick={handleClick}
				disabled={isPending}
				className='text-sm text-rose-700 underline disabled:opacity-60'
			>
				{isPending ? 'Removing...' : 'Remove'}
			</button>
			{error ? <span className='text-sm text-rose-600'>{error}</span> : null}
		</>
	);
}
