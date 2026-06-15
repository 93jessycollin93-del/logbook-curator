import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, Archive, Plus, FlaskConical, Settings } from "lucide-react";

export function BottomNav({ onNew }: { onNew: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = [
    { to: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
    { to: "/archive", icon: Archive, label: "Archive" },
  ];
  const right = [
    { to: "/projects", icon: FlaskConical, label: "Projects" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-3 flex justify-between items-center z-40">
      {items.map((it) => {
        const active = pathname === it.to;
        const Icon = it.icon;
        return (
          <Link key={it.to} to={it.to} className="flex flex-col items-center gap-1 w-14">
            <Icon className={`size-5 ${active ? "text-primary" : "text-muted-foreground"}`} strokeWidth={active ? 2.5 : 2} />
            <span className={`text-[9px] font-bold uppercase tracking-tighter ${active ? "text-primary" : "text-muted-foreground"}`}>
              {it.label}
            </span>
          </Link>
        );
      })}
      <button
        onClick={onNew}
        className="-mt-10 size-14 bg-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center border-4 border-background text-primary-foreground transition-transform active:scale-95"
        aria-label="New entry"
      >
        <Plus className="size-6" strokeWidth={2.5} />
      </button>
      {right.map((it) => {
        const active = pathname.startsWith(it.to);
        const Icon = it.icon;
        return (
          <Link key={it.to} to={it.to} className="flex flex-col items-center gap-1 w-14">
            <Icon className={`size-5 ${active ? "text-primary" : "text-muted-foreground"}`} strokeWidth={active ? 2.5 : 2} />
            <span className={`text-[9px] font-bold uppercase tracking-tighter ${active ? "text-primary" : "text-muted-foreground"}`}>
              {it.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}