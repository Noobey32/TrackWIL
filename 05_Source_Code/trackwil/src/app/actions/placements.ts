'use server';

/**
 * Student WIL placement actions: add a placement with its required hours, and edit it later.
 * Every logbook entry belongs to one placement, so hours are tracked per placement.
 */

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
	createPlacement,
	getPlacementById,
	updatePlacement,
} from '@/lib/repository';
import { getCurrentUser } from '@/lib/session';
import type { WilPlacement } from '@/lib/types';

const maxRequiredHours = 5000;

type PlacementFields = Pick<
	WilPlacement,
	'title' | 'companyName' | 'requiredHours' | 'startDate'
>;

function readPlacementFields(
	formData: FormData,
): PlacementFields | { error: string } {
	const title = String(formData.get('title') ?? '').trim();
	const companyName = String(formData.get('companyName') ?? '').trim();
	const requiredHours = Number(formData.get('requiredHours'));
	const startDate = String(formData.get('startDate') ?? '').trim();

	if (!title || !companyName || !startDate) {
		return { error: 'Title, company and start date are required.' };
	}
	if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
		return { error: 'Enter a valid start date.' };
	}
	if (!Number.isFinite(requiredHours) || requiredHours <= 0) {
		return { error: 'Required hours must be a positive number.' };
	}
	if (requiredHours > maxRequiredHours) {
		return {
			error: `Required hours cannot be more than ${maxRequiredHours}.`,
		};
	}

	return { title, companyName, requiredHours, startDate };
}

export async function createPlacementAction(formData: FormData) {
	const user = await getCurrentUser();
	if (!user || user.role !== 'student') {
		redirect('/');
	}

	const fields = readPlacementFields(formData);
	if ('error' in fields) {
		return fields;
	}

	const now = new Date().toISOString();
	const placement: WilPlacement = {
		id: randomUUID(),
		studentId: user.id,
		...fields,
		createdAt: now,
		updatedAt: now,
	};
	await createPlacement(placement);

	revalidatePath('/student');
	revalidatePath('/coordinator');
	redirect(`/student/placements/${placement.id}`);
}

export async function updatePlacementAction(formData: FormData) {
	const user = await getCurrentUser();
	if (!user || user.role !== 'student') {
		redirect('/');
	}

	const placementId = String(formData.get('placementId') ?? '');
	const placement = await getPlacementById(placementId);
	if (!placement || placement.studentId !== user.id) {
		return { error: 'Placement not found.' };
	}

	const fields = readPlacementFields(formData);
	if ('error' in fields) {
		return fields;
	}

	await updatePlacement({
		id: placement.id,
		...fields,
		updatedAt: new Date().toISOString(),
	});

	revalidatePath('/student');
	revalidatePath(`/student/placements/${placement.id}`);
	revalidatePath('/coordinator');
	redirect(`/student/placements/${placement.id}`);
}
