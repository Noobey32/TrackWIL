import { AppHeader } from "@/components/app-header";
import { requireRole } from "@/lib/session";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("student");

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
