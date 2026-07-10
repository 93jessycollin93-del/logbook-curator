import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/journal/AppHeader";
import { BottomNav } from "@/components/journal/BottomNav";
import { NewEntryDialog } from "@/components/journal/NewEntryDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Research Journal" }] }),
  component: Settings,
});

function Settings() {
  const [newEntry, setNewEntry] = useState(false);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    setDisplayName(localStorage.getItem("logbook:displayName") ?? "");
  }, []);

  function save() {
    localStorage.setItem("logbook:displayName", displayName.trim().slice(0, 80));
    toast.success("Profile saved");
  }

  function clearAll() {
    if (!confirm("Delete ALL projects and entries stored in this browser? This cannot be undone.")) return;
    localStorage.removeItem("logbook:projects");
    localStorage.removeItem("logbook:entries");
    toast.success("All journal data cleared");
    setTimeout(() => location.reload(), 400);
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader eyebrow="Research Journal" title="Settings" />
      <main className="p-5 space-y-6">
        <section className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Profile</h2>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider">Display name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Dr. E. Vance" />
          </div>
          <Button onClick={save} className="w-full">Save profile</Button>
        </section>

        <section className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Local data</h2>
          <p className="text-xs text-muted-foreground">
            All journal data is stored in this browser only. Clear your browser cache and it will be lost — use the archive to export important data.
          </p>
          <Button onClick={clearAll} variant="outline" className="w-full text-destructive border-destructive/40 hover:bg-destructive/5">
            Clear all local data
          </Button>
        </section>
      </main>
      <BottomNav onNew={() => setNewEntry(true)} />
      <NewEntryDialog open={newEntry} onOpenChange={setNewEntry} />
    </div>
  );
}
