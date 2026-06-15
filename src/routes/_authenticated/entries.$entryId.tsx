import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Trash2, Save, Plus, X } from "lucide-react";
import { AppHeader } from "@/components/journal/AppHeader";
import { BottomNav } from "@/components/journal/BottomNav";
import { NewEntryDialog } from "@/components/journal/NewEntryDialog";
import { fetchEntry, fetchProjects, STATUS_LABELS, type Measurement } from "@/lib/journal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/entries/$entryId")({
  component: EntryPage,
});

function EntryPage() {
  const { entryId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [newEntry, setNewEntry] = useState(false);

  const entry = useQuery({ queryKey: ["entry", entryId], queryFn: () => fetchEntry(entryId) });
  const projects = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });

  const [form, setForm] = useState({
    title: "", status: "routine", entry_date: "",
    hypothesis: "", methods: "", results: "", conclusion: "",
    tags: [] as string[], measurements: [] as Measurement[],
    project_id: "none" as string,
  });
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (entry.data) {
      const e = entry.data;
      setForm({
        title: e.title, status: e.status, entry_date: e.entry_date,
        hypothesis: e.hypothesis ?? "", methods: e.methods ?? "",
        results: e.results ?? "", conclusion: e.conclusion ?? "",
        tags: e.tags ?? [],
        measurements: Array.isArray(e.measurements) ? (e.measurements as unknown as Measurement[]) : [],
        project_id: e.project_id ?? "none",
      });
    }
  }, [entry.data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("entries").update({
        title: form.title.trim().slice(0, 200) || "Untitled",
        status: form.status,
        entry_date: form.entry_date,
        hypothesis: form.hypothesis.trim() || null,
        methods: form.methods.trim() || null,
        results: form.results.trim() || null,
        conclusion: form.conclusion.trim() || null,
        tags: form.tags,
        measurements: form.measurements as unknown as never,
        project_id: form.project_id === "none" ? null : form.project_id,
      }).eq("id", entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: ["entry", entryId] });
      toast.success("Entry saved");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("entries").delete().eq("id", entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entries"] });
      toast.success("Entry deleted");
      navigate({ to: "/dashboard" });
    },
  });

  if (entry.isLoading) {
    return <div className="min-h-screen bg-background p-5"><div className="h-40 bg-card border border-border rounded-xl animate-pulse" /></div>;
  }
  if (!entry.data) {
    return (
      <div className="min-h-screen bg-background p-5 text-center pt-20">
        <p>Entry not found.</p>
        <Link to="/dashboard" className="text-primary text-xs font-bold mt-3 inline-block">← Dashboard</Link>
      </div>
    );
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t || form.tags.includes(t)) { setTagInput(""); return; }
    setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    setTagInput("");
  }
  function removeTag(t: string) {
    setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }));
  }
  function addMeasurement() {
    setForm((f) => ({ ...f, measurements: [...f.measurements, { label: "", value: "", unit: "" }] }));
  }
  function updateMeasurement(i: number, patch: Partial<Measurement>) {
    setForm((f) => ({
      ...f,
      measurements: f.measurements.map((m, idx) => idx === i ? { ...m, ...patch } : m),
    }));
  }
  function removeMeasurement(i: number) {
    setForm((f) => ({ ...f, measurements: f.measurements.filter((_, idx) => idx !== i) }));
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader eyebrow={STATUS_LABELS[form.status] ?? form.status} title={form.title || "Untitled"} />

      <main className="p-5 space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => history.back()} className="flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3" /> Back
          </button>
          <button
            onClick={() => { if (confirm("Delete this entry?")) del.mutate(); }}
            className="flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-destructive">
            <Trash2 className="size-3" /> Delete
          </button>
        </div>

        {/* Metadata */}
        <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Title</Label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="font-semibold text-base" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Date</Label>
              <Input type="date" value={form.entry_date} onChange={(e) => setForm((f) => ({ ...f, entry_date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="anomaly">Anomaly</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Project</Label>
            <Select value={form.project_id} onValueChange={(v) => setForm((f) => ({ ...f, project_id: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {projects.data?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Narrative */}
        <section className="space-y-4">
          {([
            ["hypothesis", "Hypothesis", "If… then… because…"],
            ["methods", "Methods", "Procedure, equipment, conditions"],
            ["results", "Results", "Observed outcomes and trends"],
            ["conclusion", "Conclusion", "What this means; next steps"],
          ] as const).map(([key, label, ph]) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{label}</Label>
              <Textarea
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={ph}
                rows={key === "methods" || key === "results" ? 4 : 3}
                className="bg-card"
              />
            </div>
          ))}
        </section>

        {/* Measurements */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Measurements</h3>
            <button onClick={addMeasurement} className="text-xs font-bold text-primary flex items-center gap-1">
              <Plus className="size-3" /> Row
            </button>
          </div>
          {form.measurements.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No measurements recorded</p>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr_0.6fr_auto] gap-2 px-3 py-2 bg-muted/50 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <span>Label</span><span>Value</span><span>Unit</span><span></span>
              </div>
              {form.measurements.map((m, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_0.6fr_auto] gap-2 p-2 border-t border-border items-center">
                  <Input value={m.label} onChange={(e) => updateMeasurement(i, { label: e.target.value })} placeholder="Temp" className="font-mono text-xs h-8" />
                  <Input value={m.value} onChange={(e) => updateMeasurement(i, { value: e.target.value })} placeholder="273.15" className="font-mono text-xs h-8" />
                  <Input value={m.unit ?? ""} onChange={(e) => updateMeasurement(i, { unit: e.target.value })} placeholder="K" className="font-mono text-xs h-8" />
                  <button onClick={() => removeMeasurement(i)} className="p-1 text-muted-foreground hover:text-destructive">
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Tags */}
        <section className="space-y-2">
          <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Tags</h3>
          <div className="flex flex-wrap gap-1.5 items-center">
            {form.tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 text-[10px] font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                #{t}
                <button onClick={() => removeTag(t)} className="hover:text-destructive"><X className="size-2.5" /></button>
              </span>
            ))}
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              onBlur={addTag}
              placeholder="add tag…"
              className="w-28 h-7 text-xs"
            />
          </div>
        </section>

        <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full">
          <Save className="size-4 mr-2" />
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
      </main>

      <BottomNav onNew={() => setNewEntry(true)} />
      <NewEntryDialog open={newEntry} onOpenChange={setNewEntry} />
    </div>
  );
}