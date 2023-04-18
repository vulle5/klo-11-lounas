import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const res = await fetch('https://www.compass-group.fi/menuapi/feed/json?costNumber=3114&language=fi')
  const data = await res.json()

  return NextResponse.json(data)
}
