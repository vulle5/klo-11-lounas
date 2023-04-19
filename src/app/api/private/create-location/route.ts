import { NextResponse } from "next/server"
import { createLocation } from "@/utils/server/scripts"

export async function GET(request: Request) {
  const location = await createLocation()

  return NextResponse.json({ location })
}
