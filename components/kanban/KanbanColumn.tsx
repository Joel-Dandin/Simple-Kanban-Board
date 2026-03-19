"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/lib/models";

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  children: React.ReactNode;
}

export function KanbanColumn({ id, title, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 flex-col rounded-lg bg-muted/50",
        isOver && "bg-muted ring-2 ring-primary"
      )}
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{title}</h3>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/20 text-xs font-medium text-muted-foreground">
            {React.Children.count(children)}
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {children}
      </div>
    </div>
  );
}
