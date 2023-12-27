import { refreshLocation } from '@/utils/data/menus';

export default function RefreshMenuButton({ locationId }: { locationId: number }) {
  const refreshLocationWithId = refreshLocation.bind(null, locationId);

  return (
    <form action={refreshLocationWithId}>
      <button
        className="rounded bg-slate-500 px-4 py-2 font-bold text-white hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-700"
        type="submit"
      >
        Yritä uudelleen
      </button>
    </form>
  );
}
