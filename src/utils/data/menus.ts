'use server';

import 'server-only';
import prisma from '@/utils/server/prisma';
import { createMenuItemsForMenu, findOrCreateMenuForLocation } from '../server/scripts';
import { revalidatePath } from 'next/cache';

export const getMenus = async ({ date }: { date: Date }) => {
  return await prisma.menu.findMany({
    where: {
      date: date,
    },
    include: {
      items: true,
      location: true,
    },
    orderBy: {
      location: {
        name: 'asc',
      },
    },
  });
};

export const refreshLocation = async (locationId: number) => {
  try {
    const menu = await findOrCreateMenuForLocation(locationId);
    await createMenuItemsForMenu(menu);
    revalidatePath('/', 'page');
    revalidatePath('/api/menus/today', 'page');
  } catch (error) {
    console.error(`Syncing location ${locationId} failed`, error);
  }
};
