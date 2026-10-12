"use client";

import { useState } from "react";

type CopyVerificationLinkProps = {
  verificationUrl: string;
  verificationPath: string;
};

export function CopyVerificationLink({
  verificationUrl,
  verificationPath,
}: CopyVerificationLinkProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-sm font-medium text-zinc-900">Mentor verification link</p>
      <p className="mt-1 text-sm text-zinc-600">
        Share this link with your workplace mentor. It expires in 7 days.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <input
          type="text"
          readOnly
          value={verificationUrl}
          className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800"
          onFocus={(event) => event.currentTarget.select()}
        />
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <a
        href={verificationPath}
        className="mt-3 inline-block text-sm font-medium text-zinc-900 underline"
        target="_blank"
        rel="noreferrer"
      >
        Open verification page
      </a>
    </div>
  );
}
