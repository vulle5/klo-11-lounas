import { getMenus } from "@/utils/data/menus";

export default async function MenuList() {
  const menus = await getMenus({ date: new Date('2023-05-29T00:00:00.000Z') });

  return (
    <ul>
      {menus.map((menu) => (
        <li key={menu.id}>
          <h2>{menu.location.name}</h2>
          <ul>
            {menu.items.map((item) => (
              <li key={item.id}>
                <h3>{item.name}</h3>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
