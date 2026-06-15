import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  const [initials, setInitials] = useState("--");
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      setEmail(u.email ?? null);
      const name = (u.user_metadata?.display_name as string | undefined) ?? u.email ?? "";
      setInitials(name.slice(0, 2).toUpperCase());
    });
  }, []);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-5 py-4 flex items-center justify-between">
      <div className="min-w-0">
        <h1 className="text-[10px] font-mono font-medium uppercase tracking-[0.2em] text-primary">{eyebrow}</h1>
        <p className="text-lg font-bold tracking-tight truncate">{title}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="size-10 rounded-full bg-foreground flex items-center justify-center text-background text-xs font-bold shrink-0">
          {initials}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {email ?? "Researcher"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
            <LogOut className="size-4 mr-2" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}