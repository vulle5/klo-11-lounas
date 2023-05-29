import { DataMap, DataPath, Menu } from "@prisma/client";
import { prisma } from "./prisma";
import { get } from "lodash";

type DataMapWithPaths = DataMap & { paths: DataPath[] };

export async function createLocation({ name, dataUrl }: { name: string; dataUrl: string }) {
  return await prisma.location.create({
    data: {
      name,
      dataMap: {
        create: {
          dataUrl,
          dataType: "json",
        },
      },
    },
  });
}

export async function findOrCreateMenuForLocation(locationId: number) {
  const today = new Date();

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
  const menu = await prisma.menu.findFirst({
    where: {
      id: menuId,
    },
  });
  if (!menu) {
    throw new Error(`Menu with id ${menuId} not found`);
  }
  const dataMap = await prisma.dataMap.findFirst({
    where: {
      locationId: menu.locationId,
      dataType: "json"
    },
    include: {
      paths: true,
    },
  });
  if (!dataMap) {
    throw new Error(`json DataMap for location ${menu.locationId} not found`);
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
  const menuItemsPath = findDataPath(dataMap, "Menu", "items");
  const menusInData = get(data, menuItemsPath.path);
  if (!Array.isArray(menusInData)) {
    throw new Error("Menus not found from data");
  }

  // Find menu item name, price paths and menu date from dataMap
  const menuItemNamePath = findDataPath(dataMap, "MenuItem", "name");
  const menuItemPricePath = findDataPath(dataMap,"MenuItem", "price");
  const menuDatePath = findDataPath(dataMap, "Menu", "date");

  const menuInData = menusInData.find((dataMenu) =>
    parseDateFromDateTime(
      new Date(get(dataMenu, menuDatePath.path))
    ).includes(parseDateFromDateTime(menu.date))
  );
  if (!menuInData) {
    throw new Error(`Menu for date ${menu.date} not found from data`);
  }

  // Find the path to the menu items in the dataMap
  const menuItemsIdPath = dataMap.paths.find(
    (path) => path.table === "Menu" && path.column === "id"
  );

  // If the path exists, the menu items are an array
  if (menuItemsIdPath) {
    const menuItemOrItems = get(menuInData, menuItemsIdPath.path);
    if (!Array.isArray(menuItemOrItems)) {
      throw new Error("Menu items not found from data");
    }
    // Create menu items for each item in the array
    await createMenuItem(
      menuItemOrItems,
      menuItemNamePath,
      menuItemPricePath,
      menu
    );
  } else {
    // If the path doesn't exist, the menu items are a single object
    await createMenuItem(menuInData, menuItemNamePath, menuItemPricePath, menu);
  }
}

function findDataPath(dataMap: DataMapWithPaths, table: string, column: string): DataPath {
  const path = dataMap.paths.find((path) => path.table === table && path.column === column);
  if (!path) {
    throw new Error(`DataPath not found for table: ${table}, column: ${column}`);
  }
  return path;
}

async function createMenuItem(
  menuItemOrItems: any[],
  menuItemNamePath: DataPath,
  menuItemPricePath: DataPath,
  menu: Menu
) {
  // Transform menu item or items to array
  const menuItems = Array.isArray(menuItemOrItems) ? menuItemOrItems : [menuItemOrItems];

  // Create menu item objects for prisma 
  const data = menuItems.map((menuItem) => {
    const name = Array.isArray(get(menuItem, menuItemNamePath.path))
      ? get(menuItem, menuItemNamePath.path).join(", ")
      : get(menuItem, menuItemNamePath.path);

    const price = get(menuItem, menuItemPricePath.path);

    return { name, price, menuId: menu.id };
  }).filter((menuItem) => menuItem.name);

  if (data.length > 1) {
    await prisma.menuItem.createMany({ data });
  } else {
    await prisma.menuItem.create({ data: data[0] });
  }
}

function parseDateFromDateTime(date: Date): string {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).toString();
}
