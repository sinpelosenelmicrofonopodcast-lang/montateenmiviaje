import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { isAdminRole, isAdminUser, normalizeRole } from "@/lib/admin-auth";

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

async function getProfileRoleWithServiceKey(userId: string, email?: string | null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  const adminClient = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const byId = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<{ role: string | null }>();

  if (byId.error) {
    return null;
  }

  if (byId.data?.role) {
    return normalizeRole(byId.data.role);
  }

  if (email) {
    const byEmail = await adminClient
      .from("profiles")
      .select("role")
      .eq("email", email.toLowerCase())
      .maybeSingle<{ role: string | null }>();

    if (!byEmail.error && byEmail.data?.role) {
      return normalizeRole(byEmail.data.role);
    }
  }

  return null;
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

  const serviceRole = await getProfileRoleWithServiceKey(user.id, user.email);
  let roleFromSession: string | null | undefined = serviceRole;
  if (!roleFromSession) {
    const byId = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: string | null }>();

    roleFromSession = byId.data?.role;

    if (!roleFromSession && user.email) {
      const byEmail = await supabase
        .from("profiles")
        .select("role")
        .eq("email", user.email.toLowerCase())
        .maybeSingle<{ role: string | null }>();

      roleFromSession = byEmail.data?.role;
    }
  }

  const hasAdminAccess = isAdminRole(roleFromSession) || isAdminUser(user);

  if (!hasAdminAccess) {
    return isAdminApi ? toApiForbidden("Permisos insuficientes") : toHomeRedirect(request);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/admin/:path*", "/admin/:path*", "/api/admin/:path*", "/portal/:path*"]
};
