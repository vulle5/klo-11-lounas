import { dateFormatter } from "@/utils";
import MenuList from "./components/MenuList";

export default async function Home() {
  return (
    <main className="p-2 md:p-4">
      <h1 className="mb-4 text-2xl">Klo 11 Lounas</h1>
      <p className="mb-2 text-sm text-gray-500">
        {dateFormatter.format(new Date())}
      </p>
      <MenuList />
    </main>
  );
}
