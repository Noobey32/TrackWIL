/** Paths to JSON data files and uploaded evidence (relative to the Next.js app root). */
import path from "path";

export const dataDirectory = path.join(process.cwd(), "data");
export const uploadsDirectory = path.join(dataDirectory, "uploads");

export const usersFilePath = path.join(dataDirectory, "users.json");
export const logbookEntriesFilePath = path.join(
  dataDirectory,
  "logbook_entries.json",
);
export const verificationTokensFilePath = path.join(
  dataDirectory,
  "verification_tokens.json",
);
