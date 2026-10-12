'use client';

import { useActionState } from 'react';
import { signupAction } from '@/app/actions/auth';

export function SignupForm() {
	const [state, formAction, isPending] = useActionState(
		async (_previousState: { error?: string } | null, formData: FormData) => {
			return signupAction(formData);
		},
		null,
	);

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		formAction(new FormData(event.currentTarget));
	}

	return (
		<form onSubmit={handleSubmit} className='space-y-4'>
			<div>
				<label htmlFor='fullName' className='mb-1 block text-sm font-medium'>
					Full name
				</label>
				<input
					id='fullName'
					name='fullName'
					type='text'
					required
					autoComplete='name'
					className='w-full rounded-md border border-zinc-300 px-3 py-2 text-sm'
				/>
			</div>
			<div>
				<label htmlFor='email' className='mb-1 block text-sm font-medium'>
					Student email
				</label>
				<input
					id='email'
					name='email'
					type='text'
					required
					autoComplete='email'
					className='w-full rounded-md border border-zinc-300 px-3 py-2 text-sm'
					placeholder='20260053@ctucareer.co.za'
				/>
			</div>
			<div>
				<label htmlFor='password' className='mb-1 block text-sm font-medium'>
					Password
				</label>
				<input
					id='password'
					name='password'
					type='password'
					required
					autoComplete='new-password'
					className='w-full rounded-md border border-zinc-300 px-3 py-2 text-sm'
				/>
				<p className='mt-1 text-xs text-zinc-500'>
					At least 8 characters with uppercase, lowercase, a number, and a
					special character.
				</p>
			</div>
			{state?.error ? (
				<p className='text-sm text-rose-600'>{state.error}</p>
			) : null}
			<button
				type='submit'
				disabled={isPending}
				className='w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60'
			>
				{isPending ? 'Creating account...' : 'Create account'}
			</button>
		</form>
	);
}

