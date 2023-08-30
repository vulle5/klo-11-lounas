import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest } from "next/server";

type RequestLike = Request | NextRequest;

export const allowedHosts = ["localhost", "klo-11-lounas.vercel.app"];

/**
 * Revalidate the path without waiting for the next request
 *
 * Normally Next.js will serve the stale page first and serve revalidated page on subsequent requests.
 * */
export const revalidatePathAndFetch = async (
  request: RequestLike,
  path: string
) => {
  const { hostname, origin } = new URL(request.url);

  if (allowedHosts.some((allowedHost) => hostname.includes(allowedHost))) {
    revalidatePath(path);
    await fetch(`${origin}${path}`);
  }
};
