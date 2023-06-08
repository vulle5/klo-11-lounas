import { getMenus } from "@/utils/data/menus";
import Menu from './Menu';

export default async function MenuList() {
  const menus = await getMenus({ date: new Date('2023-06-08T00:00:00.000Z') });

  return (
    <ul className="grid xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 gap-4">
      {menus.map((menu) => <Menu key={menu.id} menu={menu} />)}
    </ul>
  );
}
