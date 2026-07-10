import { useEffect, useState } from "react";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROJECT_COLORS, createProject } from "@/lib/journal";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(60),
  description: z.string().trim().max(500).optional(),
  phase: z.string().trim().max(40).optional(),
  status: z.enum(["active", "stable", "review", "archived"]),
  color: z.string(),
  progress: z.number().min(0).max(100),
});

const CATEGORY_SUGGESTIONS = ["Chemistry", "Biology", "Physics", "Genetics", "Nanotech", "Neuroscience", "Ecology", "Materials", "General"];

export function NewProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState("PHASE-01");
  const [status, setStatus] = useState<"active" | "stable" | "review" | "archived">("active");
  const [color, setColor] = useState("blue");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (open) {
      setName(""); setCategory("General"); setDescription(""); setPhase("PHASE-01");
      setStatus("active"); setColor("blue"); setProgress(0);
    }
  }, [open]);

  const mut = useMutation({
    mutationFn: async () => {
      const parsed = schema.parse({ name, category, description, phase, status, color, progress });
      return createProject({
        name: parsed.name,
        category: parsed.category,
        description: parsed.description || null,
        phase: parsed.phase || null,
        status: parsed.status,
        color: parsed.color,
        progress: parsed.progress,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created");
      onOpenChange(false);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New research project</DialogTitle>
          <DialogDescription className="font-mono text-[10px] uppercase tracking-wider">
            Group related entries under a hypothesis
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Protein folding kinetics" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_SUGGESTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="review">Peer review</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider">Phase</Label>
            <Input value={phase} onChange={(e) => setPhase(e.target.value)} placeholder="PHASE-01" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Goal, scope, key questions…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider">Color</Label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map((c) => (
                <button key={c.id} type="button" onClick={() => setColor(c.id)}
                  className={`size-8 rounded-lg ${c.swatch} ${color === c.id ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""}`}
                  aria-label={c.id} />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider">Progress ({progress}%)</Label>
            <input type="range" min={0} max={100} step={5} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>{mut.isPending ? "Saving…" : "Create project"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
