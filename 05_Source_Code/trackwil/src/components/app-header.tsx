import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import type { User } from "@/lib/types";

type AppHeaderProps = {
  user: User;
};

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <div>
          <Link href="/" className="text-lg font-semibold text-zinc-900">
            TrackWIL
          </Link>
          <p className="text-sm text-zinc-600">
            {user.fullName} · {user.role}
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
