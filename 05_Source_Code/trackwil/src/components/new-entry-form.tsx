'use client';

import { useActionState } from 'react';
import { createLogbookEntryAction } from '@/app/actions/logbook';
import { maxDocumentBytes } from '@/lib/documents';
import type { WilPlacement } from '@/lib/types';

export function NewEntryForm({
	placements,
	defaultPlacementId,
}: {
	placements: WilPlacement[];
	defaultPlacementId: string;
}) {
	const [state, formAction, isPending] = useActionState(
		async (_previousState: { error?: string } | null, formData: FormData) => {
			// Checked here first so an oversized file is never sent to the server.
			const evidence = formData.get('evidence');
			if (evidence instanceof File && evidence.size > maxDocumentBytes) {
				return { error: 'Evidence files cannot be larger than 10 MB.' };
			}
			return createLogbookEntryAction(formData);
		},
		null,
	);

	return (
		<form action={formAction} className='space-y-4'>
			<div>
				<label htmlFor='placementId' className='mb-1 block text-sm font-medium'>
					WIL placement
				</label>
				<select
					id='placementId'
					name='placementId'
					required
					defaultValue={defaultPlacementId}
					className='w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm'
				>
					{placements.map((placement) => (
						<option key={placement.id} value={placement.id}>
							{placement.title} ({placement.companyName})
						</option>
					))}
				</select>
			</div>
			<div>
				<label htmlFor='workDate' className='mb-1 block text-sm font-medium'>
					Work date
				</label>
				<input
					id='workDate'
					name='workDate'
					type='date'
					required
					className='w-full rounded-md border border-zinc-300 px-3 py-2 text-sm'
				/>
			</div>
			<div>
				<label htmlFor='description' className='mb-1 block text-sm font-medium'>
					What did you do?
				</label>
				<textarea
					id='description'
					name='description'
					required
					rows={4}
					className='w-full rounded-md border border-zinc-300 px-3 py-2 text-sm'
				/>
			</div>
			<div>
				<label htmlFor='hours' className='mb-1 block text-sm font-medium'>
					Hours
				</label>
				<input
					id='hours'
					name='hours'
					type='number'
					min='0.5'
					step='0.5'
					required
					className='w-full rounded-md border border-zinc-300 px-3 py-2 text-sm'
				/>
			</div>
			<div>
				<label htmlFor='mentorEmail' className='mb-1 block text-sm font-medium'>
					Workplace mentor email
				</label>
				<input
					id='mentorEmail'
					name='mentorEmail'
					type='email'
					placeholder='mentor@company.co.za'
					className='w-full rounded-md border border-zinc-300 px-3 py-2 text-sm'
				/>
				<p className='mt-1 text-xs text-zinc-500'>
					Required before you submit the entry for verification.
				</p>
			</div>
			<div>
				<label htmlFor='evidence' className='mb-1 block text-sm font-medium'>
					Evidence (optional, up to 10 MB)
				</label>
				<input
					id='evidence'
					name='evidence'
					type='file'
					accept='.pdf,.png,.jpg,.jpeg,.webp'
					className='w-full text-sm'
				/>
			</div>
			{state?.error ? (
				<p className='text-sm text-rose-600'>{state.error}</p>
			) : null}
			<button
				type='submit'
				disabled={isPending}
				className='rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60'
			>
				{isPending ? 'Saving...' : 'Save entry'}
			</button>
		</form>
	);
}

