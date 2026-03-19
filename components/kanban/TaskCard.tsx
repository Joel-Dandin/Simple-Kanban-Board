"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Clock, GripVertical } from "lucide-react";
import { useAppStore } from "@/lib/store";
import * as db from "@/lib/db";
import type { Task } from "@/lib/models";

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onEdit: () => void;
}

export function TaskCard({ task, isDragging, onEdit }: TaskCardProps) {
  const { deleteTask } = useAppStore();
  const [totalTime, setTotalTime] = React.useState(0);
  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    if (task.id) {
      db.getTotalTimeForTask(task.id).then(setTotalTime);
    }
  }, [task.id]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDelete = async () => {
    if (task.id) {
      await deleteTask(task.id);
    }
    setShowConfirmDelete(false);
  };

  const progress = task.estimatedHours
    ? Math.min((totalTime / task.estimatedHours) * 100, 100)
    : 0;
  const isOverEstimate = totalTime > (task.estimatedHours || 0);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border bg-card p-3 shadow-sm",
        (isDragging || isSortableDragging) && "opacity-50 ring-2 ring-primary"
      )}
    >
      <div className="mb-2 flex items-start gap-2">
        <button
          className="mt-0.5 cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: task.color }}
        />
        <h4 className="flex-1 font-medium leading-tight">{task.title}</h4>
      </div>

      {task.description && (
        <p className="mb-2 text-xs text-muted-foreground line-clamp-2">
          {task.description}
        </p>
      )}

      {task.estimatedHours && (
        <div className="mb-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{totalTime.toFixed(1)}h / {task.estimatedHours}h</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isOverEstimate ? "bg-destructive" : "bg-primary"
              )}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        {totalTime > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{totalTime.toFixed(1)}h</span>
          </div>
        )}
        <div className="ml-auto flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          {showConfirmDelete ? (
            <div className="flex gap-1">
              <Button
                variant="destructive"
                size="icon-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
              >
                Yes
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirmDelete(false);
                }}
              >
                No
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirmDelete(true);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
