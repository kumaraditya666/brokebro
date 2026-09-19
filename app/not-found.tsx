import Link from "next/link";
export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink px-4 text-white">
      <div className="glass max-w-sm rounded-[2rem] p-8 text-center">
        <div className="text-5xl">🫠</div>
        <h1 className="font-display mt-3 text-2xl font-extrabold">Lost in the mess menu?</h1>
        <p className="mt-2 text-sm text-white/55">This page vaporized like your last ₹500. Let's get you home.</p>
        <Link href="/dashboard" className="mt-5 block rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 py-3 text-sm font-bold text-black">Back to dashboard</Link>
      </div>
    </div>
  );
}
