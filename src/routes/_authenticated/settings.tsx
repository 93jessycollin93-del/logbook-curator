import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { AppHeader } from "@/components/journal/AppHeader";
import { BottomNav } from "@/components/journal/BottomNav";
import { NewEntryDialog } from "@/components/journal/NewEntryDialog";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Hypothesis.Log" }] }),
  component: Settings,
});

function Settings() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [newEntry, setNewEntry] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setEmail(data.user.email ?? "");
      supabase.from("profiles").select("display_name").eq("id", data.user.id).maybeSingle()
        .then(({ data: p }) => setDisplayName(p?.display_name ?? ""));
    });
  }, []);

  async function save() {
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) return;
    const initials = displayName.slice(0, 2).toUpperCase();
    const { error } = await supabase.from("profiles").upsert({
      id: userRes.user.id, display_name: displayName.trim().slice(0, 80), initials,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader eyebrow="Hypothesis.Log" title="Settings" />
      <main className="p-5 space-y-6">
        <section className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Profile</h2>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider">Email</Label>
            <Input value={email} disabled />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider">Display name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Dr. E. Vance" />
          </div>
          <Button onClick={save} disabled={saving} className="w-full">{saving ? "Saving…" : "Save profile"}</Button>
        </section>

        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3">Session</h2>
          <Button onClick={signOut} variant="outline" className="w-full text-destructive border-destructive/40 hover:bg-destructive/5">
            <LogOut className="size-4 mr-2" /> Sign out
          </Button>
        </section>
      </main>
      <BottomNav onNew={() => setNewEntry(true)} />
      <NewEntryDialog open={newEntry} onOpenChange={setNewEntry} />
    </div>
  );
}