import Link from 'next/link';
import { HoursProgress } from '@/components/hours-progress';
import { StudentStatusBadge } from '@/components/status-badge';
import { documentProgress } from '@/lib/documents';
import {
	getDocumentsForStudent,
	getEntriesForStudent,
	getPlacementsForStudent,
} from '@/lib/repository';
import {
	currentPlacement,
	placementCompletion,
	sumVerifiedHours,
} from '@/lib/logbook-metrics';
import { requireRole } from '@/lib/session';

export default async function StudentDashboardPage() {
	const user = await requireRole('student');

	const placements = await getPlacementsForStudent(user.id);
	const entries = await getEntriesForStudent(user.id);
	const documents = await getDocumentsForStudent(user.id);
	const latest = currentPlacement(placements);
	const latestCompletion = latest
		? placementCompletion(latest, entries)
		: null;

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

			{latest && latestCompletion?.completed ? (
				<p className='rounded-md border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800'>
					Your {latest.title} at {latest.companyName} is completed (
					{latestCompletion.completedOn}). Add your next WIL placement to
					continue logging hours.
				</p>
			) : null}

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
						const completion = placementCompletion(placement, entries);
						const paperwork = documentProgress(
							placement,
							documents,
							completion.completedOn,
						);
						return (
							<Link
								key={placement.id}
								href={`/student/placements/${placement.id}`}
								className='block space-y-3 rounded-lg border border-zinc-200 bg-white p-5 hover:border-zinc-400'
							>
								<div>
									<div className='flex flex-wrap items-center gap-2'>
										<p className='font-semibold text-zinc-900'>
											{placement.title}
										</p>
										{completion.completed ? (
											<StudentStatusBadge status='wil_completed' />
										) : null}
									</div>
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
									{placementEntries.length === 1 ? 'entry' : 'entries'} ·
									documents {paperwork.uploadedOnce} of{' '}
									{paperwork.requiredOnce} · attendance registers{' '}
									{paperwork.uploadedRegisters} of {paperwork.expectedRegisters}
								</p>
							</Link>
						);
					})}
				</section>
			)}
		</div>
	);
}
