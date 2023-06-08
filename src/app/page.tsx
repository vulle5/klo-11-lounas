import MenuList from "./components/MenuList";

export default async function Home() {
  return (
    <main className="md:p-4 p-2">
      <h1 className="text-2xl mb-4">Klo 11 Lounas</h1>
      <MenuList />
    </main>
  )
}
