import { expect, test, describe } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';

describe('middleware', () => {
  test('should return 401 if hostname is not allowed', () => {
    const request = new NextRequest('https://example.com');
    const response = middleware(request);

    expect(response.status).toBe(401);
  });

  test('should return 200 if hostname is allowed', () => {
    const allowedHosts = [
      'klo-11-lounas.vercel.app',
      'klo-11-lounas-git-main-vulle5.vercel.app',
      'klo-11-lounas-92dssfosi-vulle5.vercel.app',
    ];
    allowedHosts.forEach((allowedHost) => {
      const request = new NextRequest(`https://${allowedHost}`);
      const response = middleware(request);

      expect(response.status).toBe(200);
    });
  });

  describe('vercel cron job', () => {
    test('should set header and redirect to the correct url', () => {
      const request = new NextRequest(
        'https://klo-11-lounas-mqr833jkr-vulle5.vercel.app/api/cron/sync?search=params&come=too'
      );
      request.headers.set('user-agent', 'vercel-cron/1.0');
      const response = middleware(request);

      expect(response.headers.get('location')).toBe(
        'https://klo-11-lounas.vercel.app/api/cron/sync?search=params&come=too'
      );
      expect(response.headers.get('x-redirected-from')).toBe(
        'klo-11-lounas-mqr833jkr-vulle5.vercel.app'
      );
      expect(response.status).toBe(308);
    });

    test('should not redirect if url is correct and is not from redirection', () => {
      const request = new NextRequest(
        'https://klo-11-lounas.vercel.app/api/cron/sync'
      );
      request.headers.set('user-agent', 'vercel-cron/1.0');
      request.headers.set('X-Redirected-From', 'klo-11-lounas.vercel.app');
      const response = middleware(request);

      expect(response.status).toBe(200);
    });
  });
});
