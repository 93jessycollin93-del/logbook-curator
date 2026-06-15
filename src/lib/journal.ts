import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Entry = Database["public"]["Tables"]["entries"]["Row"];

export type Measurement = { label: string; value: string; unit?: string };

export const STATUS_LABELS: Record<string, string> = {
  routine: "Routine Log",
  anomaly: "Anomaly Detected",
  milestone: "Milestone",
  draft: "Draft",
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  active: "PHASE-01",
  stable: "STABLE",
  archived: "ARCHIVED",
  review: "PEER REVIEW",
};

export const PROJECT_COLORS = [
  { id: "blue", swatch: "bg-primary", soft: "bg-primary/10" },
  { id: "emerald", swatch: "bg-stable", soft: "bg-stable/10" },
  { id: "amber", swatch: "bg-anomaly", soft: "bg-anomaly/10" },
  { id: "violet", swatch: "bg-[oklch(0.55_0.22_300)]", soft: "bg-[oklch(0.55_0.22_300)]/10" },
  { id: "rose", swatch: "bg-destructive", soft: "bg-destructive/10" },
];

export function colorClasses(color: string) {
  return PROJECT_COLORS.find((c) => c.id === color) ?? PROJECT_COLORS[0];
}

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchEntries(projectId?: string): Promise<Entry[]> {
  let q = supabase.from("entries").select("*").order("entry_date", { ascending: false }).limit(100);
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function fetchEntry(id: string): Promise<Entry | null> {
  const { data, error } = await supabase.from("entries").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}