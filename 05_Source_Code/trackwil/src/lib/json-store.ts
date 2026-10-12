/**
 * Low-level persistence for JSON documents under `data/`.
 * Repository functions read and write whole files through these helpers.
 */
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";

async function ensureParentDirectory(filePath: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile<T>(filePath: string, value: T): Promise<void> {
  await ensureParentDirectory(filePath);
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  // Replace the live file in one step so a failed write does not corrupt data.
  await rename(temporaryPath, filePath);
}
