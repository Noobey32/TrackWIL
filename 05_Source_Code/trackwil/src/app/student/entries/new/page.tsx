import Link from 'next/link';
import { NewEntryForm } from '@/components/new-entry-form';

export default function NewLogbookEntryPage() {
	return (
		<div className='mx-auto max-w-xl space-y-6'>
			<div>
				<Link href='/student' className='text-sm text-zinc-600 hover:underline'>
					Back to logbook
				</Link>
				<h1 className='mt-2 text-2xl font-semibold text-zinc-900'>
					New logbook entry
				</h1>
			</div>
			<div className='rounded-lg border border-zinc-200 bg-white p-6'>
				<NewEntryForm />
			</div>
		</div>
	);
}

