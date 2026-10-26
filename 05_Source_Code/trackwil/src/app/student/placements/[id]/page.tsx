import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HoursProgress } from '@/components/hours-progress';
import { PlacementDocuments } from '@/components/placement-documents';
import { EntryStatusBadge } from '@/components/status-badge';
import {
	getDocumentsForPlacement,
	getEntriesForPlacement,
	getPlacementById,
} from '@/lib/repository';
import { sumVerifiedHours } from '@/lib/logbook-metrics';
import { requireRole } from '@/lib/session';

export default async function PlacementLogbookPage({
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

	const entries = await getEntriesForPlacement(placement.id);
	const documents = await getDocumentsForPlacement(placement.id);

	return (
		<div className='space-y-8'>
			<div>
				<Link href='/student' className='text-sm text-zinc-600 hover:underline'>
					Back to placements
				</Link>
				<section className='mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
					<div>
						<h1 className='text-2xl font-semibold text-zinc-900'>
							{placement.title} logbook
						</h1>
						<p className='mt-1 text-sm text-zinc-600'>
							{placement.companyName} · started {placement.startDate} ·{' '}
							<Link
								href={`/student/placements/${placement.id}/edit`}
								className='underline'
							>
								Edit placement
							</Link>
						</p>
					</div>
					<Link
						href={`/student/entries/new?placement=${placement.id}`}
						className='inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800'
					>
						New entry
					</Link>
				</section>
			</div>

			<section className='max-w-md'>
				<HoursProgress
					verifiedHours={sumVerifiedHours(entries)}
					requiredHours={placement.requiredHours}
				/>
			</section>

			<PlacementDocuments
				placement={placement}
				documents={documents}
				canEdit
			/>

			<section className='space-y-3'>
				<h2 className='text-lg font-semibold text-zinc-900'>Logbook entries</h2>
				<div className='overflow-x-auto rounded-lg border border-zinc-200 bg-white'>
					<table className='min-w-full text-left text-sm'>
						<thead className='border-b border-zinc-200 bg-zinc-50 text-zinc-600'>
							<tr>
								<th className='px-4 py-3 font-medium'>Date</th>
								<th className='px-4 py-3 font-medium'>Hours</th>
								<th className='px-4 py-3 font-medium'>Status</th>
								<th className='px-4 py-3 font-medium'>Description</th>
							</tr>
						</thead>
						<tbody>
							{entries.length === 0 ? (
								<tr>
									<td className='px-4 py-6 text-zinc-500' colSpan={4}>
										No entries yet. Create your first logbook entry.
									</td>
								</tr>
							) : (
								entries.map((entry) => (
									<tr key={entry.id} className='border-b border-zinc-100'>
										<td className='px-4 py-3'>
											<Link
												href={`/student/entries/${entry.id}`}
												className='font-medium text-zinc-900 hover:underline'
											>
												{entry.workDate}
											</Link>
										</td>
										<td className='px-4 py-3'>{entry.hours}</td>
										<td className='px-4 py-3'>
											<EntryStatusBadge status={entry.status} />
										</td>
										<td className='px-4 py-3 text-zinc-600'>
											{entry.description}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	);
}
