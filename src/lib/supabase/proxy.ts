import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Runs before every page request. Refreshes the auth token if it has expired
// and redirects signed-out users to /login. This is an optimistic check for
// navigation only: data is protected by RLS, not by this redirect.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // Must run right after creating the client: it validates the JWT and
  // triggers the token refresh that setAll writes back to the browser.
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims);
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!isSignedIn && !isLoginPage) {
    return redirectWithCookies(request, response, "/login");
  }
  if (isSignedIn && isLoginPage) {
    return redirectWithCookies(request, response, "/");
  }

  return response;
}

// A redirect must carry any refreshed auth cookies, or the browser and server
// sessions drift apart and the user gets signed out.
function redirectWithCookies(request: NextRequest, response: NextResponse, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
