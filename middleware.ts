import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin-auth";

const ADMIN_LOGIN_PATH = "/admin/login";
const ADMIN_FORBIDDEN_PATH = "/admin/forbidden";
const ADMIN_AUTH_API_PREFIX = "/api/admin/auth";

function hasSupabasePublicConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function makeUnauthorizedResponse(
  request: NextRequest,
  message: string,
  status: number,
  options?: { errorCode?: string }
) {
  if (request.nextUrl.pathname.startsWith("/api/admin")) {
    return NextResponse.json({ message }, { status });
  }

  const url = request.nextUrl.clone();
  url.pathname = status === 403 ? ADMIN_FORBIDDEN_PATH : ADMIN_LOGIN_PATH;
  if (status === 401) {
    const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    url.searchParams.set("next", nextPath);
    if (options?.errorCode) {
      url.searchParams.set("error", options.errorCode);
    }
  }

  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminArea = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminArea && !isAdminApi) {
    return NextResponse.next();
  }

  if (
    pathname === ADMIN_LOGIN_PATH ||
    pathname === ADMIN_FORBIDDEN_PATH ||
    pathname.startsWith(ADMIN_AUTH_API_PREFIX)
  ) {
    return NextResponse.next();
  }

  if (!hasSupabasePublicConfig()) {
    return makeUnauthorizedResponse(
      request,
      "Autenticación admin no configurada: define variables de Supabase",
      401,
      { errorCode: "supabase_not_configured" }
    );
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
    return makeUnauthorizedResponse(request, "No autorizado", 401);
  }

  if (!isAdminUser(user)) {
    return makeUnauthorizedResponse(request, "Permisos insuficientes", 403);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"]
};
