"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "./button";

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined);

function useDialogContext() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be used within a Dialog");
  }
  return context;
}

function Dialog({ children, open, onOpenChange }: { children: React.ReactNode } & (
  | { open?: boolean; onOpenChange?: (open: boolean) => void }
)) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  return (
    <DialogContext.Provider value={{ open: currentOpen, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

function DialogTrigger({ children, asChild, onClick, ...props }: { children: React.ReactNode } & React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { setOpen } = useDialogContext();
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
    }
    setOpen(true);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: React.MouseEventHandler<HTMLButtonElement> }>, {
      onClick: handleClick,
    });
  }

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

function DialogContent({ children, className, showCloseButton = true }: React.ComponentProps<"div"> & { showCloseButton?: boolean }) {
  const { open, setOpen } = useDialogContext();
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/80"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          ref={contentRef}
          role="dialog"
          aria-modal="true"
          className={cn(
            "relative w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg",
            "animate-in fade-in-0 zoom-in-95 duration-200",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {showCloseButton && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-title"
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
