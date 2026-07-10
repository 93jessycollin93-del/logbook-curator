import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { AppHeader } from "@/components/journal/AppHeader";
import { BottomNav } from "@/components/journal/BottomNav";
import { NewEntryDialog } from "@/components/journal/NewEntryDialog";
import { fetchEntries, STATUS_LABELS } from "@/lib/journal";

export const Route = createFileRoute("/archive")({
  head: () => ({ meta: [{ title: "Archive — Hypothesis.Log" }] }),
  component: Archive,
});

function Archive() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "routine" | "anomaly" | "milestone" | "draft">("all");
  const [newEntry, setNewEntry] = useState(false);
  const entries = useQuery({ queryKey: ["entries"], queryFn: () => fetchEntries() });

  const ql = q.trim().toLowerCase();
  const filtered = (entries.data ?? []).filter((e) => {
    if (filter !== "all" && e.status !== filter) return false;
    if (!ql) return true;
    return e.title.toLowerCase().includes(ql) ||
      (e.hypothesis ?? "").toLowerCase().includes(ql) ||
      e.tags.join(" ").toLowerCase().includes(ql);
  });

  // Group by month
  const groups: Record<string, typeof filtered> = {};
  filtered.forEach((e) => {
    const key = e.entry_date.slice(0, 7);
    (groups[key] ??= []).push(e);
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader eyebrow="Hypothesis.Log" title="Archive" />
      <main className="p-5 space-y-5">
        <div className="relative">
          <Search className="absolute inset-y-0 left-3 my-auto size-4 text-muted-foreground pointer-events-none" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search archive…"
            className="w-full bg-card border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5">
          {(["all", "routine", "anomaly", "milestone", "draft"] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`flex-none text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-colors ${
                filter === s ? "bg-foreground text-background" : "bg-card border border-border text-muted-foreground"
              }`}>
              {s === "all" ? "All" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {Object.entries(groups).length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center">
            <p className="text-sm font-semibold mb-1">Nothing in the archive</p>
            <p className="text-xs text-muted-foreground">No entries match your filters</p>
          </div>
        ) : Object.entries(groups).map(([month, items]) => (
          <section key={month}>
            <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
              {new Date(month + "-01").toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </h2>
            <div className="space-y-2">
              {items.map((e) => (
                <Link key={e.id} to="/entries/$entryId" params={{ entryId: e.id }}
                  className="block bg-card border border-border rounded-xl p-3 hover:border-primary/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-muted-foreground">{e.entry_date}</span>
                    <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                      {STATUS_LABELS[e.status] ?? e.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm">{e.title}</h4>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
      <BottomNav onNew={() => setNewEntry(true)} />
      <NewEntryDialog open={newEntry} onOpenChange={setNewEntry} />
    </div>
  );
}