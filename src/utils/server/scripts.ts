import { prisma } from "./prisma";
import { get } from "lodash";

export async function createLocation() {
  return await prisma.location.create({
    data: {
      name: "Quartetto Plus",
      dataMap: {
        create: {
          dataUrl: "https://www.compass-group.fi/menuapi/feed/json?costNumber=3114&language=fi",
          dataType: "json"
        }
      }
    }
  });
}

export async function createMenuForLocation(locationId: number) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Create a new menu for today if it doesn't exist
  const menu = await prisma.menu.findFirst({
    where: {
      date: today,
      locationId
    }
  })
  if (!menu) {
    await prisma.menu.create({
      data: {
        date: today,
        locationId
      }
    });
  }
}

export async function createMenuItemsForMenu(menuId: number) {
  const menu = await prisma.menu.findUnique({
    where: {
      id: menuId
    }
  });
  if (!menu) {
    throw new Error(`Menu with id ${menuId} not found`);
  }
  const dataMap = await prisma.dataMap.findUnique({
    where: {
      locationId: menu.locationId
    },
    include: {
      paths: true
    }
  });
  if (!dataMap) {
    throw new Error(`DataMap for location ${menu.locationId} not found`);
  }

  const data = await fetch(dataMap.dataUrl).then(res => res.json());
  if (!data) {
    throw new Error('Data not found');
  }
  const menuItemsPath = dataMap.paths.find(path => path.table === "Menu" && path.column === "items");
  if (!menuItemsPath) {
    throw new Error('Menu items path not found, create dataPath with table: Menu and column: items');
  }
  const menusInData = get(data, menuItemsPath.path);
  if (!Array.isArray(menusInData)) {
    throw new Error('Menus not found from data');
  }

  const menuItemNamePath = dataMap.paths.find(path => path.table === "MenuItem" && path.column === "name");
  const menuItemPricePath = dataMap.paths.find(path => path.table === "MenuItem" && path.column === "price");
  if (!menuItemNamePath) {
    throw new Error('MenuItem name path not found, create dataPath with table: MenuItem and column: name');
  }
  if (!menuItemPricePath) {
    throw new Error('MenuItem price path not found, create dataPath with table: MenuItem and column: price');
  }
  // FIXME: Hard coded menu item creation
  const menuItems = menusInData.find(dataMenu => parseDateFromDateTime(new Date(dataMenu['Date'])) === parseDateFromDateTime(menu.date))['SetMenus'];
  if (!Array.isArray(menuItems)) {
    throw new Error('Menu items not found from data');
  }
  menuItems.forEach(async (menuItem: any) => {
    // FIXME: Prisma sqlite is garbage... switch to proper database that supports createMany
    // FIXME: Proper array and string handling and price parsing
    await prisma.menuItem.create({
      data: {
        name: Array.isArray(menuItem[menuItemNamePath.path]) ? menuItem[menuItemNamePath.path].join(', ') : menuItem[menuItemNamePath.path],
        price: Number.isNaN(parseFloat(menuItem[menuItemPricePath.path])) ? 0 : parseFloat(menuItem[menuItemPricePath.path]),
        menu: {
          connect: {
            id: menu.id
          }
        }
      }
    });
  });
}

function parseDateFromDateTime(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toString();
}
