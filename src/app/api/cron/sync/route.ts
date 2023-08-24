import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/server/prisma";
import {
  createMenuItemsForMenu,
  findOrCreateMenuForLocation,
} from "@/utils/server/scripts";
import { revalidatePath } from "next/cache";

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
    } catch (error) {
      console.error(error);
    }
  });

  // Revalidate all pages
  revalidatePath("/");

  return new NextResponse("Synced", { status: 200 });
}
