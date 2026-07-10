import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Trash2, MoreVertical } from "lucide-react";
import { AppHeader } from "@/components/journal/AppHeader";
import { BottomNav } from "@/components/journal/BottomNav";
import { NewEntryDialog } from "@/components/journal/NewEntryDialog";
import { fetchProject, fetchEntries, deleteProject, colorClasses, STATUS_LABELS, PROJECT_STATUS_LABELS } from "@/lib/journal";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/projects/$projectId")({
  component: ProjectPage,
});

function ProjectPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [newEntry, setNewEntry] = useState(false);

  const project = useQuery({ queryKey: ["project", projectId], queryFn: () => fetchProject(projectId) });
  const entries = useQuery({ queryKey: ["entries", projectId], queryFn: () => fetchEntries(projectId) });

  const del = useMutation({
    mutationFn: async () => {
      await deleteProject(projectId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["entries"] });
      toast.success("Project deleted");
      navigate({ to: "/projects" });
    },
  });

  if (project.isLoading) {
    return (
      <div className="min-h-screen bg-background p-5">
        <div className="h-32 bg-card border border-border rounded-xl animate-pulse" />
      </div>
    );
  }
  const p = project.data;
  if (!p) {
    return (
      <div className="min-h-screen bg-background p-5 text-center pt-20">
        <p className="text-sm">Project not found.</p>
        <Link to="/projects" className="text-primary text-xs font-bold mt-3 inline-block">← Back to projects</Link>
      </div>
    );
  }
  const c = colorClasses(p.color);

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader eyebrow={p.category} title={p.name} />

      <main className="p-5 space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/projects" className="flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3" /> Projects
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1 rounded hover:bg-muted">
              <MoreVertical className="size-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => { if (confirm("Delete this project? Entries will keep their data but lose the link.")) del.mutate(); }}
                className="text-destructive focus:text-destructive">
                <Trash2 className="size-3.5 mr-2" /> Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Project header card */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className={`size-10 rounded-lg flex items-center justify-center ${c.soft}`}>
              <div className={`size-5 rounded-sm ${c.swatch}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  {p.phase ?? PROJECT_STATUS_LABELS[p.status]}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">{p.status}</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight">{p.name}</h1>
            </div>
          </div>
          {p.description && <p className="text-sm text-muted-foreground leading-relaxed mb-4">{p.description}</p>}
          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${c.swatch}`} style={{ width: `${p.progress}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>PROGRESS</span><span>{p.progress}%</span>
          </div>
        </section>

        {/* Entries */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider">Log entries</h2>
            <span className="text-[10px] font-mono text-muted-foreground">{entries.data?.length ?? 0} TOTAL</span>
          </div>

          {(entries.data?.length ?? 0) === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
              <p className="text-sm font-semibold mb-1">No entries in this project</p>
              <button onClick={() => setNewEntry(true)} className="text-xs font-bold text-primary mt-2">+ Log first entry</button>
            </div>
          ) : entries.data!.map((e) => (
            <Link
              key={e.id}
              to="/entries/$entryId"
              params={{ entryId: e.id }}
              className="block bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-mono bg-muted px-2 py-1 rounded">{e.entry_date.replaceAll("-", ".")}</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                  {STATUS_LABELS[e.status] ?? e.status}
                </span>
              </div>
              <h4 className="font-bold text-sm">{e.title}</h4>
            </Link>
          ))}
        </section>
      </main>

      <BottomNav onNew={() => setNewEntry(true)} />
      <NewEntryDialog open={newEntry} onOpenChange={setNewEntry} defaultProjectId={projectId} />
    </div>
  );
}