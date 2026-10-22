/**
 * SQLite connection using Node's built-in `node:sqlite` (Node 22.13+; no native package to install).
 * On first use the schema is applied, and an empty database is filled with the synthetic seed data.
 */
import { mkdirSync, readFileSync } from "fs";
import { DatabaseSync } from "node:sqlite";
import {
  dataDirectory,
  databaseFilePath,
  schemaFilePath,
  seedFilePath,
} from "@/lib/paths";

// Keep one connection across dev-server hot reloads instead of opening a new one per module reload.
const globalForDatabase = globalThis as unknown as {
  trackwilDatabase?: DatabaseSync;
};

export function getDatabase(): DatabaseSync {
  if (!globalForDatabase.trackwilDatabase) {
    globalForDatabase.trackwilDatabase = openDatabase();
  }
  return globalForDatabase.trackwilDatabase;
}

function openDatabase(): DatabaseSync {
  mkdirSync(dataDirectory, { recursive: true });
  const database = new DatabaseSync(databaseFilePath);
  database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  database.exec(readFileSync(schemaFilePath, "utf8"));

  const { userCount } = database
    .prepare("SELECT COUNT(*) AS userCount FROM users")
    .get() as { userCount: number };
  if (userCount === 0) {
    database.exec(readFileSync(seedFilePath, "utf8"));
  }

  return database;
}

/** Run several statements so that they all succeed or none are kept. */
export function inTransaction<T>(work: (database: DatabaseSync) => T): T {
  const database = getDatabase();
  database.exec("BEGIN");
  try {
    const result = work(database);
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
