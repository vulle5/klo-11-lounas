import { expect, test, describe } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';

describe('middleware', () => {
  test('should return 200', async () => {
    const request = new NextRequest(`https://klo-11-lounas-92dssfosi-vulle5.vercel.app/api/test`);
    const response = await middleware(request);

    expect(response.status).toBe(200);
  });

  describe('vercel cron job', () => {
    test('should fetch the production url', async () => {
      const request = new NextRequest(
        'https://klo-11-lounas-92dssfosi-vulle5.vercel.app/api/cron/sync',
        {
          headers: {
            'User-Agent': 'vercel-cron/1.0',
            Authorization: 'Bearer development',
          },
        },
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
