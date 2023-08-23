import { NextResponse } from "next/server";
import {
  createMenuItemsForMenu,
  createLocation,
  findOrCreateMenuForLocation,
  createMenuItemsForMenuFromHtml,
} from "@/utils/server/scripts";

// FIXME: For testing purposes, remove this
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // await createMenuItemsForMenu(2);
  // await createLocation()
  // await findOrCreateMenuForLocation(4);
  // const res = await createMenuItemsForMenuFromHtml(9);

  return NextResponse.json({});
}
