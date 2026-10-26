import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PlacementForm } from '@/components/placement-form';
import { placementCompletion } from '@/lib/logbook-metrics';
import { getEntriesForPlacement, getPlacementById } from '@/lib/repository';
import { requireRole } from '@/lib/session';

export default async function EditPlacementPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const user = await requireRole('student');

	const { id } = await params;
	const placement = await getPlacementById(id);
	if (!placement || placement.studentId !== user.id) {
		notFound();
	}
	const { completed } = placementCompletion(
		placement,
		await getEntriesForPlacement(placement.id),
	);

	return (
		<div className='mx-auto max-w-xl space-y-6'>
			<div>
				<Link
					href={`/student/placements/${placement.id}`}
					className='text-sm text-zinc-600 hover:underline'
				>
					Back to {placement.title}
				</Link>
				<h1 className='mt-2 text-2xl font-semibold text-zinc-900'>
					Edit placement
				</h1>
			</div>
			<div className='rounded-lg border border-zinc-200 bg-white p-6'>
				{completed ? (
					<p className='text-sm text-zinc-600'>
						This WIL placement is completed and locked, so it can no longer be
						edited.
					</p>
				) : (
					<PlacementForm placement={placement} />
				)}
			</div>
		</div>
	);
}
