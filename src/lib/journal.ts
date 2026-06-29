// journal.ts — ☽ Episodic Memory specialization
// REPLACED: Supabase cloud DB → offline localStorage store
// FUTURE-PROOF:
//   - Same function signatures as original — zero component changes needed
//   - Jacky sync: when VITE_JACKY_URL set, writes also go to Jacky SQLite
//   - Supabase reconnect: swap back by reverting this file only
//   - UUID-based IDs — compatible with Supabase schema
//   - localStorage keys namespaced: "logbook:projects", "logbook:entries"

const JACKY_URL = (import.meta as any).env?.VITE_JACKY_URL || null;

export type Project = {
  id: string; name: string; description: string | null; status: string;
  color: string; created_at: string; updated_at: string; user_id: string;
};
export type Entry = {
  id: string; project_id: string | null; title: string; content: string | null;
  entry_date: string; status: string; measurements: any; tags: string[] | null;
  created_at: string; updated_at: string; user_id: string;
};
export type Measurement = { label: string; value: string; unit?: string };

export const STATUS_LABELS: Record<string, string> = {
  routine: "Routine Log", anomaly: "Anomaly Detected",
  milestone: "Milestone", draft: "Draft",
};
export const PROJECT_STATUS_LABELS: Record<string, string> = {
  active: "PHASE-01", stable: "STABLE", archived: "ARCHIVED", review: "PEER REVIEW",
};
export const PROJECT_COLORS = [
  { id: "blue", swatch: "bg-primary", soft: "bg-primary/10" },
  { id: "emerald", swatch: "bg-stable", soft: "bg-stable/10" },
  { id: "amber", swatch: "bg-anomaly", soft: "bg-anomaly/10" },
  { id: "violet", swatch: "bg-[oklch(0.55_0.22_300)]", soft: "bg-[oklch(0.55_0.22_300)]/10" },
  { id: "rose", swatch: "bg-destructive", soft: "bg-destructive/10" },
];
export function colorClasses(color: string) {
  return PROJECT_COLORS.find(c => c.id === color) ?? PROJECT_COLORS[0];
}

// ─── localStorage store ────────────────────────────────────────────────────────

const PROJECTS_KEY = "logbook:projects";
const ENTRIES_KEY  = "logbook:entries";

function loadProjects(): Project[] {
  return JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]");
}
function saveProjects(p: Project[]) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(p));
}
function loadEntries(): Entry[] {
  return JSON.parse(localStorage.getItem(ENTRIES_KEY) || "[]");
}
function saveEntries(e: Entry[]) {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(e));
}
function now() { return new Date().toISOString(); }
function uid() { return crypto.randomUUID(); }

// ─── Jacky SQLite sync (fire-and-forget) ──────────────────────────────────────

async function syncToJacky(table: string, action: string, data: object) {
  if (!JACKY_URL) return;
  try {
    await fetch(`${JACKY_URL.replace("/api/ask", "")}/api/db/${table}/${action}`, {
      method: "POST", signal: AbortSignal.timeout(5000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch { /* Jacky offline — localStorage is source of truth */ }
}

// ─── Public API (same signatures as Supabase version) ─────────────────────────

export async function fetchProjects(): Promise<Project[]> {
  return loadProjects().sort((a,b) => b.updated_at.localeCompare(a.updated_at));
}

export async function fetchEntries(projectId?: string): Promise<Entry[]> {
  const all = loadEntries().sort((a,b) => b.entry_date.localeCompare(a.entry_date));
  return projectId ? all.filter(e => e.project_id === projectId) : all.slice(0, 100);
}

export async function fetchEntry(id: string): Promise<Entry | null> {
  return loadEntries().find(e => e.id === id) || null;
}

export async function fetchProject(id: string): Promise<Project | null> {
  return loadProjects().find(p => p.id === id) || null;
}

export async function createProject(data: Partial<Project>): Promise<Project> {
  const project: Project = {
    id: uid(), name: data.name || "New Project",
    description: data.description || null, status: data.status || "active",
    color: data.color || "blue", created_at: now(), updated_at: now(), user_id: "local",
  };
  const projects = loadProjects();
  projects.unshift(project);
  saveProjects(projects);
  syncToJacky("projects", "create", project);
  return project;
}

export async function updateProject(id: string, data: Partial<Project>): Promise<Project> {
  const projects = loadProjects();
  const idx = projects.findIndex(p => p.id === id);
  if (idx === -1) throw new Error("Project not found");
  projects[idx] = { ...projects[idx], ...data, updated_at: now() };
  saveProjects(projects);
  syncToJacky("projects", "update", projects[idx]);
  return projects[idx];
}

export async function deleteProject(id: string): Promise<void> {
  saveProjects(loadProjects().filter(p => p.id !== id));
  saveEntries(loadEntries().filter(e => e.project_id !== id));
  syncToJacky("projects", "delete", { id });
}

export async function createEntry(data: Partial<Entry>): Promise<Entry> {
  const entry: Entry = {
    id: uid(), project_id: data.project_id || null,
    title: data.title || "New Entry", content: data.content || null,
    entry_date: data.entry_date || now().split("T")[0],
    status: data.status || "routine", measurements: data.measurements || [],
    tags: data.tags || [], created_at: now(), updated_at: now(), user_id: "local",
  };
  const entries = loadEntries();
  entries.unshift(entry);
  saveEntries(entries);
  syncToJacky("entries", "create", entry);
  return entry;
}

export async function updateEntry(id: string, data: Partial<Entry>): Promise<Entry> {
  const entries = loadEntries();
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) throw new Error("Entry not found");
  entries[idx] = { ...entries[idx], ...data, updated_at: now() };
  saveEntries(entries);
  syncToJacky("entries", "update", entries[idx]);
  return entries[idx];
}

export async function deleteEntry(id: string): Promise<void> {
  saveEntries(loadEntries().filter(e => e.id !== id));
  syncToJacky("entries", "delete", { id });
}

// ─── Export all data (for V: archive or Jacky import) ─────────────────────────

export function exportAll() {
  return {
    projects: loadProjects(),
    entries: loadEntries(),
    exportedAt: now(),
    schema: "logbook-curator-v1",
  };
}
