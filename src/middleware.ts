import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { appConfig } from '@config';

export async function middleware(request: NextRequest) {
  const requestUrl = new URL(request.url);

  // Check if the hostname is allowed
  if (!appConfig.allowedHosts.some((allowedHost) => allowedHost.test(requestUrl.hostname))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Secure the cron endpoints
  if (
    requestUrl.pathname.startsWith('/api/cron') &&
    request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use fetch to run vercel cron jobs in production url
  // Redirects do not work in vercel cron jobs
  // TODO: Probably caused by bug in Vercel, remove when fixed
  if (
    request.headers.get('user-agent') === 'vercel-cron/1.0' &&
    requestUrl.hostname !== 'klo-11-lounas.vercel.app'
  ) {
    const redirectUrl = new URL(request.url);
    redirectUrl.hostname = 'klo-11-lounas.vercel.app';

    await fetch(redirectUrl.toString(), {
      headers: {
        'User-Agent': 'vercel-cron/1.0',
      },
    });
  }

  return NextResponse.next();
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
