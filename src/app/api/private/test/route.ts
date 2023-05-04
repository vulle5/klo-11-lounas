import { NextResponse } from "next/server"
import { createLocation, findOrCreateMenuForLocation, createMenuItemsForMenu } from "@/utils/server/scripts"
import { prisma } from "@/utils/server/prisma"
import { Temporal } from "@js-temporal/polyfill";

// FIXME: For testing purposes, remove this
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const menu = await findOrCreateMenuForLocation(1);
  const date = Temporal.PlainDate.from({ year: menu.date.getFullYear(), month: menu.date.getMonth() + 1, day: menu.date.getDate() })

  return NextResponse.json({ result: menu, date })
}
