import { NextRequest, NextResponse } from "next/server";

// Define public routes that don't require authentication
const publicRoutes = [
  "/auth/login",
  "/auth/register",
  // Add any other public routes here (like forgot password, etc.)
];

// Define API routes and static assets that should be excluded from middleware
const excludedPaths = [
  "/api",
  "/_next/static",
  "/_next/image",
  "/favicon.ico",
  "/sitemap.xml",
  "/robots.txt",
  // Add other static assets if needed
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for excluded paths (API routes, static files, Next.js internals)
  if (excludedPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Get the auth token from cookies
  const authToken = request.cookies.get("auth_token")?.value;
  const hasValidToken = authToken && authToken.trim() !== "";

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Check if user is trying to access root path
  const isRootPath = pathname === "/";

  // Handle unauthenticated users
  if (!hasValidToken) {
    // If trying to access a protected route (not public and not root), redirect to login
    if (!isPublicRoute && !isRootPath) {
      const loginUrl = new URL("/auth/login", request.url);
      // Add redirect parameter to return to the original page after login
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Allow access to public routes and root path
    return NextResponse.next();
  }

  // Handle authenticated users
  if (hasValidToken) {
    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (isPublicRoute) {
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }

    // If user is authenticated and on root path, redirect to dashboard
    if (isRootPath) {
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Allow the request to proceed for all other cases
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sitemap.xml (sitemap file)
     * - robots.txt (robots file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
