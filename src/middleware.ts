import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const bearerToken = `Bearer ${process.env.CRON_SECRET}`;

  // Secure the cron endpoints
  if (
    request.nextUrl.pathname.startsWith('/api/cron') &&
    request.headers.get('authorization') !== bearerToken
  ) {
    return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 });
  }

  // Redirect vercel cron jobs to production url
  if (
    request.headers.get('user-agent') === 'vercel-cron/1.0' &&
    request.nextUrl.hostname !== 'klo-11-lounas.vercel.app'
  ) {
    console.log('Running vercel cron job, fetching the production url...');
    const redirectUrl = new URL(request.url);
    redirectUrl.hostname = 'klo-11-lounas.vercel.app';

    console.log('Redirecting to:', redirectUrl.toString());
    await fetch(redirectUrl, {
      headers: {
        'User-Agent': 'vercel-cron/1.0',
        'Authorization': bearerToken,
      },
    });
    return NextResponse.json({ result: 'Redirected to production' });
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
