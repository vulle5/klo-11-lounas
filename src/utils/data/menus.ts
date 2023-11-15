import 'server-only';
import prisma from '@/utils/server/prisma';

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
