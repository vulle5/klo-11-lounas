import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { appConfig } from '@config';

export function middleware(request: NextRequest) {
  const { hostname } = new URL(request.url);

  if (
    appConfig.allowedHosts.some((allowedHost) => allowedHost.test(hostname))
  ) {
    return NextResponse.next();
  } else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export const config = {
  matcher: [
    /* FOR_FUTURE_REF:
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * '/((?!_next/static|_next/image|favicon.ico).*)'
     */
    '/api/:path*',
  ],
};
