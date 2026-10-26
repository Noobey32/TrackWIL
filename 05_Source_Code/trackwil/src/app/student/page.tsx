import Link from 'next/link';
import { HoursProgress } from '@/components/hours-progress';
import { getEntriesForStudent, getPlacementsForStudent } from '@/lib/repository';
import { sumVerifiedHours } from '@/lib/logbook-metrics';
import { getCurrentUser } from '@/lib/session';

export default async function StudentDashboardPage() {
	const user = await getCurrentUser();
	if (!user) {
		return null;
	}

	const placements = await getPlacementsForStudent(user.id);
	const entries = await getEntriesForStudent(user.id);

	return (
		<div className='space-y-8'>
			<section className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
				<div>
					<h1 className='text-2xl font-semibold text-zinc-900'>
						My WIL placements
					</h1>
					<p className='mt-1 text-sm text-zinc-600'>
						Open a placement to see its logbook and record new entries.
					</p>
				</div>
				<Link
					href='/student/placements/new'
					className='inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800'
				>
					Add WIL placement
				</Link>
			</section>

			{placements.length === 0 ? (
				<section className='rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600'>
					You have no WIL placements yet. Add your placement and its required
					hours to start your logbook.
				</section>
			) : (
				<section className='grid gap-4 sm:grid-cols-2'>
					{placements.map((placement) => {
						const placementEntries = entries.filter(
							(entry) => entry.placementId === placement.id,
						);
						return (
							<Link
								key={placement.id}
								href={`/student/placements/${placement.id}`}
								className='block space-y-3 rounded-lg border border-zinc-200 bg-white p-5 hover:border-zinc-400'
							>
								<div>
									<p className='font-semibold text-zinc-900'>
										{placement.title}
									</p>
									<p className='text-sm text-zinc-600'>
										{placement.companyName} · started {placement.startDate}
									</p>
								</div>
								<HoursProgress
									verifiedHours={sumVerifiedHours(placementEntries)}
									requiredHours={placement.requiredHours}
								/>
								<p className='text-xs text-zinc-500'>
									{placementEntries.length}{' '}
									{placementEntries.length === 1 ? 'entry' : 'entries'}
								</p>
							</Link>
						);
					})}
				</section>
			)}
		</div>
	);
}
