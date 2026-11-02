import { NextResponse, type NextRequest } from "next/server";

/**
 * - Přesměrování vedlejších domén (např. belehrad1976.cz) na hlavní doménu (PRIMARY_HOST).
 * - /admin: bez cookie session rovnou na přihlášení, hlavička noindex.
 *   (Skutečné ověření session probíhá na serveru v requireAdmin / getAdminSession.)
 */
export function middleware(req: NextRequest) {
  const primary = (process.env.PRIMARY_HOST ?? "").trim().toLowerCase();
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const isApi = req.nextUrl.pathname.startsWith("/api/");
  if (primary && host && host !== primary && host !== "localhost" && host !== "127.0.0.1" && !isApi) {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    url.host = primary;
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin")) {
    const isLogin = pathname === "/admin/login";
    if (!isLogin && !req.cookies.get("admin_session")) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: ["/((?!_next/static|_next/image|img/|favicon.ico).*)"],
};
