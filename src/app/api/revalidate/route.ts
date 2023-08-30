import { revalidatePathAndFetch } from "@/utils/server/routeHandler";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await revalidatePathAndFetch(request, "/hello");
  return NextResponse.json({ revalidated: true, date: new Date() });
}
