"use client";

import { useState, useTransition } from "react";
import { submitEntryForVerificationAction } from "@/app/actions/logbook";

type SubmitForVerificationProps = {
  entryId: string;
};

export function SubmitForVerification({ entryId }: SubmitForVerificationProps) {
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await submitEntryForVerificationAction(entryId);
      if (result?.error) {
        setErrorMessage(result.error);
        return;
      }
      if (result?.token) {
        const origin = window.location.origin;
        setVerificationUrl(`${origin}/verify/${result.token}`);
      }
    });
  }

  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-sm text-zinc-700">
        Submit this entry to generate a secure link for your workplace mentor.
      </p>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="mt-3 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {isPending ? "Creating link..." : "Submit for verification"}
      </button>
      {errorMessage ? (
        <p className="mt-2 text-sm text-rose-600">{errorMessage}</p>
      ) : null}
      {verificationUrl ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium text-zinc-800">Mentor link</p>
          <p className="break-all rounded bg-white p-2 text-sm text-zinc-700">
            {verificationUrl}
          </p>
          <p className="text-xs text-zinc-500">
            Share this link with your mentor. It expires in 7 days.
          </p>
        </div>
      ) : null}
    </div>
  );
}
