import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HoursProgress } from '@/components/hours-progress';
import { PlacementDocuments } from '@/components/placement-documents';
import {
	EntryStatusBadge,
	StudentStatusBadge,
} from '@/components/status-badge';
import { documentProgress } from '@/lib/documents';
import { studentOverviewStatus, sumVerifiedHours } from '@/lib/logbook-metrics';
import {
	getDocumentsForStudent,
	getEntriesForStudent,
	getPlacementsForStudent,
	getUserById,
} from '@/lib/repository';
import { requireRole } from '@/lib/session';
import type { LogbookEntry } from '@/lib/types';

/** Everything about one student for coordinators and lecturers: placements, logbooks and documents. */
export default async function StudentProfilePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	await requireRole('coordinator', 'lecturer');
	const { id } = await params;
	const student = await getUserById(id);
	if (!student || student.role !== 'student') {
		notFound();
	}

	const placements = await getPlacementsForStudent(student.id);
	const entries = await getEntriesForStudent(student.id);
	const documents = await getDocumentsForStudent(student.id);

	const requiredHours = placements.reduce(
		(total, placement) => total + placement.requiredHours,
		0,
	);
	const pendingCount = entries.filter(
		(entry) => entry.status === 'pending_verification',
	).length;
	const paperwork = placements
		.map((placement) => documentProgress(placement, documents))
		.reduce(
			(total, progress) => ({
				uploaded:
					total.uploaded + progress.uploadedOnce + progress.uploadedRegisters,
				expected:
					total.expected + progress.requiredOnce + progress.expectedRegisters,
			}),
			{ uploaded: 0, expected: 0 },
		);

	return (
		<div className='space-y-8'>
			<div>
				<Link
					href='/coordinator'
					className='text-sm text-zinc-600 hover:underline'
				>
					Back to dashboard
				</Link>
				<div className='mt-2 flex flex-wrap items-center gap-3'>
					<h1 className='text-2xl font-semibold text-zinc-900'>
						{student.fullName}
					</h1>
					<StudentStatusBadge status={studentOverviewStatus(entries)} />
				</div>
				<p className='mt-1 text-sm text-zinc-600'>{student.email}</p>
			</div>

			<section className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
				<SummaryTile
					label='Verified hours'
					value={`${sumVerifiedHours(entries)} / ${requiredHours}`}
				/>
				<SummaryTile label='WIL placements' value={String(placements.length)} />
				<SummaryTile label='Pending verification' value={String(pendingCount)} />
				<SummaryTile
					label='Documents uploaded'
					value={`${paperwork.uploaded} / ${paperwork.expected}`}
				/>
			</section>

			{placements.length === 0 ? (
				<p className='rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600'>
					This student has not added a WIL placement yet.
				</p>
			) : null}

			{placements.length > 1 ? (
				<nav className='flex flex-wrap gap-2 text-sm' aria-label='Placements'>
					{placements.map((placement) => (
						<a
							key={placement.id}
							href={`#placement-${placement.id}`}
							className='rounded-full border border-zinc-300 bg-white px-3 py-1 text-zinc-700 hover:bg-zinc-50'
						>
							{placement.title} · {placement.companyName}
						</a>
					))}
				</nav>
			) : null}

			{placements.map((placement) => {
				const placementEntries = entries.filter(
					(entry) => entry.placementId === placement.id,
				);
				return (
					<section
						key={placement.id}
						id={`placement-${placement.id}`}
						className='scroll-mt-6 space-y-6 rounded-lg border border-zinc-300 bg-zinc-50/50 p-4 sm:p-6'
					>
						<div className='space-y-3'>
							<div>
								<h2 className='text-xl font-semibold text-zinc-900'>
									{placement.title}
								</h2>
								<p className='text-sm text-zinc-600'>
									{placement.companyName} · started {placement.startDate}
								</p>
							</div>
							<div className='max-w-md'>
								<HoursProgress
									verifiedHours={sumVerifiedHours(placementEntries)}
									requiredHours={placement.requiredHours}
								/>
							</div>
						</div>

						<PlacementDocuments
							placement={placement}
							documents={documents.filter(
								(document) => document.placementId === placement.id,
							)}
							canEdit={false}
						/>

						<div className='space-y-3'>
							<h2 className='text-lg font-semibold text-zinc-900'>Logbook</h2>
							<StaffLogbookTable entries={placementEntries} />
						</div>
					</section>
				);
			})}
		</div>
	);
}

function SummaryTile({ label, value }: { label: string; value: string }) {
	return (
		<div className='rounded-lg border border-zinc-200 bg-white p-4'>
			<p className='text-xs text-zinc-500'>{label}</p>
			<p className='mt-1 text-lg font-semibold text-zinc-900'>{value}</p>
		</div>
	);
}

function StaffLogbookTable({ entries }: { entries: LogbookEntry[] }) {
	return (
		<div className='overflow-x-auto rounded-lg border border-zinc-200 bg-white'>
			<table className='min-w-full text-left text-sm'>
				<thead className='border-b border-zinc-200 bg-zinc-50 text-zinc-600'>
					<tr>
						<th className='px-4 py-3 font-medium'>Date</th>
						<th className='px-4 py-3 font-medium'>Hours</th>
						<th className='px-4 py-3 font-medium'>Status</th>
						<th className='px-4 py-3 font-medium'>Description</th>
						<th className='px-4 py-3 font-medium'>Mentor</th>
						<th className='px-4 py-3 font-medium'>Evidence</th>
					</tr>
				</thead>
				<tbody>
					{entries.length === 0 ? (
						<tr>
							<td className='px-4 py-6 text-zinc-500' colSpan={6}>
								No logbook entries for this placement yet.
							</td>
						</tr>
					) : (
						entries.map((entry) => (
							<tr key={entry.id} className='border-b border-zinc-100 align-top'>
								<td className='px-4 py-3 whitespace-nowrap'>{entry.workDate}</td>
								<td className='px-4 py-3'>{entry.hours}</td>
								<td className='px-4 py-3'>
									<EntryStatusBadge status={entry.status} />
								</td>
								<td className='px-4 py-3 text-zinc-600'>{entry.description}</td>
								<td className='px-4 py-3 text-zinc-600'>
									{entry.mentorEmail ?? 'Not set'}
								</td>
								<td className='px-4 py-3'>
									{entry.evidenceFileName ? (
										<a
											href={`/api/evidence/${entry.evidenceFileName}`}
											target='_blank'
											rel='noreferrer'
											className='font-medium text-zinc-900 underline'
										>
											View
										</a>
									) : (
										<span className='text-zinc-400'>None</span>
									)}
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
}
