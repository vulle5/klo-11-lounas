import { dateTimeFormatter } from "@/utils";

export default function About() {
  return (
    <main className="p-2 md:p-4">
      <h1 className="mb-4 text-3xl">{dateTimeFormatter.format(new Date())}</h1>
    </main>
  );
}
