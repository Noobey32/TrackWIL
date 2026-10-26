/**
 * Rebuild data/trackwil.db from database/schema.sql and database/seed.sql, and replace the
 * uploaded documents with the demo files the seed data refers to.
 * Stop the dev server first: an open connection keeps the file locked on Windows.
 * Usage: npm run db:reset
 */
import { cpSync, mkdirSync, readFileSync, rmSync } from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";

const appRoot = process.cwd();
const dataDirectory = path.join(appRoot, "data");
const databaseFilePath = path.join(dataDirectory, "trackwil.db");
const documentsDirectory = path.join(dataDirectory, "uploads", "documents");

mkdirSync(dataDirectory, { recursive: true });
for (const suffix of ["", "-wal", "-shm"]) {
  rmSync(`${databaseFilePath}${suffix}`, { force: true });
}

const database = new DatabaseSync(databaseFilePath);
database.exec("PRAGMA foreign_keys = ON;");
database.exec(readFileSync(path.join(appRoot, "database", "schema.sql"), "utf8"));
database.exec(readFileSync(path.join(appRoot, "database", "seed.sql"), "utf8"));

rmSync(documentsDirectory, { recursive: true, force: true });
cpSync(path.join(appRoot, "database", "demo-documents"), documentsDirectory, {
  recursive: true,
  filter: (source) => !source.endsWith(".gitattributes"),
});

const counts = database
  .prepare(
    `SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM wil_placements) AS placements,
      (SELECT COUNT(*) FROM logbook_entries) AS entries,
      (SELECT COUNT(*) FROM verification_tokens) AS tokens,
      (SELECT COUNT(*) FROM placement_documents) AS documents`,
  )
  .get();
database.close();

console.log(
  `Database reset: ${counts.users} users, ${counts.placements} WIL placements, ${counts.entries} logbook entries, ${counts.tokens} verification tokens, ${counts.documents} documents.`,
);
