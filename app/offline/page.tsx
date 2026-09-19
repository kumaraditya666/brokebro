import Link from "next/link";

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-[#050505] px-4 text-white">
      <div className="glass w-full max-w-sm rounded-[2rem] p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-lime-300 to-emerald-400 text-2xl font-black text-black">B</div>
        <h1 className="font-display mt-3 text-2xl font-extrabold">You&apos;re offline</h1>
        <p className="mt-2 text-sm text-white/55">
          No internet — but the music isn&apos;t gone. Your local files, playlists, likes and history all live on this device.
          Remote streams need a connection (we never cache them without permission).
        </p>
        <Link href="/" className="mt-5 block rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 py-3 text-sm font-bold text-black">
          Open BROKE MUSIC
        </Link>
        <p className="mt-3 text-[11px] text-white/35">Offline shell · local-first · zero ads.</p>
      </div>
    </div>
  );
}
