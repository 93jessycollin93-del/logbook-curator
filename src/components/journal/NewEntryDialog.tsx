import { useEffect, useState } from "react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { fetchProjects } from "@/lib/journal";
import { toast } from "sonner";

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
        title, project_id: projectId === "none" ? null : projectId,
        status, hypothesis, methods, tags,
      });
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) throw new Error("Not signed in");
      const tagArr = parsed.tags ? parsed.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
      const { error, data } = await supabase.from("entries").insert({
        user_id: userRes.user.id,
        title: parsed.title,
        project_id: parsed.project_id,
        status: parsed.status,
        hypothesis: parsed.hypothesis || null,
        methods: parsed.methods || null,
        tags: tagArr,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Entry logged");
      onOpenChange(false);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New log entry</DialogTitle>
          <DialogDescription className="font-mono text-[10px] uppercase tracking-wider">
            Record an observation, anomaly, or milestone
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Variable drift in sample 09-B" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider">Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
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
            <Label className="text-xs font-mono uppercase tracking-wider">Hypothesis</Label>
            <Textarea value={hypothesis} onChange={(e) => setHypothesis(e.target.value)} placeholder="If… then… because…" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider">Methods / observations</Label>
            <Textarea value={methods} onChange={(e) => setMethods(e.target.value)} placeholder="Procedure, conditions, measurements" rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider">Tags (comma-separated)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="kinetics, pd-catalyst" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>{mut.isPending ? "Saving…" : "Log entry"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}