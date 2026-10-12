"use server";

import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/password";
import { getUserByEmail } from "@/lib/repository";
import {
  clearSession,
  dashboardPathForRole,
  setSessionUser,
} from "@/lib/session";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const user = await getUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid email or password." };
  }

  await setSessionUser(user.id);
  redirect(dashboardPathForRole(user.role));
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}
