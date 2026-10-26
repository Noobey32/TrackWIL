/**
 * SQLite connection using Node's built-in `node:sqlite` (Node 22.13+; no native package to install).
 * On first use the schema is applied, and an empty database is filled with the synthetic seed data
 * (including the demo document files the seed data refers to).
 */
import { cpSync, mkdirSync, readFileSync } from "fs";
import { DatabaseSync } from "node:sqlite";
import {
  dataDirectory,
  databaseFilePath,
  demoDocumentsDirectory,
  documentsDirectory,
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
  assertCurrentSchema(database);
  database.exec(readFileSync(schemaFilePath, "utf8"));

  const { userCount } = database
    .prepare("SELECT COUNT(*) AS userCount FROM users")
    .get() as { userCount: number };
  if (userCount === 0) {
    database.exec(readFileSync(seedFilePath, "utf8"));
    cpSync(demoDocumentsDirectory, documentsDirectory, {
      recursive: true,
      filter: (source) => !source.endsWith(".gitattributes"),
    });
  }

  return database;
}

/**
 * A database created before WIL placements were added has entries without a placement.
 * Stop with a clear instruction instead of failing later on a missing column.
 */
function assertCurrentSchema(database: DatabaseSync): void {
  const entryColumns = database
    .prepare("SELECT name FROM pragma_table_info('logbook_entries')")
    .all() as { name: string }[];
  if (
    entryColumns.length > 0 &&
    !entryColumns.some((column) => column.name === "placement_id")
  ) {
    database.close();
    throw new Error(
      "data/trackwil.db was created by an older version of TrackWIL. Stop the server and run `npm run db:reset`.",
    );
  }
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
