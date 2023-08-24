import { getMenus } from "@/utils/data/menus";
import Menu from "./Menu";

export default async function MenuList({ date }: { date: Date }) {
  const menus = await getMenus({ date });

  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {menus.map((menu) => (
        <Menu key={menu.id} menu={menu} />
      ))}
    </ul>
  );
}
