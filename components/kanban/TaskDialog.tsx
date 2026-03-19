"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import { TASK_COLORS, type Task, type TaskStatus } from "@/lib/models";
import { cn } from "@/lib/utils";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
}

export function TaskDialog({ open, onOpenChange, task }: TaskDialogProps) {
  const { addTask, updateTask } = useAppStore();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [color, setColor] = React.useState(TASK_COLORS[0]);
  const [estimatedHours, setEstimatedHours] = React.useState("");
  const [status, setStatus] = React.useState<TaskStatus>("todo");

  React.useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setColor(task.color);
      setEstimatedHours(task.estimatedHours?.toString() || "");
      setStatus(task.status);
    } else {
      setTitle("");
      setDescription("");
      setColor(TASK_COLORS[0]);
      setEstimatedHours("");
      setStatus("todo");
    }
  }, [task, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      color,
      status,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
    };

    if (task?.id) {
      await updateTask(task.id, taskData);
    } else {
      await addTask(taskData);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {task ? "Edit Task" : "New Task"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Task description (optional)"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {TASK_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                      color === c ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                step="0.5"
                min="0"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="e.g. 4"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <div className="flex gap-2">
                {(["todo", "in_progress", "done"] as TaskStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm transition-colors",
                      status === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input hover:bg-accent"
                    )}
                    onClick={() => setStatus(s)}
                  >
                    {s === "todo" ? "To Do" : s === "in_progress" ? "In Progress" : "Done"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {task ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
