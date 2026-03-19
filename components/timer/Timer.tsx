"use client";

import * as React from "react";
import { format } from "date-fns";
import { Play, Square, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import * as db from "@/lib/db";
import { cn } from "@/lib/utils";

interface ActiveTimer {
  taskId: number;
  startTime: string;
  entryId: number;
}

export function Timer() {
  const { tasks, timeEntries, settings, loadTimeEntries } = useAppStore();
  const [selectedTaskId, setSelectedTaskId] = React.useState<string>("");
  const [activeTimer, setActiveTimer] = React.useState<ActiveTimer | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const activeTasks = tasks.filter((t) => t.status !== "done");

  React.useEffect(() => {
    const saved = localStorage.getItem("activeTimer");
    if (saved) {
      const timer = JSON.parse(saved) as ActiveTimer;
      const startTime = new Date(timer.startTime).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setActiveTimer(timer);
      setElapsedSeconds(elapsed);
      setSelectedTaskId(timer.taskId.toString());
    }
  }, []);

  React.useEffect(() => {
    if (activeTimer) {
      intervalRef.current = setInterval(() => {
        const startTime = new Date(activeTimer.startTime).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeTimer]);

  const isWithinWorkHours = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    return (
      dayOfWeek >= 1 &&
      dayOfWeek <= 5 &&
      currentHour >= settings.workStartHour &&
      currentHour <= settings.workEndHour
    );
  };

  const handleStart = async () => {
    if (!selectedTaskId) return;
    if (!isWithinWorkHours()) {
      alert("Timer can only run during work hours (Mon-Fri, configured hours)");
      return;
    }

    const now = new Date();
    const entry = await db.createTimeEntry({
      taskId: parseInt(selectedTaskId),
      date: format(now, "yyyy-MM-dd"),
      startTime: format(now, "HH:mm:ss"),
      endTime: null,
      duration: 0,
    });

    const timer: ActiveTimer = {
      taskId: parseInt(selectedTaskId),
      startTime: now.toISOString(),
      entryId: entry,
    };

    setActiveTimer(timer);
    localStorage.setItem("activeTimer", JSON.stringify(timer));
  };

  const handleStop = async () => {
    if (!activeTimer) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const now = new Date();
    const startTime = new Date(activeTimer.startTime);
    const durationHours = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    await db.updateTimeEntry(activeTimer.entryId, {
      endTime: format(now, "HH:mm:ss"),
      duration: durationHours,
    });

    setActiveTimer(null);
    setElapsedSeconds(0);
    localStorage.removeItem("activeTimer");
    await loadTimeEntries();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const selectedTask = tasks.find((t) => t.id === parseInt(selectedTaskId));

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h2 className="text-xl font-semibold">Timer</h2>
      </div>
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Clock className="h-5 w-5" />
              Time Tracker
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className={cn(
                "text-6xl font-mono font-bold",
                activeTimer ? "text-primary" : "text-muted-foreground"
              )}>
                {formatTime(elapsedSeconds)}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Task</label>
              <Select
                value={selectedTaskId}
                onValueChange={setSelectedTaskId}
                defaultValue=""
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a task..." />
                </SelectTrigger>
                <SelectContent>
                  {activeTasks.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No active tasks
                    </SelectItem>
                  ) : (
                    activeTasks.map((task) => (
                      <SelectItem key={task.id} value={task.id!.toString()}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: task.color }}
                          />
                          {task.title}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedTask && (
              <div className="rounded-md bg-muted p-3">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: selectedTask.color }}
                  />
                  <span className="font-medium">{selectedTask.title}</span>
                </div>
                {selectedTask.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedTask.description}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-center gap-4">
              {!activeTimer ? (
                <Button
                  size="lg"
                  onClick={handleStart}
                  disabled={!selectedTaskId || !isWithinWorkHours()}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Start
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={handleStop}
                >
                  <Square className="mr-2 h-5 w-5" />
                  Stop
                </Button>
              )}
            </div>

            {!isWithinWorkHours() && (
              <p className="text-center text-sm text-muted-foreground">
                Timer is only available during work hours (Mon-Fri, {settings.workStartHour}:00 - {settings.workEndHour}:00)
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
