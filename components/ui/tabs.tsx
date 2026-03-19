"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs");
  }
  return context;
}

function Tabs({ children, defaultValue, value, onValueChange }: {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  
  const currentValue = value !== undefined ? value : internalValue;
  const handleValueChange = React.useCallback((newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  }, [value, onValueChange]);

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={cn("flex flex-col gap-4")}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList({ children, className }: React.ComponentProps<"div">) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}

function TabsTrigger({ value: triggerValue, children, className }: React.ComponentProps<"button"> & { value: string }) {
  const { value, onValueChange } = useTabsContext();
  const isActive = value === triggerValue;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive && "bg-background text-foreground shadow",
        className
      )}
      onClick={() => onValueChange(triggerValue)}
    >
      {children}
    </button>
  );
}

function TabsContent({ value: contentValue, children, className }: React.ComponentProps<"div"> & { value: string }) {
  const { value } = useTabsContext();
  
  if (value !== contentValue) return null;

  return (
    <div
      role="tabpanel"
      data-state="active"
      className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
