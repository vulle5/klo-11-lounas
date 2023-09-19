import { vi } from 'vitest';

vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
  Promise.resolve(new Response())
);
