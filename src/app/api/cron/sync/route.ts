import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/server/prisma";
import {
  createMenuItemsForMenu,
  findOrCreateMenuForLocation,
} from "@/utils/server/scripts";
import { revalidatePathAndFetch } from "@/utils/server/routeHandler";

export const dynamic = "force-dynamic";

// Syncs the data from the dataUrl to the database
export async function GET(request: NextRequest) {
  const allLocationIds = await prisma.location.findMany({
    select: {
      id: true,
    },
  });

  console.log(`Syncing ${allLocationIds.length} locations...`);

  allLocationIds.forEach(async ({ id }) => {
    try {
      const menu = await findOrCreateMenuForLocation(id);

      await createMenuItemsForMenu(menu);
      console.log(`Synced location ${id}`);
    } catch (error) {
      console.error(`Syncing location ${id} failed`, error);
    }
  });

  console.log("Revalidating home page...");
  revalidatePathAndFetch(request, "/");

  return NextResponse.json({ revalidated: true, date: new Date() });
}
