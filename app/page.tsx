import { MarketingNav } from "@/components/brokebro/AppShell";
import { Landing } from "@/components/brokebro/Landing";

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-ink text-white">
      <div className="cursor-glow pointer-events-none fixed inset-0" aria-hidden />
      <MarketingNav />
      <Landing />
    </main>
  );
}
