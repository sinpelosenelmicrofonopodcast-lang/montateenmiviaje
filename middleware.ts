import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/admin-auth";

const ADMIN_WEB_PREFIXES = ["/dashboard/admin", "/admin"];
const ADMIN_API_PREFIX = "/api/admin";
const LEGACY_PUBLIC_ADMIN_PATHS = new Set(["/admin/login", "/admin/forbidden"]);
const PORTAL_PREFIX = "/portal";
const PUBLIC_PORTAL_PATHS = new Set(["/portal/login", "/portal/register"]);

function hasSupabasePublicConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function isProtectedAdminWebPath(pathname: string) {
  return ADMIN_WEB_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function toHomeRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url);
}

function toApiForbidden(message = "Forbidden") {
  return NextResponse.json({ message }, { status: 403 });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminWeb = isProtectedAdminWebPath(pathname);
  const isAdminApi = pathname.startsWith(ADMIN_API_PREFIX);
  const isPortalPath = pathname === PORTAL_PREFIX || pathname.startsWith(`${PORTAL_PREFIX}/`);

  if (LEGACY_PUBLIC_ADMIN_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (PUBLIC_PORTAL_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (!isAdminWeb && !isAdminApi && !isPortalPath) {
    return NextResponse.next();
  }

  if (!hasSupabasePublicConfig()) {
    if (isPortalPath) {
      return toHomeRedirect(request);
    }
    return isAdminApi
      ? toApiForbidden("Supabase auth no configurado")
      : toHomeRedirect(request);
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    if (isPortalPath) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/portal/login";
      loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }
    return isAdminApi ? toApiForbidden("No autorizado") : toHomeRedirect(request);
  }

  if (isPortalPath) {
    return response;
  }

  const profileResult = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null }>();

  if (profileResult.error || !isAdminRole(profileResult.data?.role)) {
    return isAdminApi ? toApiForbidden("Permisos insuficientes") : toHomeRedirect(request);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/admin/:path*", "/admin/:path*", "/api/admin/:path*", "/portal/:path*"]
};
