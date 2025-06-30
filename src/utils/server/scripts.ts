import 'server-only';

import { DataPath, Menu } from '@prisma/client';
import { JSDOM, VirtualConsole } from 'jsdom';
import prisma from './prisma';
import { get } from 'lodash';
import { isNullish, squeeze } from '@/utils';
import { ResolvedPromiseType } from '../types';

const virtualConsole = new VirtualConsole();
virtualConsole.on('error', () => {
  // No-op to skip console errors.
});

type MenuWithDataMap = ResolvedPromiseType<ReturnType<typeof findOrCreateMenuForLocation>>;

export async function createLocation({ name, dataUrl }: { name: string; dataUrl: string }) {
  return await prisma.location.create({
    data: {
      name,
      dataMap: {
        create: {
          dataUrl,
          dataType: 'json',
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

export async function createMenuItemsForMenu(menu: MenuWithDataMap) {
  if (!menu.location.dataMap) {
    throw new Error(`DataMap for location ${menu.locationId} not found`);
  }
  if (menu._count.items) {
    console.log(`Menu items already exist for menu ${menu.id} for location ${menu.locationId}`);
    return;
  }

  switch (menu.location.dataMap.dataType) {
    case 'json':
      await createMenuItemsForMenuFromJson(menu);
      break;
    case 'old_html':
      await DEPRECATED_createMenuItemsForMenuFromHtml(menu);
      break;
    case 'html':
      await createMenuItemsForMenuFromHtml(menu);
      break;
    default:
      throw new Error(`DataMap dataType ${menu.location.dataMap.dataType} not supported`);
  }
}

export async function createMenuItemsForMenuFromJson({
  location: { dataMap },
  ...menu
}: MenuWithDataMap) {
  if (!dataMap || !(dataMap.dataType === 'json')) {
    throw new Error(`json DataMap for location ${menu.locationId} not found`);
  }

  // Fetch data for location using dataMap url
  const data = await fetch(dataMap.dataUrl, { cache: 'no-cache' })
    .then((res) => res.json())
    .catch((err) => {
      throw new Error(`Error fetching data from ${dataMap.dataUrl}: ${err}`);
    });
  if (!data) {
    throw new Error('Data not found');
  }

  // Find menu items from data
  const menuItemsPath = findDataPath(dataMap.paths, 'Menu', 'items');
  const menusInData = get(data, menuItemsPath.path);
  if (!Array.isArray(menusInData)) {
    throw new Error('Menus not found from data');
  }

  // Find menu item name, price paths and menu date from dataMap
  const menuItemNamePath = findDataPath(dataMap.paths, 'MenuItem', 'name');
  const menuItemPricePath = findDataPath(dataMap.paths, 'MenuItem', 'price');
  const menuDatePath = findDataPath(dataMap.paths, 'Menu', 'date');

  const menuInData = menusInData.find((dataMenu) =>
    parseDateFromDateTime(new Date(get(dataMenu, menuDatePath.path))).includes(
      parseDateFromDateTime(menu.date),
    ),
  );
  if (!menuInData) {
    throw new Error(`Menu for date ${menu.date} not found from data`);
  }

  // Find the path to the menu items in the dataMap
  const menuItemsIdPath = dataMap.paths.find(
    (path) => path.table === 'Menu' && path.column === 'id',
  );

  // If the path exists, the menu items are an array
  if (menuItemsIdPath) {
    const menuItemOrItems = get(menuInData, menuItemsIdPath.path);
    if (!Array.isArray(menuItemOrItems)) {
      throw new Error('Menu items not found from data');
    }
    // Create menu items for each item in the array
    await createMenuItemsForJson(menuItemOrItems, menuItemNamePath, menuItemPricePath, menu);
  } else {
    // If the path doesn't exist, the menu items are a single object
    await createMenuItemsForJson(menuInData, menuItemNamePath, menuItemPricePath, menu);
  }
}

async function createMenuItemsForJson(
  menuItemOrItems: any,
  menuItemNamePath: DataPath,
  menuItemPricePath: DataPath,
  menu: Menu,
) {
  // Transform menu item or items to array
  const menuItems = Array.isArray(menuItemOrItems) ? menuItemOrItems : [menuItemOrItems];

  // Create menu item objects for prisma
  const data = menuItems
    .flatMap((menuItem) => {
      // If the menu item name is an array, create a menu item for each name
      if (Array.isArray(get(menuItem, menuItemNamePath.path))) {
        return get(menuItem, menuItemNamePath.path).map((name: string) => {
          const price = extractPrice(name);

          return { name, price, menuId: menu.id };
        });
      }

      const name = get(menuItem, menuItemNamePath.path);
      const price = get(menuItem, menuItemPricePath.path);

      return { name, price, menuId: menu.id };
    })
    .filter((menuItem) => menuItem.name);

  if (data.length > 1) {
    await prisma.menuItem.createMany({ data });
  } else if (data[0]) {
    await prisma.menuItem.create({ data: data[0] });
  } else {
    throw new Error('Menu items not found from data when creating menu items');
  }
}

export async function createMenuItemsForMenuFromHtml({
  location: { dataMap },
  ...menu
}: MenuWithDataMap) {
  if (!dataMap || !(dataMap.dataType === 'html')) {
    throw new Error(`html DataMap for location ${menu.locationId} not found`);
  }

  // Fetch data for location using dataMap url
  const htmlString = await fetch(dataMap.dataUrl, { cache: 'no-cache' })
    .then((res) => res.text())
    .catch((err) => {
      throw new Error(`Error fetching data from ${dataMap.dataUrl}: ${err}`);
    });
  if (!htmlString) throw new Error('Data not found');

  const {
    window: { document },
  } = new JSDOM(htmlString, { virtualConsole });

  const dateToFind = parseDateToFindHTMLMenu(menu.date);

  // --- Get required paths for the parsing strategy ---
  const menuDatePath = findDataPath(dataMap.paths, 'Menu', 'date');
  const menuItemNamePath = findDataPath(dataMap.paths, 'MenuItem', 'name');
  const menuItemsKeyAttrPath = findDataPath(dataMap.paths, 'Menu', 'items_key_attribute');
  const menuItemsContainerPath = findDataPath(dataMap.paths, 'Menu', 'items_container');

  // --- Optional paths ---
  const menuItemPricePath = dataMap.paths.find(
    (p) => p.table === 'MenuItem' && p.column === 'price',
  );
  const menuItemInfoPath = dataMap.paths.find((p) => p.table === 'MenuItem' && p.column === 'info');

  // --- Find the date element to get the key for the menu container ---
  const dateElement = Array.from(document.querySelectorAll(menuDatePath.path)).find((el) =>
    el.textContent?.includes(dateToFind),
  );

  if (!dateElement) {
    throw new Error(
      `Date element for "${dateToFind}" not found using selector "${menuDatePath.path}"`,
    );
  }

  const key = dateElement.getAttribute(menuItemsKeyAttrPath.path);
  if (!key) {
    throw new Error(
      `Could not find key attribute "${menuItemsKeyAttrPath.path}" from date element.`,
    );
  }

  // --- Find the menu container and extract items ---
  const containerSelector = menuItemsContainerPath.path.replace('%KEY%', key);
  const menuContainer = document.querySelector(containerSelector);

  if (!menuContainer) {
    throw new Error(`Menu container not found with selector "${containerSelector}"`);
  }

  const menuItemsInData = Array.from(menuContainer.querySelectorAll(menuItemNamePath.path));
  if (menuItemsInData.length === 0) {
    throw new Error(
      `No menu items found within "${containerSelector}" using selector "${menuItemNamePath.path}"`,
    );
  }

  // --- Extract overall price if available ---
  // If the menu item price path is defined, we will try to extract the overall price
  let overallPrice: string | null | undefined;
  if (menuItemPricePath) {
    const priceElement = menuContainer.querySelector(menuItemPricePath.path);
    overallPrice = extractPrice(priceElement?.textContent ?? '');
  }

  // --- Map elements to Prisma data objects ---
  const data = menuItemsInData.map((menuItemNode) => {
    const textContent = menuItemNode.textContent ?? '';

    // If the menu item has a price, use it; otherwise, extract the price from the text content
    const price =
      overallPrice ??
      (menuItemPricePath
        ? menuItemNode.querySelector(menuItemPricePath.path)?.textContent ??
          extractPrice(textContent)
        : extractPrice(textContent));

    const name = squeeze(
      // If there's a single price for all items, don't try to remove it from the name
      overallPrice ? textContent : textContent.replace(/\d{1,3}([,.]\d{2}) ?\€?/, ''),
      ' ',
    ).trim();

    const info = menuItemInfoPath
      ? menuItemNode.querySelector(menuItemInfoPath.path)?.textContent ?? ''
      : '';

    return { name, price, info, menuId: menu.id };
  });

  return createMenuItemFromHtml(data);
}

type MenuItem = {
  name: string;
  price: string | null | undefined;
  info: string | null | undefined;
  menuId: number;
};

async function createMenuItemFromHtml(data: MenuItem[]) {
  if (data.length >= 1) {
    await prisma.menuItem.createMany({ data });
  } else {
    throw new Error('Menu items not found from data when creating menu items');
  }
}

/**
 * Support for lounaat.info parsing only
 * @param param0 MenuWithDataMap
 * @deprecated Use createMenuItemsForMenuFromHtml instead
 */
async function DEPRECATED_createMenuItemsForMenuFromHtml({
  location: { dataMap },
  ...menu
}: MenuWithDataMap) {
  if (!dataMap) {
    throw new Error(`json DataMap for location ${menu.locationId} not found`);
  }
  if (new URL(dataMap.dataUrl).origin !== 'https://www.lounaat.info') {
    throw new Error(
      `DataMap url ${dataMap.dataUrl} is not from lounaat.info. Currently only www.lounaat.info is supported.`,
    );
  }

  // Fetch data for location using dataMap url
  const data = await fetch(dataMap.dataUrl, { cache: 'no-cache' })
    .then((res) => res.text())
    .catch((err) => {
      throw new Error(`Error fetching data from ${dataMap.dataUrl}: ${err}`);
    });
  if (!data) {
    throw new Error('Data not found');
  }

  // Turn data into array of possible menus
  const {
    window: { document },
  } = new JSDOM(data);
  const menus = Array.from(document.getElementById('menu')?.children ?? []);

  // Find menu with date from menu
  const menuInData = menus.find((menuElement) => {
    const possibleMenuDate = menuElement.getElementsByClassName('item-header')[0]?.textContent;

    if (!possibleMenuDate) return false;

    return possibleMenuDate.includes(parseDateToFindHTMLMenu(menu.date));
  });

  // Find menu items from data
  const menuItemsInData = Array.from(menuInData?.getElementsByClassName('item-body') ?? []).at(0);
  if (!menuItemsInData) {
    throw new Error("Menus items not found from data. Element with class 'item-body' not found");
  }

  // From each menuItemsInData, find all elements with class 'menu-item'
  const menuItems = Array.from(menuItemsInData.getElementsByClassName('menu-item'));

  return DEPRECATED_createMenuItemFromHtml(menuItems, menu);
}

/**
 * @see DEPRECATED_createMenuItemsForMenuFromHtml
 * @deprecated Use createMenuItemsForMenuFromHtml instead
 */
async function DEPRECATED_createMenuItemFromHtml(menuItems: Element[], menu: Menu) {
  // Create menu item objects for prisma
  const data = menuItems.map((menuItem) => {
    const name = squeeze(
      menuItem.getElementsByClassName('dish')[0]?.textContent?.trim() ?? '',
      ' ',
    );
    const price = extractPrice(menuItem.getElementsByClassName('price')[0]?.textContent ?? '');
    const info = squeeze(
      menuItem.getElementsByClassName('info')[0]?.textContent?.trim() ?? '',
      ' ',
    );

    return { name, price, info, menuId: menu.id };
  });

  if (data.length >= 1) {
    await prisma.menuItem.createMany({ data });
  } else {
    throw new Error('Menu items not found from data when creating menu items');
  }
}

function findDataPath(paths: DataPath[], table: string, column: string): DataPath {
  const path = paths.find((path) => path.table === table && path.column === column);
  if (!path) {
    throw new Error(`DataPath not found for table: ${table}, column: ${column}`);
  }

  return path;
}

function parseDateFromDateTime(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toString();
}

// Parse date like 28.8. from Date object
function parseDateToFindHTMLMenu(date: Date): string {
  return `${date.getDate()}.${date.getMonth() + 1}.`;
}

function extractPrice(str: string): string | null {
  const regex = /\d{1,3}([,.]\d{2})/g;
  const matches = str.match(regex);
  if (matches && matches.length > 0) {
    return matches[0];
  }
  return null;
}
