import { NextResponse } from "next/server"
import { createMenuItemsForMenu } from "@/utils/server/scripts"

// FIXME: For testing purposes, remove this
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const menu = await createMenuItemsForMenu(3);

  return NextResponse.json({ result: menu })
}
