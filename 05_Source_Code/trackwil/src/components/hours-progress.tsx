/** Verified hours against a placement's required hours, as text and a bar. */
export function HoursProgress({
	verifiedHours,
	requiredHours,
}: {
	verifiedHours: number;
	requiredHours: number;
}) {
	const percent = Math.min(100, Math.round((verifiedHours / requiredHours) * 100));

	return (
		<div className='space-y-1'>
			<p className='text-sm text-zinc-600'>
				{verifiedHours} of {requiredHours} verified hours completed
			</p>
			<div
				className='h-2 w-full overflow-hidden rounded-full bg-zinc-100'
				role='progressbar'
				aria-valuenow={percent}
				aria-valuemin={0}
				aria-valuemax={100}
			>
				<div
					className='h-full rounded-full bg-emerald-500'
					style={{ width: `${percent}%` }}
				/>
			</div>
		</div>
	);
}
