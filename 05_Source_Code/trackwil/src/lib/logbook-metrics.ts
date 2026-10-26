/**
 * Logbook helpers: verified hour totals, when a WIL placement is completed, and the
 * per-student overview status shown to coordinators.
 */
import type {
  LogbookEntry,
  StudentOverviewStatus,
  WilPlacement,
} from "@/lib/types";

const OVERDUE_DAYS_WITHOUT_VERIFIED_ENTRY = 14;

export function sumVerifiedHours(entries: LogbookEntry[]): number {
  return entries
    .filter((entry) => entry.status === "verified")
    .reduce((total, entry) => total + entry.hours, 0);
}

/**
 * A placement is completed once its verified hours reach its required hours.
 * `completedOn` is the date of the verification that reached the total; a completed
 * placement is locked (no new entries, submissions or document changes).
 */
export function placementCompletion(
  placement: WilPlacement,
  entries: LogbookEntry[],
): { completed: boolean; completedOn: string | null } {
  const verifiedEntries = entries
    .filter(
      (entry) =>
        entry.placementId === placement.id && entry.status === "verified",
    )
    .sort((a, b) =>
      (a.verifiedAt ?? a.updatedAt).localeCompare(b.verifiedAt ?? b.updatedAt),
    );

  let total = 0;
  for (const entry of verifiedEntries) {
    total += entry.hours;
    if (total >= placement.requiredHours) {
      return {
        completed: true,
        completedOn: (entry.verifiedAt ?? entry.updatedAt).slice(0, 10),
      };
    }
  }
  return { completed: false, completedOn: null };
}

export const completedPlacementError =
  "This WIL placement is completed and locked. Add a new placement to continue.";

/** The student's current placement: the one that started most recently. */
export function currentPlacement(
  placements: WilPlacement[],
): WilPlacement | undefined {
  return [...placements].sort(
    (a, b) =>
      b.startDate.localeCompare(a.startDate) ||
      b.createdAt.localeCompare(a.createdAt),
  )[0];
}

/**
 * Overview status for the coordinator dashboard, based on the student's current placement:
 * no placement yet, WIL completed, awaiting verification, overdue (no verified entry in the
 * last 14 days, counted from the placement start if nothing is verified yet), or on track.
 */
export function studentOverviewStatus(
  placements: WilPlacement[],
  entries: LogbookEntry[],
  now: Date = new Date(),
): StudentOverviewStatus {
  const placement = currentPlacement(placements);
  if (!placement) {
    return "no_placement";
  }

  const placementEntries = entries.filter(
    (entry) => entry.placementId === placement.id,
  );
  if (placementCompletion(placement, placementEntries).completed) {
    return "wil_completed";
  }

  // Pending work takes priority, then recency of verified entries, then "on track".
  if (
    placementEntries.some((entry) => entry.status === "pending_verification")
  ) {
    return "awaiting_verification";
  }

  const latestVerified = placementEntries
    .filter((entry) => entry.status === "verified")
    .map((entry) => entry.verifiedAt ?? entry.updatedAt)
    .reduce(
      (latest, verifiedAt) => (verifiedAt > latest ? verifiedAt : latest),
      `${placement.startDate}T00:00:00.000Z`,
    );

  const daysSinceVerified =
    (now.getTime() - new Date(latestVerified).getTime()) /
    (1000 * 60 * 60 * 24);

  if (daysSinceVerified > OVERDUE_DAYS_WITHOUT_VERIFIED_ENTRY) {
    return "overdue";
  }

  return "on_track";
}

export function statusLabel(status: StudentOverviewStatus): string {
  switch (status) {
    case "on_track":
      return "On track";
    case "awaiting_verification":
      return "Awaiting verification";
    case "overdue":
      return "Overdue";
    case "wil_completed":
      return "WIL completed";
    case "no_placement":
      return "No placement";
  }
}

export function entryStatusLabel(status: LogbookEntry["status"]): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "pending_verification":
      return "Pending verification";
    case "verified":
      return "Verified";
    case "rejected":
      return "Rejected";
  }
}
