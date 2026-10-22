/**
 * Session handling for signed-in students, coordinators and lecturers.
 * The cookie holds the user id plus an HMAC-SHA256 signature (`<userId>.<signature>`),
 * so a cookie edited in the browser is rejected; the full user record is loaded on each request.
 */
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { cookies } from "next/headers";
import { dataDirectory } from "@/lib/paths";
import { getUserById } from "@/lib/repository";
import type { User } from "@/lib/types";

const sessionCookieName = "trackwil_session";
const sessionSecretFilePath = path.join(dataDirectory, "session-secret");

let cachedSecret: string | null = null;

/** Secret from TRACKWIL_SESSION_SECRET, or a random one generated once into data/session-secret. */
function sessionSecret(): string {
  if (cachedSecret) {
    return cachedSecret;
  }
  const fromEnvironment = process.env.TRACKWIL_SESSION_SECRET;
  if (fromEnvironment) {
    cachedSecret = fromEnvironment;
  } else if (existsSync(sessionSecretFilePath)) {
    cachedSecret = readFileSync(sessionSecretFilePath, "utf8").trim();
  } else {
    mkdirSync(dataDirectory, { recursive: true });
    cachedSecret = randomBytes(32).toString("hex");
    writeFileSync(sessionSecretFilePath, cachedSecret, { mode: 0o600 });
  }
  return cachedSecret;
}

function sign(userId: string): string {
  return createHmac("sha256", sessionSecret()).update(userId).digest("hex");
}

/** Returns the user id if the cookie value carries a valid signature, otherwise null. */
function verifiedUserId(cookieValue: string): string | null {
  const separator = cookieValue.lastIndexOf(".");
  if (separator <= 0) {
    return null;
  }
  const userId = cookieValue.slice(0, separator);
  const signature = Buffer.from(cookieValue.slice(separator + 1), "hex");
  const expected = Buffer.from(sign(userId), "hex");
  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) {
    return null;
  }
  return userId;
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(sessionCookieName)?.value;
  if (!cookieValue) {
    return null;
  }
  const userId = verifiedUserId(cookieValue);
  if (!userId) {
    return null;
  }
  const user = await getUserById(userId);
  return user ?? null;
}

export async function setSessionUser(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, `${userId}.${sign(userId)}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export function dashboardPathForRole(role: User["role"]): string {
  if (role === "coordinator" || role === "lecturer") {
    return "/coordinator";
  }
  return "/student";
}
