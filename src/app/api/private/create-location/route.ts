import { NextResponse } from "next/server"
import { createMenuItemsForMenu } from "@/utils/server/scripts"
import { prisma } from "@/utils/server/prisma"

export async function GET(request: Request) {
  await createMenuItemsForMenu(8)

  return NextResponse.json({ result: "success" })
}
