import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Syncs the data from the dataUrl to the database
export async function GET(request: NextRequest) {
  revalidatePath("/hello");
  await fetch(`https://${request.headers.get("Host")}/hello`);
  return NextResponse.json({ revalidated: true, date: new Date() });
}
