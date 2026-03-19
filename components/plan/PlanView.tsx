"use client";

import * as React from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface NewPlan {
  taskId: number | null;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
}

export function PlanView() {
  const { tasks, plans, loadPlans, addPlan, deletePlan } = useAppStore();
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [newPlan, setNewPlan] = React.useState<NewPlan>({
    taskId: null,
    name: "",
    date: "",
    startTime: "09:00",
    endTime: "10:00",
  });

  React.useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getPlansForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return plans.filter((p) => p.date === dateStr);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setNewPlan({
      taskId: null,
      name: "",
      date: format(date, "yyyy-MM-dd"),
      startTime: "09:00",
      endTime: "10:00",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.name.trim() || !newPlan.date) return;

    await addPlan({
      taskId: newPlan.taskId || 0,
      name: newPlan.name.trim(),
      date: newPlan.date,
      startTime: newPlan.startTime,
      endTime: newPlan.endTime,
    });

    setDialogOpen(false);
  };

  const handleDeletePlan = async (planId: number) => {
    await deletePlan(planId);
  };

  const getTaskById = (taskId: number) => tasks.find((t) => t.id === taskId);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-xl font-semibold">Plan</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center font-medium">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="mb-4 grid grid-cols-7 gap-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dayPlans = getPlansForDate(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[100px] rounded-lg border p-2 transition-colors hover:bg-accent/50",
                  !isCurrentMonth && "opacity-40",
                  isToday && "ring-2 ring-primary"
                )}
                onClick={() => handleDayClick(day)}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-sm",
                      isToday && "bg-primary text-primary-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <Button variant="ghost" size="icon-xs" className="opacity-0 group-hover:opacity-100">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {dayPlans.slice(0, 2).map((plan) => {
                    const task = getTaskById(plan.taskId);
                    return (
                      <div
                        key={plan.id}
                        className="truncate rounded bg-muted px-1 py-0.5 text-xs"
                        style={{
                          borderLeft: `2px solid ${task?.color || "#888"}`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {plan.name}
                      </div>
                    );
                  })}
                  {dayPlans.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayPlans.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              New Plan for {selectedDate && format(selectedDate, "MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Task (optional)</Label>
                <Select
                  value={newPlan.taskId?.toString() || ""}
                  onValueChange={(v) => setNewPlan({ ...newPlan, taskId: v ? parseInt(v) : null })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a task..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id!.toString()}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: task.color }}
                          />
                          {task.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="planName">Plan Name</Label>
                <Input
                  id="planName"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  placeholder="e.g. Team Meeting"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newPlan.startTime}
                    onChange={(e) => setNewPlan({ ...newPlan, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newPlan.endTime}
                    onChange={(e) => setNewPlan({ ...newPlan, endTime: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newPlan.name.trim()}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
