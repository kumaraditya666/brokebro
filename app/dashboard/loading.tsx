export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pl-72 lg:pr-8" aria-label="Loading dashboard">
      <div className="shimmer h-9 w-56 rounded-2xl" />
      <div className="shimmer mt-2 h-4 w-80 rounded-xl" />
      <div className="shimmer mt-6 h-44 rounded-3xl" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="shimmer h-28 rounded-3xl" />)}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="shimmer h-64 rounded-3xl" />)}
      </div>
    </div>
  );
}
