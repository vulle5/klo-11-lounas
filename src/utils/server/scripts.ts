import "server-only";

import { DataMap, DataPath, Menu } from "@prisma/client";
import { JSDOM } from "jsdom";
import prisma from "./prisma";
import { get } from "lodash";
import { squeeze } from "@/utils";

type DataMapWithPaths = DataMap & { paths: DataPath[] };
type ResolvedPromiseType<Type> = Type extends Promise<infer X> ? X : never;

export async function createLocation({
  name,
  dataUrl,
}: {
  name: string;
  dataUrl: string;
}) {
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
  const inclusions = {
    include: {
      location: {
        include: {
          dataMap: {
            include: {
              paths: true,
            },
          },
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
  };

  // Create a new menu for today if it doesn't exist
  let menu = await prisma.menu.findFirst({
    where: {
      date: today,
      locationId,
    },
    ...inclusions,
  });
  menu ??= await prisma.menu.create({
    data: {
      date: today,
      locationId,
    },
    ...inclusions,
  });

  return menu;
}

type MenuWithDataMap = ResolvedPromiseType<
  ReturnType<typeof findOrCreateMenuForLocation>
>;

export async function createMenuItemsForMenu(menu: MenuWithDataMap) {
  if (!menu.location.dataMap) {
    throw new Error(`DataMap for location ${menu.locationId} not found`);
  }
  if (menu._count.items) {
    console.log(
      `Menu items already exist for menu ${menu.id} for location ${menu.locationId}`
    );
    return;
  }

  if (menu.location.dataMap.dataType === "json") {
    await createMenuItemsForMenuFromJson(menu);
  } else if (menu.location.dataMap.dataType === "html") {
    await createMenuItemsForMenuFromHtml(menu);
  } else {
    throw new Error(
      `DataMap dataType ${menu.location.dataMap.dataType} not supported`
    );
  }
}

async function createMenuItemsForMenuFromJson({
  location: { dataMap },
  ...menu
}: MenuWithDataMap) {
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
  const menuItemPricePath = findDataPath(dataMap, "MenuItem", "price");
  const menuDatePath = findDataPath(dataMap, "Menu", "date");

  const menuInData = menusInData.find((dataMenu) =>
    parseDateFromDateTime(new Date(get(dataMenu, menuDatePath.path))).includes(
      parseDateFromDateTime(menu.date)
    )
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
    await createMenuItemsForJson(
      menuItemOrItems,
      menuItemNamePath,
      menuItemPricePath,
      menu
    );
  } else {
    // If the path doesn't exist, the menu items are a single object
    await createMenuItemsForJson(
      menuInData,
      menuItemNamePath,
      menuItemPricePath,
      menu
    );
  }
}

function findDataPath(
  dataMap: DataMapWithPaths,
  table: string,
  column: string
): DataPath {
  const path = dataMap.paths.find(
    (path) => path.table === table && path.column === column
  );
  if (!path) {
    throw new Error(
      `DataPath not found for table: ${table}, column: ${column}`
    );
  }
  return path;
}

async function createMenuItemsForJson(
  menuItemOrItems: any[],
  menuItemNamePath: DataPath,
  menuItemPricePath: DataPath,
  menu: Menu
) {
  // Transform menu item or items to array
  const menuItems = Array.isArray(menuItemOrItems)
    ? menuItemOrItems
    : [menuItemOrItems];

  // Create menu item objects for prisma
  const data = menuItems
    .map((menuItem) => {
      const name = Array.isArray(get(menuItem, menuItemNamePath.path))
        ? get(menuItem, menuItemNamePath.path).join(", ")
        : get(menuItem, menuItemNamePath.path);

      const price = get(menuItem, menuItemPricePath.path);

      return { name, price, menuId: menu.id };
    })
    .filter((menuItem) => menuItem.name);

  if (data.length > 1) {
    await prisma.menuItem.createMany({ data });
  } else if (data[0]) {
    await prisma.menuItem.create({ data: data[0] });
  } else {
    throw new Error("Menu items not found from data when creating menu items");
  }
}

// Support for lounaat.info parsing only
async function createMenuItemsForMenuFromHtml({
  location: { dataMap },
  ...menu
}: MenuWithDataMap) {
  if (!dataMap) {
    throw new Error(`json DataMap for location ${menu.locationId} not found`);
  }
  if (new URL(dataMap.dataUrl).origin !== "https://www.lounaat.info") {
    throw new Error(
      `DataMap url ${dataMap.dataUrl} is not from lounaat.info. Currently only www.lounaat.info is supported.`
    );
  }

  // Fetch data for location using dataMap url
  const data = await fetch(dataMap.dataUrl, { cache: "no-cache" })
    .then((res) => res.text())
    .catch((err) => {
      throw new Error(`Error fetching data from ${dataMap.dataUrl}: ${err}`);
    });
  if (!data) {
    throw new Error("Data not found");
  }

  // Turn data into array of possible menus
  const {
    window: { document },
  } = new JSDOM(data);
  const menus = Array.from(document.getElementById("menu")?.children ?? []);

  // Find menu with date from menu
  const menuInData = menus.find((menuElement) => {
    const possibleMenuDate =
      menuElement.getElementsByClassName("item-header")[0]?.textContent;

    if (!possibleMenuDate) return false;

    return possibleMenuDate.includes(parseDateToFindHTMLMenu(menu.date));
  });

  // Find menu items from data
  const menuItemsInData = Array.from(
    menuInData?.getElementsByClassName("item-body") ?? []
  ).at(0);
  if (!menuItemsInData) {
    throw new Error(
      "Menus items not found from data. Element with class 'item-body' not found"
    );
  }

  // From each menuItemsInData, find all elements with class 'menu-item'
  const menuItems = Array.from(
    menuItemsInData.getElementsByClassName("menu-item")
  );

  return createMenuItemFromHtml(menuItems, menu);
}

async function createMenuItemFromHtml(menuItems: Element[], menu: Menu) {
  // Create menu item objects for prisma
  const data = menuItems
    .map((menuItem) => {
      const name = squeeze(
        menuItem.getElementsByClassName("dish")[0]?.textContent?.trim() ?? "",
        " "
      );
      const price = extractPrice(
        menuItem.getElementsByClassName("price")[0]?.textContent ?? ""
      );

      return { name, price, menuId: menu.id };
    })
    .filter((menuItem) => !!menuItem.name);

  if (data.length >= 1) {
    await prisma.menuItem.createMany({ data });
  } else {
    throw new Error("Menu items not found from data when creating menu items");
  }
}

function parseDateFromDateTime(date: Date): string {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).toString();
}

// Parse date like 28.8. from Date object
function parseDateToFindHTMLMenu(date: Date): string {
  return `${date.getDate()}.${date.getMonth() + 1}.`;
}

function extractPrice(str: string): string | null {
  const regex = /[\d.,]+/g;
  const matches = str.match(regex);
  if (matches && matches.length > 0) {
    return matches[0];
  }
  return null;
}
