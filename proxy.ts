import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { buildCsp } from "@/lib/csp";
import { publicEnv, supabaseConfigured } from "@/lib/env";

/**
 * Runs before every page request: sets the CSP with a fresh nonce, refreshes the Supabase session
 * cookie, and keeps signed-out visitors out of /nest. This is an early, optimistic check only;
 * the real authorisation is row level security in the database.
 */
export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp({
    nonce,
    supabaseUrl: publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    dev: process.env.NODE_ENV === "development",
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const { pathname } = request.nextUrl;
  const wantsNest = pathname === "/nest" || pathname.startsWith("/nest/");

  if (!supabaseConfigured) {
    // Without a database only the read-only demo nest exists; /nest itself forwards to it.
    if (wantsNest && pathname !== "/nest/demo" && pathname !== "/nest") {
      response = NextResponse.redirect(new URL("/inloggen", request.url));
    }
  } else {
    const supabase = createServerClient(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL!,
      publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (toSet) => {
            for (const { name, value } of toSet) request.cookies.set(name, value);
            response = NextResponse.next({ request: { headers: requestHeaders } });
            for (const { name, value, options } of toSet)
              response.cookies.set(name, value, options);
          },
        },
      },
    );
    // getUser() validates the token with the auth server and refreshes it when needed.
    const { data } = await supabase.auth.getUser();
    if (wantsNest && !data.user) {
      const login = new URL("/inloggen", request.url);
      login.searchParams.set("next", pathname);
      const redirect = NextResponse.redirect(login);
      for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
      response = redirect;
    }
  }

  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  // Everything except build assets and the service worker. No exclusion by file extension or by
  // prefetch header: a request must not be able to opt out of the CSP by how it is shaped.
  matcher: ["/((?!api/health|_next/static|_next/image|icons/|sw.js|favicon.ico).*)"],
};
