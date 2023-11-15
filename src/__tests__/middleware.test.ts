import { expect, test, describe, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';

describe('middleware', () => {
  test('should return 401 if hostname is not allowed', async () => {
    const request = new NextRequest('https://example.com');
    const response = await middleware(request);

    expect(response.status).toBe(401);
  });

  test('should return 200 if hostname is allowed', () => {
    const allowedHosts = [
      'klo-11-lounas.vercel.app',
      'klo-11-lounas-git-main-vulle5.vercel.app',
      'klo-11-lounas-92dssfosi-vulle5.vercel.app',
      'klo-11-lounas-git-5-api-for-menus-vulle5.vercel.app',
    ];
    allowedHosts.forEach(async (allowedHost) => {
      const request = new NextRequest(`https://${allowedHost}`);
      const response = await middleware(request);

      expect(response.status).toBe(200);
    });
  });

  describe('vercel cron job', () => {
    test('should fetch the production url', async () => {
      const request = new NextRequest(
        'https://klo-11-lounas-92dssfosi-vulle5.vercel.app/api/cron/sync',
        {
          headers: {
            'User-Agent': 'vercel-cron/1.0',
          },
        }
      );
      const response = await middleware(request);

      expect(fetch).toHaveBeenCalledWith('https://klo-11-lounas.vercel.app/api/cron/sync', {
        headers: {
          'User-Agent': 'vercel-cron/1.0',
        },
      });
      expect(response.status).toBe(200);
    });
  });
});
