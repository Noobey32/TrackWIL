import { notFound } from "next/navigation";
import { MentorVerificationForm } from "@/components/mentor-verification-form";
import { EntryStatusBadge } from "@/components/status-badge";
import {
  getLogbookEntryById,
  getUserById,
  getVerificationToken,
} from "@/lib/repository";

export default async function VerifyLogbookEntryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const verificationToken = await getVerificationToken(token);
  if (!verificationToken) {
    notFound();
  }

  const entry = await getLogbookEntryById(verificationToken.entryId);
  if (!entry) {
    notFound();
  }

  const student = await getUserById(entry.studentId);
  const isExpired = new Date(verificationToken.expiresAt) < new Date();
  const isUsed = Boolean(verificationToken.usedAt);

  return (
    <div className="flex flex-1 flex-col px-4 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            TrackWIL mentor verification
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
            Review logbook entry
          </h1>
        </div>

        <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-6">
          <p>
            <span className="font-medium">Student:</span>{" "}
            {student?.fullName ?? "Unknown student"}
          </p>
          <p>
            <span className="font-medium">Work date:</span> {entry.workDate}
          </p>
          <p>
            <span className="font-medium">Hours:</span> {entry.hours}
          </p>
          <p className="text-zinc-700">{entry.description}</p>
          <EntryStatusBadge status={entry.status} />
        </section>

        {isUsed ? (
          <p className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
            This link was already used
            {verificationToken.decision
              ? ` (${verificationToken.decision}).`
              : "."}
          </p>
        ) : isExpired ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            This verification link has expired. Ask the student to submit the
            entry again.
          </p>
        ) : (
          <MentorVerificationForm token={token} />
        )}
      </div>
    </div>
  );
}
