import { cookies } from "next/headers";
import { getUserById } from "@/lib/repository";
import type { User } from "@/lib/types";

const sessionCookieName = "trackwil_session";

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(sessionCookieName)?.value;
  if (!userId) {
    return null;
  }
  const user = await getUserById(userId);
  return user ?? null;
}

export async function setSessionUser(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, userId, {
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
