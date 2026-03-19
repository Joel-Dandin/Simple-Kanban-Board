"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutGrid, 
  Timer, 
  Clock, 
  Calendar, 
  BarChart3, 
  Settings,
  Moon,
  Sun
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

const navItems = [
  { href: "/kanban", label: "Kanban", icon: LayoutGrid },
  { href: "/timer", label: "Timer", icon: Timer },
  { href: "/time", label: "Time", icon: Clock },
  { href: "/plan", label: "Plan", icon: Calendar },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { isLoading } = useAppStore();

  React.useEffect(() => {
    useAppStore.getState().loadAll();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <aside className="flex w-56 flex-col border-r bg-card">
        <div className="flex h-14 items-center border-b px-4">
          <h1 className="text-lg font-semibold">Kanban Board</h1>
        </div>
        
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? (
              <>
                <Sun className="h-4 w-4" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" />
                Dark Mode
              </>
            )}
          </Button>
        </div>
      </aside>
      
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}
