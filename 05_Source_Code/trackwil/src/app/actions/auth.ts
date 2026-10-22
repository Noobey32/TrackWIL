"use server";

/** Login, logout, and student sign-up; successful auth sets the session cookie and redirects. */

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createUser, getUserByEmail } from "@/lib/repository";
import {
  validateSignupPassword,
  validateStudentSignupEmail,
} from "@/lib/signup-validation";
import {
  clearSession,
  dashboardPathForRole,
  setSessionUser,
} from "@/lib/session";
import type { User } from "@/lib/types";

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

export async function signupAction(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || !password) {
    return { error: "Full name, email, and password are required." };
  }

  const emailError = validateStudentSignupEmail(email);
  if (emailError) {
    return { error: emailError };
  }

  const passwordError = validateSignupPassword(password);
  if (passwordError) {
    return { error: passwordError };
  }

  const normalizedEmail = email.toLowerCase();
  const existingUser = await getUserByEmail(normalizedEmail);
  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  const newUser: User = {
    id: `student-${randomUUID()}`,
    fullName,
    email: normalizedEmail,
    role: "student",
    passwordHash: hashPassword(password),
    requiredHours: 200,
  };

  await createUser(newUser);

  await setSessionUser(newUser.id);
  redirect(dashboardPathForRole(newUser.role));
}
