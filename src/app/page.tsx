import MenuList from "./components/MenuList";

export default async function Home() {
  return (
    <main className="p-2 md:p-4">
      <h1 className="mb-4 text-2xl">Klo 11 Lounas</h1>
      <MenuList />
    </main>
  );
}
