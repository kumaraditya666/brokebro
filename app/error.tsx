"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-ink px-4 text-white">
      <div className="glass max-w-sm rounded-[2rem] p-8 text-center">
        <div className="text-5xl">🛟</div>
        <h1 className="font-display mt-3 text-2xl font-extrabold">Something went sideways.</h1>
        <p className="mt-2 text-sm text-white/55">Your money is safe. We just lost the page.</p>
        <button onClick={reset} className="mt-5 w-full rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 py-3 text-sm font-bold text-black">Try Again</button>
        <a href="/dashboard" className="mt-2 block text-sm font-bold text-lime-200 hover:underline">Back to dashboard</a>
      </div>
    </div>
  );
}
