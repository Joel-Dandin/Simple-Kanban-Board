"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const PopoverContext = React.createContext<PopoverContextValue | undefined>(undefined);

function usePopoverContext() {
  const context = React.useContext(PopoverContext);
  if (!context) {
    throw new Error("Popover components must be used within a Popover");
  }
  return context;
}

function Popover({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      {children}
    </PopoverContext.Provider>
  );
}

function PopoverTrigger({ children, asChild }: { children: React.ReactNode } & { asChild?: boolean }) {
  const { setOpen, open } = usePopoverContext();

  const handleClick = () => setOpen(!open);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(!open),
    });
  }

  return (
    <button type="button" onClick={handleClick}>
      {children}
    </button>
  );
}

function PopoverContent({ children, className, align = "center" }: React.ComponentProps<"div"> & { align?: "start" | "center" | "end" }) {
  const { open, setOpen } = usePopoverContext();
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
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95",
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "end" && "right-0",
        className
      )}
    >
      {children}
    </div>
  );
}

export { Popover, PopoverTrigger, PopoverContent };
