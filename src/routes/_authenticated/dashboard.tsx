import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, FlaskConical, Plus } from "lucide-react";
import { AppHeader } from "@/components/journal/AppHeader";
import { BottomNav } from "@/components/journal/BottomNav";
import { NewEntryDialog } from "@/components/journal/NewEntryDialog";
import { NewProjectDialog } from "@/components/journal/NewProjectDialog";
import { fetchProjects, fetchEntries, colorClasses, STATUS_LABELS, PROJECT_STATUS_LABELS } from "@/lib/journal";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Hypothesis.Log" },
      { name: "description", content: "Your scientific research journal dashboard." },
    ],
  }),
  component: Dashboard,
});

function statusTone(status: string) {
  if (status === "anomaly") return "text-anomaly";
  if (status === "milestone") return "text-primary";
  if (status === "draft") return "text-muted-foreground";
  return "text-muted-foreground";
}

function Dashboard() {
  const [query, setQuery] = useState("");
  const [newEntry, setNewEntry] = useState(false);
  const [newProject, setNewProject] = useState(false);

  const projects = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
  const entries = useQuery({ queryKey: ["entries"], queryFn: () => fetchEntries() });

  const q = query.trim().toLowerCase();
  const filteredEntries = (entries.data ?? []).filter(
    (e) => !q || e.title.toLowerCase().includes(q) || e.tags.join(" ").toLowerCase().includes(q),
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader eyebrow="Hypothesis.Log" title="Research Dashboard" />

      <main className="p-5 space-y-8">
        {/* Search */}
        <div className="relative">
          <Search className="absolute inset-y-0 left-3 my-auto size-4 text-muted-foreground pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Search experimental data..."
            className="w-full bg-card border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Active Projects */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider">Active Projects</h2>
            <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
              {(projects.data?.length ?? 0).toString().padStart(2, "0")} TOTAL
            </span>
          </div>

          {projects.isLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {[0, 1].map((i) => (
                <div key={i} className="flex-none w-64 h-36 bg-card border border-border rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (projects.data?.length ?? 0) === 0 ? (
            <button
              onClick={() => setNewProject(true)}
              className="w-full bg-card border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/40 hover:bg-primary/5 transition-colors group"
            >
              <div className="size-10 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                <FlaskConical className="size-5 text-primary" />
              </div>
              <p className="text-sm font-semibold mb-1">Start your first project</p>
              <p className="text-xs text-muted-foreground">Group related experiments and hypotheses</p>
            </button>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
              {projects.data!.map((p) => {
                const c = colorClasses(p.color);
                return (
                  <Link
                    key={p.id}
                    to="/projects/$projectId"
                    params={{ projectId: p.id }}
                    className="flex-none w-64 bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`size-8 rounded-lg flex items-center justify-center ${c.soft}`}>
                        <div className={`size-4 rounded-sm ${c.swatch}`} />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {p.phase ?? PROJECT_STATUS_LABELS[p.status] ?? "ACTIVE"}
                      </span>
                    </div>
                    <h3 className="font-bold text-base mb-1 truncate">{p.name}</h3>
                    <p className="text-xs text-muted-foreground mb-4 line-clamp-2 min-h-[2rem]">
                      {p.description ?? "No description"}
                    </p>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.swatch}`} style={{ width: `${p.progress}%` }} />
                    </div>
                    <div className="mt-2 flex justify-between text-[10px] font-mono text-muted-foreground">
                      <span>{p.category}</span>
                      <span>{p.progress}%</span>
                    </div>
                  </Link>
                );
              })}
              <button
                onClick={() => setNewProject(true)}
                className="flex-none w-32 bg-card border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                <Plus className="size-5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">New project</span>
              </button>
            </div>
          )}
        </section>

        {/* Recent Entries */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider">Recent Log Entries</h2>
            <Link to="/archive" className="text-xs font-bold text-primary">View Archive</Link>
          </div>

          {entries.isLoading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => <div key={i} className="h-32 bg-card border border-border rounded-xl animate-pulse" />)}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
              <p className="text-sm font-semibold mb-1">No entries yet</p>
              <p className="text-xs text-muted-foreground mb-4">Log your first observation</p>
              <button onClick={() => setNewEntry(true)} className="text-xs font-bold text-primary">
                + New entry
              </button>
            </div>
          ) : (
            filteredEntries.slice(0, 8).map((e) => (
              <Link
                key={e.id}
                to="/entries/$entryId"
                params={{ entryId: e.id }}
                className="block bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] font-mono bg-muted px-2 py-1 rounded">
                    {e.entry_date.replaceAll("-", ".")}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-tighter ${statusTone(e.status)}`}>
                    {STATUS_LABELS[e.status] ?? e.status}
                  </span>
                </div>
                <h4 className="font-bold text-sm mb-2">{e.title}</h4>
                {e.hypothesis && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{e.hypothesis}</p>
                )}
                {e.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
                    {e.tags.slice(0, 4).map((t) => (
                      <span key={t} className="text-[10px] font-mono text-muted-foreground">#{t}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))
          )}
        </section>
      </main>

      <BottomNav onNew={() => setNewEntry(true)} />
      <NewEntryDialog open={newEntry} onOpenChange={setNewEntry} />
      <NewProjectDialog open={newProject} onOpenChange={setNewProject} />
    </div>
  );
}