"use client";

import * as React from "react";
import { format, addDays, startOfWeek, addWeeks, subWeeks, eachDayOfInterval } from "date-fns";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const PIXELS_PER_MINUTE = 1;

interface PositionedItem<T> {
  item: T;
  top: number;
  height: number;
  column: number;
}

export function TimeGrid() {
  const { tasks, timeEntries, plans, settings, loadTimeEntries, loadPlans } = useAppStore();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [viewDays, setViewDays] = React.useState(7);

  const workStartHour = settings.workStartHour;
  const workEndHour = settings.workEndHour;
  const totalHours = Math.ceil(workEndHour) - Math.floor(workStartHour);
  const hourHeight = 60;
  const totalHeight = totalHours * hourHeight;

  React.useEffect(() => {
    loadTimeEntries();
    loadPlans();
  }, [loadTimeEntries, loadPlans]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, viewDays - 1) });
  const hours = React.useMemo(() => {
    const result = [];
    for (let h = Math.floor(workStartHour); h < Math.ceil(workEndHour); h++) {
      result.push(h);
    }
    return result;
  }, [workStartHour, workEndHour]);

  const getEntriesForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return timeEntries.filter((e) => e.date === dateStr);
  };

  const getPlansForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return plans.filter((p) => p.date === dateStr);
  };

  const getTaskById = (taskId: number) => tasks.find((t) => t.id === taskId);

  const calculatePosition = (startTime: string, duration: number) => {
    if (!startTime) return { top: 0, height: 20 };
    const [h, m] = startTime.split(":").map(Number);
    const startMinutes = h * 60 + m;
    const workStartMinutes = workStartHour * 60;
    const top = (startMinutes - workStartMinutes) * PIXELS_PER_MINUTE;
    const height = Math.max(duration * 60 * PIXELS_PER_MINUTE, 20);
    return { top, height };
  };

  const calculatePlanPosition = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return { top: 0, height: 60 };
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const workStartMinutes = workStartHour * 60;
    const top = startMinutes - workStartMinutes;
    const height = Math.max(endMinutes - startMinutes - 4, 20);
    return { top, height };
  };

  const calculateParallelPositions = <T extends { startTime: string; endTime?: string | null }>(
    items: T[],
    isPlan: boolean
  ): PositionedItem<T>[] => {
    if (items.length === 0) return [];

    const validItems = items.filter((item) => item.startTime && (isPlan ? item.endTime : true));
    if (validItems.length === 0) return [];

    const sorted = [...validItems].sort((a, b) => {
      const [aH, aM] = (a.startTime || "09:00").split(":").map(Number);
      const [bH, bM] = (b.startTime || "09:00").split(":").map(Number);
      return aH * 60 + aM - (bH * 60 + bM);
    });

    const positions: PositionedItem<T>[] = [];
    const columns: { endMinutes: number }[] = [];

    for (const item of sorted) {
      const [startH, startM] = (item.startTime || "09:00").split(":").map(Number);
      const startMinutes = startH * 60 + startM;

      let column = 0;
      for (let i = 0; i < columns.length; i++) {
        if (columns[i].endMinutes <= startMinutes) {
          column = i;
          break;
        }
        column = i + 1;
      }

      const endTime = isPlan
        ? item.endTime
        : (() => {
            const [h, m] = (item.startTime || "09:00").split(":").map(Number);
            const durationHours = item as unknown as { duration?: number };
            return `${h + Math.floor(durationHours.duration || 0)}:${m}`;
          })();

      const [endH, endM] = (endTime || "17:00").split(":").map(Number);
      const endMinutes = endH * 60 + endM;

      if (columns[column]) {
        columns[column] = { endMinutes };
      } else {
        columns.push({ endMinutes });
      }

      const workStartMinutes = workStartHour * 60;
      const top = startMinutes - workStartMinutes;
      const height = endMinutes - startMinutes;

      positions.push({ item, top, height, column });
    }

    return positions;
  };

  const formatDuration = (hrs: number) => {
    const h = Math.floor(hrs);
    const m = Math.round((hrs - h) * 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const getTotalForDay = (day: Date) => {
    const entries = getEntriesForDay(day);
    return entries.reduce((sum, entry) => sum + entry.duration, 0);
  };

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentDate((d) => addWeeks(d, direction === "next" ? 1 : -1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const totalHoursTracked = days.reduce((sum, d) => sum + getTotalForDay(d), 0);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h2 className="text-xl font-semibold">Time Grid</h2>
          <p className="text-sm text-muted-foreground">
            Total: {formatDuration(totalHoursTracked)} | {workStartHour}:00 - {workEndHour}:00
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={viewDays.toString()} onValueChange={(v) => setViewDays(parseInt(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 Days</SelectItem>
              <SelectItem value="5">5 Days</SelectItem>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="14">14 Days</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={() => navigateWeek("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateWeek("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="min-w-[800px]">
          <div className="flex border-b bg-muted/30 sticky top-0 z-10">
            <div className="w-16 flex-shrink-0 p-2 text-xs font-medium text-muted-foreground border-r">
              <Clock className="h-3 w-3 inline mr-1" />
              Time
            </div>
            {days.map((day) => {
              const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
              const dayTotal = getTotalForDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex-1 p-2 text-center border-r last:border-r-0 min-w-[120px]",
                    isToday && "bg-primary/10"
                  )}
                >
                  <div className="text-xs text-muted-foreground">{format(day, "EEE")}</div>
                  <div className={cn("text-sm font-medium", isToday && "text-primary")}>
                    {format(day, "d")}
                  </div>
                  {dayTotal > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {formatDuration(dayTotal)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex">
            <div className="w-16 flex-shrink-0 border-r bg-muted/20">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="border-b text-xs text-muted-foreground p-1"
                  style={{ height: `${hourHeight}px` }}
                >
                  {hour}:00
                </div>
              ))}
            </div>

            {days.map((day) => {
              const dayPlans = getPlansForDay(day);
              const dayEntries = getEntriesForDay(day);

              const planPositions = calculateParallelPositions(dayPlans, true);
              const entryPositions = calculateParallelPositions(
                dayEntries.map((e) => ({ ...e, endTime: null })),
                false
              );

              const maxColumns = Math.max(
                planPositions.length > 0 ? Math.max(...planPositions.map((p) => p.column)) + 1 : 0,
                entryPositions.length > 0 ? Math.max(...entryPositions.map((p) => p.column)) + 1 : 0,
                1
              );

              return (
                <div
                  key={day.toISOString()}
                  className="flex-1 border-r last:border-r-0 relative min-w-[120px]"
                  style={{ height: `${totalHeight}px` }}
                >
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="border-b bg-background/50"
                      style={{
                        height: `${hourHeight}px`,
                        backgroundImage:
                          hour === Math.floor(workStartHour)
                            ? "linear-gradient(to bottom, transparent 50%, var(--muted) 50%)"
                            : undefined,
                      }}
                    />
                  ))}

                  {planPositions.map((pos, idx) => {
                    const task = getTaskById(pos.item.taskId);
                    const color = task?.color || "#888";
                    const columnWidth = 100 / maxColumns;
                    const left = pos.column * columnWidth;

                    return (
                      <div
                        key={`plan-${idx}`}
                        className="absolute rounded border-2 border-dashed px-1 py-0.5 text-xs overflow-hidden"
                        style={{
                          top: `${pos.top}px`,
                          height: `${pos.height}px`,
                          left: `${left}%`,
                          width: `${columnWidth - 2}%`,
                          backgroundColor: `${color}20`,
                          borderColor: color,
                        }}
                      >
                        <div
                          className="font-medium truncate"
                          style={{ color }}
                        >
                          {pos.item.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {pos.item.startTime} - {pos.item.endTime}
                        </div>
                      </div>
                    );
                  })}

                  {entryPositions.map((pos, idx) => {
                    const task = getTaskById(pos.item.taskId);
                    const color = task?.color || "#3b82f6";
                    const entryDuration = pos.item.duration || 0;
                    const columnWidth = 100 / maxColumns;
                    const left = pos.column * columnWidth;
                    const height = Math.max(entryDuration * 60 * PIXELS_PER_MINUTE, 20);

                    return (
                      <div
                        key={`entry-${idx}`}
                        className="absolute rounded px-1 py-0.5 text-xs text-white overflow-hidden z-10"
                        style={{
                          top: `${pos.top}px`,
                          height: `${height}px`,
                          left: `${left}%`,
                          width: `${columnWidth - 2}%`,
                          backgroundColor: color,
                        }}
                      >
                        <div className="font-medium truncate">{task?.title || "Unknown"}</div>
                        <div className="opacity-80 truncate text-[10px]">
                          {formatDuration(entryDuration)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {tasks.length > 0 && (
        <div className="border-t bg-card p-4">
          <h3 className="text-sm font-medium mb-2">Task Legend</h3>
          <div className="flex flex-wrap gap-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: task.color }}
                />
                <span>{task.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
