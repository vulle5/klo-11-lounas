import { dateTimeFormatter } from "@/utils";
import MenuList from "./components/MenuList";

export default async function Home() {
  const today = new Date();

  return (
    <main className="p-2 md:p-4">
      <h1 className="mb-4 text-3xl">Klo 11 Lounas</h1>
      <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
        {dateTimeFormatter.format(today)}
      </p>
      <MenuList date={today} />
    </main>
  );
}
