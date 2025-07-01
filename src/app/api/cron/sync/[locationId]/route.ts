import { revalidatePathAndFetch } from '@/utils/server/routeHandler';
import { createMenuItemsForMenu, findOrCreateMenuForLocation } from '@/utils/server/scripts';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Syncs the data from one location to the database
export async function GET(request: NextRequest, { params }: { params: { locationId: string } }) {
  const locationId = params.locationId;

  console.log(`Syncing location ${locationId}...`);

  try {
    const menu = await findOrCreateMenuForLocation(parseInt(locationId));
    await createMenuItemsForMenu(menu);

    console.log(`Synced location ${locationId}`);

    console.log('All menus synced successfully. Revalidating home page and api...');
    await Promise.all([
      revalidatePathAndFetch(request, '/'),
      revalidatePathAndFetch(request, '/api/menus/today'),
    ]);
    console.log('Revalidation done.');

    return NextResponse.json({ revalidated: true, date: new Date() });
  } catch (error) {
    console.error(`Syncing location ${locationId} failed`, error);
    return NextResponse.json({ error: 'Syncing failed', details: error }, { status: 500 });
  }
}
