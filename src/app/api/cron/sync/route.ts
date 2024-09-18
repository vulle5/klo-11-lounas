import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/server/prisma';
import { createMenuItemsForMenu, findOrCreateMenuForLocation } from '@/utils/server/scripts';
import { revalidatePathAndFetch } from '@/utils/server/routeHandler';

export const dynamic = 'force-dynamic';

// Syncs the data from the dataUrl to the database
export async function GET(request: NextRequest) {
  const allLocationIds = await prisma.location.findMany({
    select: {
      id: true,
    },
  });

  console.log(`Syncing ${allLocationIds.length} locations...`);

  const createMenuPromises = allLocationIds.map(async ({ id }) => {
    try {
      const menu = await findOrCreateMenuForLocation(id);

      await createMenuItemsForMenu(menu);
      console.log(`Synced location ${id}`);
    } catch (error) {
      console.error(`Syncing location ${id} failed`, error);
    }
  });

  await Promise.all(createMenuPromises);
  console.log('All menus synced successfully. Revalidating home page and api...');
  await Promise.all([
    revalidatePathAndFetch(request, '/'),
    revalidatePathAndFetch(request, '/api/menus/today'),
  ]);
  console.log('Revalidation done.');

  return NextResponse.json({ revalidated: true, date: new Date() });
}
