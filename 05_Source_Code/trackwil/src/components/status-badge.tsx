import type { LogbookEntry, StudentOverviewStatus } from "@/lib/types";
import { entryStatusLabel, statusLabel } from "@/lib/logbook-metrics";

const overviewStyles: Record<StudentOverviewStatus, string> = {
  on_track: "bg-emerald-100 text-emerald-800",
  awaiting_verification: "bg-amber-100 text-amber-800",
  overdue: "bg-rose-100 text-rose-800",
};

const entryStyles: Record<LogbookEntry["status"], string> = {
  draft: "bg-zinc-100 text-zinc-700",
  pending_verification: "bg-amber-100 text-amber-800",
  verified: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
};

export function StudentStatusBadge({
  status,
}: {
  status: StudentOverviewStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${overviewStyles[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}

export function EntryStatusBadge({
  status,
}: {
  status: LogbookEntry["status"];
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${entryStyles[status]}`}
    >
      {entryStatusLabel(status)}
    </span>
  );
}
