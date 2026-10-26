import Link from 'next/link';
import { StudentStatusBadge } from '@/components/status-badge';
import { documentProgress } from '@/lib/documents';
import {
	getDocuments,
	getLogbookEntries,
	getPlacements,
	getUsers,
} from '@/lib/repository';
import { studentOverviewStatus, sumVerifiedHours } from '@/lib/logbook-metrics';
import { requireRole } from '@/lib/session';

export default async function CoordinatorDashboardPage() {
	await requireRole('coordinator', 'lecturer');
	const users = await getUsers();
	const students = users.filter((user) => user.role === 'student');
	const allEntries = await getLogbookEntries();
	const allPlacements = await getPlacements();
	const allDocuments = await getDocuments();

	const rows = await Promise.all(
		students.map(async (student) => {
			const entries = allEntries.filter(
				(entry) => entry.studentId === student.id,
			);
			const status = studentOverviewStatus(entries);
			const verifiedHours = sumVerifiedHours(entries);
			// Totals across all of the student's WIL placements.
			const placements = allPlacements.filter(
				(placement) => placement.studentId === student.id,
			);
			const requiredHours = placements.reduce(
				(total, placement) => total + placement.requiredHours,
				0,
			);
			const pendingCount = entries.filter(
				(entry) => entry.status === 'pending_verification',
			).length;
			// Once-off documents plus one attendance register per semester, for every placement.
			const documents = placements
				.map((placement) => documentProgress(placement, allDocuments))
				.reduce(
					(total, progress) => ({
						uploaded:
							total.uploaded + progress.uploadedOnce + progress.uploadedRegisters,
						expected:
							total.expected + progress.requiredOnce + progress.expectedRegisters,
					}),
					{ uploaded: 0, expected: 0 },
				);

			return {
				student,
				status,
				verifiedHours,
				requiredHours,
				placementCount: placements.length,
				documents,
				pendingCount,
				entryCount: entries.length,
			};
		}),
	);

	return (
		<div className='space-y-6'>
			<div>
				<h1 className='text-2xl font-semibold text-zinc-900'>
					Coordinator dashboard
				</h1>
				<p className='mt-1 text-sm text-zinc-600'>
					Monitor student progress, pending verifications, and overdue logbooks.
					Select a student to see their placements, logbook and documents.
				</p>
			</div>

			<section className='overflow-x-auto rounded-lg border border-zinc-200 bg-white'>
				<table className='min-w-full text-left text-sm'>
					<thead className='border-b border-zinc-200 bg-zinc-50 text-zinc-600'>
						<tr>
							<th className='px-4 py-3 font-medium'>Student</th>
							<th className='px-4 py-3 font-medium'>Status</th>
							<th className='px-4 py-3 font-medium'>Placements</th>
							<th className='px-4 py-3 font-medium'>Verified hours</th>
							<th className='px-4 py-3 font-medium'>Documents</th>
							<th className='px-4 py-3 font-medium'>Entries</th>
							<th className='px-4 py-3 font-medium'>Pending</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={row.student.id} className='border-b border-zinc-100'>
								<td className='px-4 py-3'>
									<Link
										href={`/coordinator/students/${row.student.id}`}
										className='font-medium text-zinc-900 underline-offset-2 hover:underline'
									>
										{row.student.fullName}
									</Link>
									<p className='text-xs text-zinc-500'>{row.student.email}</p>
								</td>
								<td className='px-4 py-3'>
									<StudentStatusBadge status={row.status} />
								</td>
								<td className='px-4 py-3'>{row.placementCount}</td>
								<td className='px-4 py-3'>
									{row.verifiedHours} / {row.requiredHours}
								</td>
								<td className='px-4 py-3'>
									{row.documents.expected === 0 ? (
										<span className='text-zinc-400'>None needed yet</span>
									) : (
										<>
											{row.documents.uploaded} / {row.documents.expected}
											{row.documents.uploaded < row.documents.expected ? (
												<span className='block text-xs text-amber-700'>
													{row.documents.expected - row.documents.uploaded} missing
												</span>
											) : null}
										</>
									)}
								</td>
								<td className='px-4 py-3'>{row.entryCount}</td>
								<td className='px-4 py-3'>{row.pendingCount}</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>
		</div>
	);
}
