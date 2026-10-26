import Link from 'next/link';
import { NewEntryForm } from '@/components/new-entry-form';
import { getPlacementsForStudent } from '@/lib/repository';
import { requireRole } from '@/lib/session';

export default async function NewLogbookEntryPage({
	searchParams,
}: {
	searchParams: Promise<{ placement?: string }>;
}) {
	const user = await requireRole('student');

	const placements = await getPlacementsForStudent(user.id);
	const { placement: requestedPlacementId } = await searchParams;
	// Preselect the placement the student came from, otherwise the most recent one.
	const defaultPlacement =
		placements.find((placement) => placement.id === requestedPlacementId) ??
		placements[0];

	return (
		<div className='mx-auto max-w-xl space-y-6'>
			<div>
				<Link
					href={
						defaultPlacement
							? `/student/placements/${defaultPlacement.id}`
							: '/student'
					}
					className='text-sm text-zinc-600 hover:underline'
				>
					Back to logbook
				</Link>
				<h1 className='mt-2 text-2xl font-semibold text-zinc-900'>
					New logbook entry
				</h1>
			</div>
			<div className='rounded-lg border border-zinc-200 bg-white p-6'>
				{defaultPlacement ? (
					<NewEntryForm
						placements={placements}
						defaultPlacementId={defaultPlacement.id}
					/>
				) : (
					<p className='text-sm text-zinc-600'>
						Add a WIL placement before you record entries.{' '}
						<Link href='/student/placements/new' className='underline'>
							Add WIL placement
						</Link>
					</p>
				)}
			</div>
		</div>
	);
}
