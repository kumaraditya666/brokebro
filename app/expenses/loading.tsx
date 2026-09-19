export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pl-72 lg:pr-8" aria-label="Loading expenses">
      <div className="shimmer h-9 w-48 rounded-2xl" />
      <div className="shimmer mt-4 h-12 rounded-2xl" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => <div key={i} className="shimmer h-24 rounded-3xl" />)}
      </div>
    </div>
  );
}
