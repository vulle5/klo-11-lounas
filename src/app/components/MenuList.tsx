import { getMenus } from "@/utils/data/menus";
import Menu from "./Menu";

export default async function MenuList() {
  const menus = await getMenus({ date: new Date("2023-08-23T00:00:00.000Z") });

  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {menus.map((menu) => (
        <Menu key={menu.id} menu={menu} />
      ))}
    </ul>
  );
}
