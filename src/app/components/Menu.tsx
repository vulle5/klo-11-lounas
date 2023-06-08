import { Location, Menu, MenuItem } from "@prisma/client";

type MenuWithItemsAndLocation = Menu & { items: MenuItem[] } & {
  location: Location;
};

export default function Menu({ menu }: { menu: MenuWithItemsAndLocation }) {
  return (
    <li className="dark:bg-slate-800 bg-slate-100 shadow-md rounded p-4" key={menu.id}>
      <h2 className="text-xl font-bold mb-4">{menu.location.name}</h2>
      <ul className="flex flex-col">
        {menu.items.map((item, index) => (
          <li key={item.id}>
            <span className="text-md">{item.name}</span>
            {item.price && <span className="text-sm dark:text-gray-400 text-gray-600 ml-2">
              {item.price} €
            </span>}
            {menu.items.length !== index + 1 && <hr className="my-2 border-t border-t-slate-500" />}
          </li>
        ))}
      </ul>
    </li>
  );
}
