import Link from "next/link";
import { BottomTabs, SettingsLink, SideNav, SpaceSwitch } from "@/components/admin/nav";
import { getDb, getWorkspaceId } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const db = await getDb();
  const ws = await getWorkspaceId();
  const [{ demo }] = (await db.query<{ demo: boolean }>(
    "select exists(select 1 from projects where workspace_id=$1 and is_demo) or exists(select 1 from partners where workspace_id=$1 and is_demo) as demo", [ws])) as [{ demo: boolean }];
  const Logo = (
    <Link href="/leads" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="grid size-7 place-items-center rounded-md bg-foreground text-xs font-bold text-background">LF</span>
      LeadFactory
    </Link>
  );
  return (
    <div className="lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r bg-card px-3 py-4 lg:flex">
        <div className="px-2.5 pb-5">{Logo}</div>
        <SideNav />
        <div className="mt-auto space-y-2">
          <SettingsLink />
          <p className="px-2.5 text-xs text-muted-foreground">MVP v0.2 — usage interne</p>
        </div>
      </aside>
      <div className="min-w-0 pb-20 lg:pb-0">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b bg-card/90 px-4 backdrop-blur lg:hidden">
          {Logo}
          <div className="w-44"><SpaceSwitch compact /></div>
        </header>
        {demo && (
          <div role="status" className="border-b bg-warning/15 px-4 py-2 text-center text-xs font-medium text-warning lg:px-8">
            Données de démonstration fictives présentes. <Link href="/reglages" className="underline">Les supprimer</Link>
          </div>
        )}
        <main className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
      <BottomTabs />
    </div>
  );
}
