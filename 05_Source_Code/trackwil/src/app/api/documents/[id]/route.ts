/**
 * Serves an uploaded WIL document only to the student it belongs to,
 * or to a coordinator or lecturer.
 */
import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { documentContentType } from "@/lib/documents";
import { documentsDirectory } from "@/lib/paths";
import { getDocumentById } from "@/lib/repository";
import { getCurrentUser } from "@/lib/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const document = await getDocumentById(id);
  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const canAccess =
    user.role === "coordinator" ||
    user.role === "lecturer" ||
    document.studentId === user.id;
  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const storedName = path.basename(document.storedFileName);
    const fileBuffer = await readFile(path.join(documentsDirectory, storedName));
    const asciiName = document.originalFileName.replace(/[^\x20-\x7e]/g, "_");

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": documentContentType(path.extname(storedName).toLowerCase()),
        "Content-Disposition": `inline; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(document.originalFileName)}`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
