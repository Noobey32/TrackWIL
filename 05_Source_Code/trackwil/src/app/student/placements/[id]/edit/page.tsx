import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PlacementForm } from '@/components/placement-form';
import { getPlacementById } from '@/lib/repository';
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
				<PlacementForm placement={placement} />
			</div>
		</div>
	);
}
