import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const requestUrlObject = new URL(request.url);

  // Secure the cron endpoints
  if (
    requestUrlObject.pathname.startsWith('/api/cron') &&
    request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 });
  }

  // Use fetch to run vercel cron jobs in production url
  // Redirects do not work in vercel cron jobs
  // TODO: Probably caused by bug in Vercel, remove when fixed
  if (
    request.headers.get('user-agent') === 'vercel-cron/1.0' &&
    requestUrlObject.hostname !== 'klo-11-lounas.vercel.app'
  ) {
    console.log('Running vercel cron job, fetching the production url...');
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
