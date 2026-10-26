import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyVerificationLink } from "@/components/copy-verification-link";
import { SubmitForVerification } from "@/components/submit-for-verification";
import { EntryStatusBadge } from "@/components/status-badge";
import { placementCompletion } from "@/lib/logbook-metrics";
import {
  getActiveVerificationTokenForEntry,
  getEntriesForPlacement,
  getLogbookEntryById,
  getPlacementById,
} from "@/lib/repository";
import { getAppOrigin } from "@/lib/request-url";
import { requireRole } from "@/lib/session";

export default async function LogbookEntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("student");

  const { id } = await params;
  const entry = await getLogbookEntryById(id);
  if (!entry || entry.studentId !== user.id) {
    notFound();
  }

  const activeToken =
    entry.status === "pending_verification"
      ? await getActiveVerificationTokenForEntry(entry.id)
      : undefined;

  // A completed placement is locked: none of its entries can be submitted any more.
  const placement = await getPlacementById(entry.placementId);
  const placementLocked = placement
    ? placementCompletion(placement, await getEntriesForPlacement(placement.id))
        .completed
    : false;

  // A pending entry whose link has expired can be submitted again for a new link.
  const linkExpired = entry.status === "pending_verification" && !activeToken;
  const canSubmit =
    !placementLocked &&
    (entry.status === "draft" || entry.status === "rejected" || linkExpired);
  const appOrigin = activeToken ? await getAppOrigin() : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/student/placements/${entry.placementId}`}
          className="text-sm text-zinc-600 hover:underline"
        >
          Back to logbook
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Entry for {entry.workDate}
          </h1>
          <EntryStatusBadge status={entry.status} />
        </div>
      </div>

      <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-6">
        <p>
          <span className="font-medium text-zinc-900">Hours:</span> {entry.hours}
        </p>
        <p>
          <span className="font-medium text-zinc-900">Mentor email:</span>{" "}
          {entry.mentorEmail ?? "Not set"}
        </p>
        <p className="text-zinc-700">{entry.description}</p>
        {entry.evidenceFileName ? (
          <p>
            <a
              href={`/api/evidence/${entry.evidenceFileName}`}
              className="text-sm font-medium text-zinc-900 underline"
              target="_blank"
              rel="noreferrer"
            >
              View evidence
            </a>
          </p>
        ) : null}
      </section>

      {placementLocked && entry.status !== "verified" ? (
        <p className="rounded-md border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
          This entry belongs to a completed WIL placement, which is locked, so
          it can no longer be submitted for verification.
        </p>
      ) : null}

      {linkExpired && !placementLocked ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          The verification link for this entry has expired. Submit it again to get a new link.
        </p>
      ) : null}

      {canSubmit ? <SubmitForVerification entryId={entry.id} /> : null}

      {activeToken && appOrigin ? (
        <CopyVerificationLink
          verificationPath={`/verify/${activeToken.token}`}
          verificationUrl={`${appOrigin}/verify/${activeToken.token}`}
        />
      ) : null}
    </div>
  );
}
