import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";
import { AppHeader } from "@/components/journal/AppHeader";
import { BottomNav } from "@/components/journal/BottomNav";
import { NewProjectDialog } from "@/components/journal/NewProjectDialog";
import { NewEntryDialog } from "@/components/journal/NewEntryDialog";
import { fetchProjects, colorClasses, PROJECT_STATUS_LABELS } from "@/lib/journal";

export const Route = createFileRoute("/_authenticated/projects/")({
  head: () => ({ meta: [{ title: "Projects — Hypothesis.Log" }] }),
  component: ProjectsIndex,
});

function ProjectsIndex() {
  const [newProject, setNewProject] = useState(false);
  const [newEntry, setNewEntry] = useState(false);
  const projects = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });

  // Group by category
  const grouped = (projects.data ?? []).reduce<Record<string, typeof projects.data extends infer T ? T extends Array<infer U> ? U[] : never : never>>(
    (acc, p) => {
      (acc[p.category] ??= []).push(p);
      return acc;
    },
    {} as Record<string, never>,
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader eyebrow="Hypothesis.Log" title="Projects" />
      <main className="p-5 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            {projects.data?.length ?? 0} projects · {Object.keys(grouped).length} categories
          </p>
          <button
            onClick={() => setNewProject(true)}
            className="text-xs font-bold text-primary flex items-center gap-1"
          >
            <Plus className="size-3" /> New project
          </button>
        </div>

        {Object.entries(grouped).length === 0 && !projects.isLoading && (
          <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center">
            <p className="text-sm font-semibold mb-1">No projects yet</p>
            <p className="text-xs text-muted-foreground mb-4">Create one to group your research</p>
            <button onClick={() => setNewProject(true)} className="text-xs font-bold text-primary">+ Create project</button>
          </div>
        )}

        {Object.entries(grouped).map(([cat, items]) => (
          <section key={cat}>
            <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">{cat}</h2>
            <div className="space-y-2">
              {items.map((p) => {
                const c = colorClasses(p.color);
                return (
                  <Link
                    key={p.id}
                    to="/projects/$projectId"
                    params={{ projectId: p.id }}
                    className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-primary/30 transition-colors"
                  >
                    <div className={`size-10 rounded-lg flex items-center justify-center ${c.soft}`}>
                      <div className={`size-5 rounded-sm ${c.swatch}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm truncate">{p.name}</h3>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {p.phase ?? PROJECT_STATUS_LABELS[p.status]} · {p.progress}%
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </main>

      <BottomNav onNew={() => setNewEntry(true)} />
      <NewProjectDialog open={newProject} onOpenChange={setNewProject} />
      <NewEntryDialog open={newEntry} onOpenChange={setNewEntry} />
    </div>
  );
}