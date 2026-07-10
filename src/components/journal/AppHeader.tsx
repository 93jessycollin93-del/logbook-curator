import { useEffect, useState } from "react";

export function AppHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  const [initials, setInitials] = useState("RJ");

  useEffect(() => {
    try {
      const name = localStorage.getItem("logbook:displayName") ?? "";
      if (name.trim()) setInitials(name.trim().slice(0, 2).toUpperCase());
    } catch { /* SSR / storage disabled */ }
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-5 py-4 flex items-center justify-between">
      <div className="min-w-0">
        <h1 className="text-[10px] font-mono font-medium uppercase tracking-[0.2em] text-primary">{eyebrow}</h1>
        <p className="text-lg font-bold tracking-tight truncate">{title}</p>
      </div>
      <div className="size-10 rounded-full bg-foreground flex items-center justify-center text-background text-xs font-bold shrink-0">
        {initials}
      </div>
    </header>
  );
}
