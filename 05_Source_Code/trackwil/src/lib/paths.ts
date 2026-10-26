/** Paths to the SQLite database, its SQL scripts, and uploaded files (relative to the Next.js app root). */
import path from "path";

export const dataDirectory = path.join(process.cwd(), "data");
export const uploadsDirectory = path.join(dataDirectory, "uploads");
export const documentsDirectory = path.join(uploadsDirectory, "documents");

export const databaseFilePath = path.join(dataDirectory, "trackwil.db");

const databaseScriptsDirectory = path.join(process.cwd(), "database");
export const schemaFilePath = path.join(databaseScriptsDirectory, "schema.sql");
export const seedFilePath = path.join(databaseScriptsDirectory, "seed.sql");
/** Synthetic PDFs referenced by the seed data; copied into documentsDirectory when the database is seeded. */
export const demoDocumentsDirectory = path.join(
  databaseScriptsDirectory,
  "demo-documents",
);
