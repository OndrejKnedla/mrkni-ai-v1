import { NextResponse, type NextRequest } from 'next/server'

// Flag to enable/disable coming soon mode - this should match the flag in components/layout-wrapper.tsx
const COMING_SOON_MODE = true; // Enable coming soon mode for live deployment

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;

  // Special handling for video files to ensure proper headers
  if (pathname.match(/\.(mp4|webm|ogg|mov|mkv)$/i)) {
    const response = NextResponse.next();

    // Set proper headers for video files
    response.headers.set('Accept-Ranges', 'bytes');

    // Set appropriate content type based on extension
    if (pathname.endsWith('.mp4')) {
      response.headers.set('Content-Type', 'video/mp4');
    } else if (pathname.endsWith('.webm')) {
      response.headers.set('Content-Type', 'video/webm');
    } else if (pathname.endsWith('.ogg')) {
      response.headers.set('Content-Type', 'video/ogg');
    } else if (pathname.endsWith('.mov')) {
      response.headers.set('Content-Type', 'video/quicktime');
    } else if (pathname.endsWith('.mkv')) {
      response.headers.set('Content-Type', 'video/x-matroska');
    }

    // Set caching headers
    response.headers.set('Cache-Control', 'public, max-age=3600');

    return response;
  }

  // Check if we should redirect to coming soon page
  if (COMING_SOON_MODE) {
    // List of paths that should still be accessible
    const allowedPaths = [
      '/welcome',
      '/api/register-interest',
      '/api/admin',
      '/_next',
      '/favicon.ico',
    ];

    // Check if the current path is allowed
    const isAllowedPath = allowedPaths.some(path => pathname.startsWith(path));

    // If not an allowed path, redirect to coming soon page
    if (!isAllowedPath) {
      url.pathname = '/welcome';
      return NextResponse.redirect(url);
    }
  }

  // Simply return the response without Supabase session handling for now
  // This will be re-enabled once the auth system is fully implemented
  return NextResponse.next()
}

// Ensure the middleware is only called for relevant paths.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',

    // Explicitly match video files to apply special handling
    '/(.*\\.(?:mp4|webm|ogg|mov|mkv)$)',
  ],
}
