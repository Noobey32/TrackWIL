"use client";

import { useState, useTransition } from "react";
import { mentorDecisionAction } from "@/app/actions/verify";

type MentorVerificationFormProps = {
  token: string;
};

export function MentorVerificationForm({ token }: MentorVerificationFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDecision(decision: "approved" | "rejected") {
    setMessage(null);
    startTransition(async () => {
      const result = await mentorDecisionAction(token, decision);
      if (result?.error) {
        setMessage(result.error);
        return;
      }
      setMessage(
        decision === "approved"
          ? "Thank you. This entry is marked as verified."
          : "This entry was rejected. The student can update and resubmit.",
      );
    });
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <p className="text-sm text-zinc-700">
        You do not need an account. Confirm whether this work was completed.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleDecision("approved")}
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleDecision("rejected")}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
        >
          Reject
        </button>
      </div>
      {message ? (
        <p className="mt-3 text-sm text-zinc-700">{message}</p>
      ) : null}
    </div>
  );
}
