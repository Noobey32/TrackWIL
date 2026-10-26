import Link from 'next/link';
import { PlacementForm } from '@/components/placement-form';

export default function NewPlacementPage() {
	return (
		<div className='mx-auto max-w-xl space-y-6'>
			<div>
				<Link href='/student' className='text-sm text-zinc-600 hover:underline'>
					Back to placements
				</Link>
				<h1 className='mt-2 text-2xl font-semibold text-zinc-900'>
					Add WIL placement
				</h1>
			</div>
			<div className='rounded-lg border border-zinc-200 bg-white p-6'>
				<PlacementForm />
			</div>
		</div>
	);
}
