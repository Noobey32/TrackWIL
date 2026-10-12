import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Redirect unauthenticated visitors away from student and coordinator routes. */
export function proxy(request: NextRequest) {
  const sessionUserId = request.cookies.get("trackwil_session")?.value;
  const { pathname } = request.nextUrl;

  if (
    (pathname.startsWith("/student") || pathname.startsWith("/coordinator")) &&
    !sessionUserId
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/coordinator/:path*"],
};
