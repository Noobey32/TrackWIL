import type { LogbookEntry, StudentOverviewStatus } from "@/lib/types";

const OVERDUE_DAYS_WITHOUT_VERIFIED_ENTRY = 14;

export function sumVerifiedHours(entries: LogbookEntry[]): number {
  return entries
    .filter((entry) => entry.status === "verified")
    .reduce((total, entry) => total + entry.hours, 0);
}

export function studentOverviewStatus(
  entries: LogbookEntry[],
  now: Date = new Date(),
): StudentOverviewStatus {
  if (
    entries.some((entry) => entry.status === "pending_verification")
  ) {
    return "awaiting_verification";
  }

  const verifiedEntries = entries.filter(
    (entry) => entry.status === "verified",
  );
  if (verifiedEntries.length === 0) {
    return "overdue";
  }

  const latestVerified = verifiedEntries.reduce((latest, entry) => {
    const verifiedAt = entry.verifiedAt ?? entry.updatedAt;
    return verifiedAt > latest ? verifiedAt : latest;
  }, verifiedEntries[0].verifiedAt ?? verifiedEntries[0].updatedAt);

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
