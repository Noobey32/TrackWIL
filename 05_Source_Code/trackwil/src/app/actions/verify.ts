"use server";

/**
 * Public mentor verification: validate token, update entry status, mark token used.
 * No login; access is limited to a valid, unused, unexpired link.
 */

import { revalidatePath } from "next/cache";
import {
  getLogbookEntryById,
  getLogbookEntries,
  getVerificationToken,
  getVerificationTokens,
  saveLogbookEntries,
  saveVerificationTokens,
} from "@/lib/repository";

export async function mentorDecisionAction(
  tokenValue: string,
  decision: "approved" | "rejected",
) {
  const token = await getVerificationToken(tokenValue);
  if (!token) {
    return { error: "This verification link is invalid." };
  }
  if (token.usedAt) {
    return { error: "This verification link has already been used." };
  }
  if (new Date(token.expiresAt) < new Date()) {
    return { error: "This verification link has expired." };
  }

  const entry = await getLogbookEntryById(token.entryId);
  if (!entry) {
    return { error: "The linked logbook entry could not be found." };
  }

  const now = new Date().toISOString();
  const entries = await getLogbookEntries();
  const entryIndex = entries.findIndex((item) => item.id === entry.id);
  entries[entryIndex] = {
    ...entry,
    status: decision === "approved" ? "verified" : "rejected",
    updatedAt: now,
    verifiedAt: decision === "approved" ? now : entry.verifiedAt,
  };
  await saveLogbookEntries(entries);

  const tokens = await getVerificationTokens();
  const tokenIndex = tokens.findIndex((item) => item.token === tokenValue);
  tokens[tokenIndex] = {
    ...token,
    usedAt: now,
    decision,
  };
  await saveVerificationTokens(tokens);

  revalidatePath("/coordinator");
  revalidatePath(`/verify/${tokenValue}`);
  revalidatePath(`/student/entries/${entry.id}`);

  return { success: true };
}
