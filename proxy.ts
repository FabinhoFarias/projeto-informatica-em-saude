import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("vigia_access_token")?.value;
  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set(
      "redirect",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/painel/:path*",
    "/visitas/:path*",
    "/usuarios/:path*",
    "/territorio-conferencia/:path*",
    "/laboratorio/:path*",
    "/planejamento/:path*",
    "/digitacao-relatorios/:path*",
    "/estoque/:path*",
    "/saneamento/:path*",
    "/mapas/:path*",
    "/hotspots/:path*",
    "/priorizacao-territorial/:path*",
    "/diagnostico/:path*",
    "/ingestao/:path*",
    "/simulacao/:path*",
    "/configuracao-municipal/:path*",
  ],
};
