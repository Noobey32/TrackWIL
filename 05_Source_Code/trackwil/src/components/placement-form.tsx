'use client';

import { useActionState } from 'react';
import {
	createPlacementAction,
	updatePlacementAction,
} from '@/app/actions/placements';
import type { WilPlacement } from '@/lib/types';

/** Adds a new WIL placement, or edits `placement` when one is given. */
export function PlacementForm({ placement }: { placement?: WilPlacement }) {
	const [state, formAction, isPending] = useActionState(
		async (_previousState: { error?: string } | null, formData: FormData) => {
			return placement
				? updatePlacementAction(formData)
				: createPlacementAction(formData);
		},
		null,
	);

	return (
		<form action={formAction} className='space-y-4'>
			{placement ? (
				<input type='hidden' name='placementId' value={placement.id} />
			) : null}
			<div>
				<label htmlFor='title' className='mb-1 block text-sm font-medium'>
					Placement title
				</label>
				<input
					id='title'
					name='title'
					type='text'
					required
					placeholder='WIL 1'
					defaultValue={placement?.title}
					className='w-full rounded-md border border-zinc-300 px-3 py-2 text-sm'
				/>
			</div>
			<div>
				<label htmlFor='companyName' className='mb-1 block text-sm font-medium'>
					Company
				</label>
				<input
					id='companyName'
					name='companyName'
					type='text'
					required
					placeholder='Host company name'
					defaultValue={placement?.companyName}
					className='w-full rounded-md border border-zinc-300 px-3 py-2 text-sm'
				/>
			</div>
			<div>
				<label
					htmlFor='requiredHours'
					className='mb-1 block text-sm font-medium'
				>
					Required hours
				</label>
				<input
					id='requiredHours'
					name='requiredHours'
					type='number'
					min='1'
					max='5000'
					step='0.5'
					required
					defaultValue={placement?.requiredHours}
					className='w-full rounded-md border border-zinc-300 px-3 py-2 text-sm'
				/>
				<p className='mt-1 text-xs text-zinc-500'>
					The number of WIL hours this placement requires.
				</p>
			</div>
			<div>
				<label htmlFor='startDate' className='mb-1 block text-sm font-medium'>
					Start date
				</label>
				<input
					id='startDate'
					name='startDate'
					type='date'
					required
					defaultValue={placement?.startDate}
					className='w-full rounded-md border border-zinc-300 px-3 py-2 text-sm'
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
				{isPending ? 'Saving...' : placement ? 'Save changes' : 'Add placement'}
			</button>
		</form>
	);
}
