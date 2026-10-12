import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import {
  dashboardPathForRole,
  getCurrentUser,
} from "@/lib/session";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(dashboardPathForRole(user.role));
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-zinc-900">TrackWIL</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Work-integrated learning logbooks for students, mentors, and
            coordinators.
          </p>
        </div>
        <LoginForm />
        <div className="mt-6 rounded-md bg-zinc-50 p-3 text-xs text-zinc-600">
          <p className="font-medium text-zinc-800">Demo accounts</p>
          <p className="mt-1">student1@ctucareer.co.za / student123</p>
          <p>coordinator@ctucareer.co.za / coord123</p>
        </div>
      </div>
    </div>
  );
}
