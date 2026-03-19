"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined);

function useSelectContext() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a Select");
  }
  return context;
}

function Select({ children, value, onValueChange, defaultValue }: {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  const [open, setOpen] = React.useState(false);
  
  const currentValue = value !== undefined ? value : internalValue;
  const handleValueChange = React.useCallback((newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
    setOpen(false);
  }, [value, onValueChange]);

  return (
    <SelectContext.Provider value={{ value: currentValue, onValueChange: handleValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

function SelectTrigger({ children, className, ...props }: React.ComponentProps<"button">) {
  const { value, open, setOpen } = useSelectContext();

  return (
    <button
      type="button"
      className={cn(
        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
      <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", open && "rotate-180")} />
    </button>
  );
}

function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useSelectContext();
  return <span>{value || placeholder}</span>;
}

function SelectContent({ children, className }: React.ComponentProps<"div">) {
  const { open, setOpen } = useSelectContext();

  React.useEffect(() => {
    const handleClickOutside = () => setOpen(false);
    if (open) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

function SelectItem({ value: itemValue, children, className, disabled }: React.ComponentProps<"div"> & { value: string; disabled?: boolean }) {
  const { value: selectedValue, onValueChange } = useSelectContext();
  const isSelected = selectedValue === itemValue;

  return (
    <div
      role="option"
      aria-selected={isSelected}
      aria-disabled={disabled}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
        isSelected && "bg-accent text-accent-foreground",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onClick={() => !disabled && onValueChange(itemValue)}
    >
      {children}
      {isSelected && <Check className="absolute right-2 h-4 w-4" />}
    </div>
  );
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
