import { type getMenus } from '@/utils/data/menus';
import { ResolvedPromiseType } from '@/utils/types';

type MenuWithItemsAndLocation = ResolvedPromiseType<ReturnType<typeof getMenus>>[0];

export default function Menu({ menu }: { menu: MenuWithItemsAndLocation }) {
  return (
    <li className="rounded bg-slate-100 p-4 shadow-md dark:bg-slate-800" key={menu.id}>
      <h2 className="mb-5 text-2xl font-bold">{menu.location.name}</h2>
      <ul className="flex flex-col">
        {menu.items.map((item, index) => (
          <li key={item.id}>
            <span className="text-md">{item.name}</span>
            {item.price && (
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{item.price} €</span>
            )}
            <div className="mt-1 text-sm italic text-gray-600 dark:text-gray-400">{item.info}</div>
            {menu.items.length !== index + 1 && <hr className="my-2 border-t border-t-slate-500" />}
          </li>
        ))}
      </ul>
    </li>
  );
}
