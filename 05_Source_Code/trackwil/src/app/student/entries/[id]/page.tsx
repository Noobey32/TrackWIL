import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CopyVerificationLink } from "@/components/copy-verification-link";
import { SubmitForVerification } from "@/components/submit-for-verification";
import { EntryStatusBadge } from "@/components/status-badge";
import {
  getActiveVerificationTokenForEntry,
  getLogbookEntryById,
} from "@/lib/repository";
import { getAppOrigin } from "@/lib/request-url";
import { getCurrentUser } from "@/lib/session";

export default async function LogbookEntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const { id } = await params;
  const entry = await getLogbookEntryById(id);
  if (!entry || entry.studentId !== user.id) {
    notFound();
  }

  const canSubmit =
    entry.status === "draft" || entry.status === "rejected";

  const activeToken =
    entry.status === "pending_verification"
      ? await getActiveVerificationTokenForEntry(entry.id)
      : undefined;
  const appOrigin = activeToken ? await getAppOrigin() : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/student" className="text-sm text-zinc-600 hover:underline">
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
