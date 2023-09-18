import { expect, test, describe } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';

describe('middleware', () => {
  test('should return 401 if hostname is not allowed', () => {
    const request = new NextRequest('https://example.com');
    const response = middleware(request);
    expect(response?.status).toBe(401);
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
      expect(response?.status).toBe(200);
    });
  });
});
