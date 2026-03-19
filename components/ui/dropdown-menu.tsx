"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | undefined>(undefined);

function useDropdownMenuContext() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("DropdownMenu components must be used within a DropdownMenu");
  }
  return context;
}

function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

function DropdownMenuTrigger({ children, asChild }: { children: React.ReactNode } & { asChild?: boolean }) {
  const { setOpen, open } = useDropdownMenuContext();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(!open),
    });
  }

  return (
    <button type="button" onClick={() => setOpen(!open)}>
      {children}
    </button>
  );
}

function DropdownMenuContent({ children, className, align = "start" }: React.ComponentProps<"div"> & { align?: "start" | "center" | "end" }) {
  const { open, setOpen } = useDropdownMenuContext();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
        align === "end" && "right-0",
        className
      )}
    >
      {children}
    </div>
  );
}

function DropdownMenuItem({ children, className, destructive, onSelect }: React.ComponentProps<"div"> & { destructive?: boolean; onSelect?: () => void }) {
  const { setOpen } = useDropdownMenuContext();

  return (
    <div
      role="menuitem"
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground",
        destructive ? "text-destructive focus:bg-destructive/10" : "",
        className
      )}
      onClick={() => {
        onSelect?.();
        setOpen(false);
      }}
    >
      {children}
    </div>
  );
}

function DropdownMenuSeparator({ className }: React.ComponentProps<"div">) {
  return <div className={cn("-mx-1 my-1 h-px bg-border", className)} />;
}

function DropdownMenuLabel({ children, className }: React.ComponentProps<"div">) {
  return (
    <div className={cn("px-2 py-1.5 text-sm font-semibold", className)}>
      {children}
    </div>
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
};
