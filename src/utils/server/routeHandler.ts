import 'server-only';

import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/server';

type RequestLike = Request | NextRequest;

/**
 * Revalidate the path without waiting for the next request
 *
 * Normally Next.js will serve the stale page first and serve revalidated page on subsequent requests.
 * */
export const revalidatePathAndFetch = async (
  request: RequestLike,
  path: string
) => {
  const { origin } = new URL(request.url);

  revalidatePath(path);
  await fetch(`${origin}${path}`);
};
