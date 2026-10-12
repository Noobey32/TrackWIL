import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { uploadsDirectory } from "@/lib/paths";
import { getCurrentUser } from "@/lib/session";
import { getLogbookEntries } from "@/lib/repository";

export async function GET(
  _request: Request,
  context: { params: Promise<{ fileName: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileName } = await context.params;
  const safeName = path.basename(fileName);
  const entries = await getLogbookEntries();
  const linkedEntry = entries.find(
    (entry) => entry.evidenceFileName === safeName,
  );

  if (!linkedEntry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const canAccess =
    user.role === "coordinator" ||
    user.role === "lecturer" ||
    linkedEntry.studentId === user.id;

  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const fileBuffer = await readFile(path.join(uploadsDirectory, safeName));
    const extension = path.extname(safeName).toLowerCase();
    const contentType =
      extension === ".pdf"
        ? "application/pdf"
        : extension === ".png"
          ? "image/png"
          : extension === ".webp"
            ? "image/webp"
            : "image/jpeg";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${safeName}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
