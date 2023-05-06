import { MenuItem } from "@prisma/client";
import { prisma } from "./prisma";
import { get } from "lodash";

export async function createLocation() {
  return await prisma.location.create({
    data: {
      name: "Quartetto Plus",
      dataMap: {
        create: {
          dataUrl:
            "https://www.compass-group.fi/menuapi/feed/json?costNumber=3114&language=fi",
          dataType: "json",
        },
      },
    },
  });
}

export async function findOrCreateMenuForLocation(locationId: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Create a new menu for today if it doesn't exist
  let menu = await prisma.menu.findFirst({
    where: {
      date: today,
      locationId,
    },
  });
  menu ??= await prisma.menu.create({
    data: {
      date: today,
      locationId,
    },
  });

  return menu;
}

export async function createMenuItemsForMenu(menuId: number) {
  // Find menu and dataMap
  const menu = await prisma.menu.findUnique({
    where: {
      id: menuId,
    },
  });
  if (!menu) {
    throw new Error(`Menu with id ${menuId} not found`);
  }
  const dataMap = await prisma.dataMap.findUnique({
    where: {
      locationId: menu.locationId,
    },
    include: {
      paths: true,
    },
  });
  if (!dataMap) {
    throw new Error(`DataMap for location ${menu.locationId} not found`);
  }

  // Fetch data for location using dataMap url
  const data = await fetch(dataMap.dataUrl, { cache: "no-cache" })
    .then((res) => res.json())
    .catch((err) => {
      throw new Error(`Error fetching data from ${dataMap.dataUrl}: ${err}`);
    });
  if (!data) {
    throw new Error("Data not found");
  }
  // Find menu items from data
  const menuItemsPath = dataMap.paths.find(
    (path) => path.table === "Menu" && path.column === "items"
  );
  if (!menuItemsPath) {
    throw new Error(
      "Menu items path not found, create dataPath with table: Menu and column: items"
    );
  }
  const menusInData = get(data, menuItemsPath.path);
  if (!Array.isArray(menusInData)) {
    throw new Error("Menus not found from data");
  }

  // Find menu item name, price paths and menu date from dataMap
  const menuItemNamePath = dataMap.paths.find(
    (path) => path.table === "MenuItem" && path.column === "name"
  );
  const menuItemPricePath = dataMap.paths.find(
    (path) => path.table === "MenuItem" && path.column === "price"
  );
  const menuDatePath = dataMap.paths.find(
    (path) => path.table === "Menu" && path.column === "date"
  );
  if (!menuItemNamePath) {
    throw new Error(
      "MenuItem name path not found, create dataPath with table: MenuItem and column: name"
    );
  }
  if (!menuItemPricePath) {
    throw new Error(
      "MenuItem price path not found, create dataPath with table: MenuItem and column: price"
    );
  }
  const menuInData = menusInData.find((dataMenu) =>
    parseDateFromDateTime(
      new Date(dataMenu[menuDatePath?.path ?? ""])
    ).includes(parseDateFromDateTime(menu.date))
  );
  if (!menuInData) {
    throw new Error(`Menu for date ${menu.date} not found from data`);
  }
  // Create menu items for menu
  // Id path is used to check if menu items are an array or a single object
  // If the name and price are included in the menuInData object, id path is not needed
  const menuItemsIdPath = dataMap.paths.find(
    (path) => path.table === "Menu" && path.column === "id"
  );
  if (menuItemsIdPath) {
    const menuItemOrItems = get(menuInData, menuItemsIdPath.path);
    if (!Array.isArray(menuItemOrItems)) {
      throw new Error("Menu items not found from data");
    }
    await createMenuItem(
      menuItemOrItems,
      menuItemNamePath,
      menuItemPricePath,
      menu
    );
  } else {
    await createMenuItem(menuInData, menuItemNamePath, menuItemPricePath, menu);
  }
}

// FIXME: Proper array and string handling and price parsing
async function createMenuItem(
  menuItemOrItems: any,
  menuItemNamePath: any,
  menuItemPricePath: any,
  menu: any
) {
  if (Array.isArray(menuItemOrItems)) {
    await prisma.menuItem.createMany({
      data: menuItemOrItems.map((menuItem: any) => ({
        name: Array.isArray(menuItem[menuItemNamePath.path])
          ? menuItem[menuItemNamePath.path].join(", ")
          : menuItem[menuItemNamePath.path],
        price: menuItem[menuItemPricePath.path],
        menuId: menu.id,
      })),
    });
  } else {
    if (!menuItemOrItems?.name) return;

    await prisma.menuItem.create({
      data: {
        name: Array.isArray(menuItemOrItems[menuItemNamePath.path])
          ? menuItemOrItems[menuItemNamePath.path].join(", ")
          : menuItemOrItems[menuItemNamePath.path],
        price: menuItemOrItems[menuItemPricePath.path],
        menu: {
          connect: {
            id: menu.id,
          },
        },
      },
    });
  }
}

function parseDateFromDateTime(date: Date): string {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).toString();
}
