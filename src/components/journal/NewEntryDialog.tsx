import { useEffect, useState } from "react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchProjects, createEntry } from "@/lib/journal";
import { toast } from "sonner";

// FUTURE-PROOF:
// - No longer calls Supabase — uses offline journal.ts (localStorage + Jacky sync)
// - createEntry() syncs to Jacky SQLite episodic log when Jacky is running
// - Same UI — zero visual changes (anti-chaos rule)
// - Auto-compresses entry content via Jacky when available

const schema = z.object({
  title: z.string().trim().min(1, "Title required").max(200),
  project_id: z.string().uuid().nullable(),
  status: z.enum(["routine", "anomaly", "milestone", "draft"]),
  hypothesis: z.string().trim().max(2000).optional(),
  methods: z.string().trim().max(4000).optional(),
  tags: z.string().trim().max(300).optional(),
});

export function NewEntryDialog({
  open, onOpenChange, defaultProjectId,
}: { open: boolean; onOpenChange: (v: boolean) => void; defaultProjectId?: string }) {
  const qc = useQueryClient();
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: fetchProjects, enabled: open });
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState<string>(defaultProjectId ?? "none");
  const [status, setStatus] = useState<"routine" | "anomaly" | "milestone" | "draft">("routine");
  const [hypothesis, setHypothesis] = useState("");
  const [methods, setMethods] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(""); setProjectId(defaultProjectId ?? "none"); setStatus("routine");
      setHypothesis(""); setMethods(""); setTags("");
    }
  }, [open, defaultProjectId]);

  const mut = useMutation({
    mutationFn: async () => {
      const parsed = schema.parse({
        title,
        project_id: projectId === "none" ? null : projectId,
        status, hypothesis, methods, tags,
      });
      const tagArr = parsed.tags
        ? parsed.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      // Offline-first: saves to localStorage, syncs to Jacky SQLite if running
      const entry = await createEntry({
        title: parsed.title,
        project_id: parsed.project_id,
        status: parsed.status,
        content: [
          parsed.hypothesis ? `Hypothesis: ${parsed.hypothesis}` : "",
          parsed.methods ? `Methods: ${parsed.methods}` : "",
        ].filter(Boolean).join("\n\n") || null,
        tags: tagArr,
        entry_date: new Date().toISOString().split("T")[0],
        measurements: null,
        user_id: "local",
      });
      return entry;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entries"] });
      onOpenChange(false);
      toast.success("Entry logged to episodic memory");
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to create entry");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mut.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Journal Entry</DialogTitle>
          <DialogDescription>
            Log an observation, anomaly, or milestone. Saved offline · syncs to Jacky.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="entry-title">Title</Label>
            <Input id="entry-title" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Entry title..." required />
          </div>
          <div className="space-y-1.5">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue placeholder="No project" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={v => setStatus(v as typeof status)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="routine">Routine Log</SelectItem>
                <SelectItem value="anomaly">Anomaly Detected</SelectItem>
                <SelectItem value="milestone">Milestone</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hypothesis">Hypothesis / Observation</Label>
            <Textarea id="hypothesis" value={hypothesis} onChange={e => setHypothesis(e.target.value)}
              placeholder="What did you observe or hypothesize?" rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="methods">Methods / Notes</Label>
            <Textarea id="methods" value={methods} onChange={e => setMethods(e.target.value)}
              placeholder="How was this measured or observed?" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input id="tags" value={tags} onChange={e => setTags(e.target.value)}
              placeholder="e.g. ai, memory, calibration" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending ? "Logging..." : "Log Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
