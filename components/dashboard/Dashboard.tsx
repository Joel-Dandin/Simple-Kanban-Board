"use client";

import * as React from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import * as db from "@/lib/db";

export function Dashboard() {
  const { tasks, timeEntries, plans, loadTimeEntries, loadPlans } = useAppStore();
  const [weeklyData, setWeeklyData] = React.useState<{ day: string; hours: number }[]>([]);

  React.useEffect(() => {
    loadTimeEntries();
    loadPlans();
  }, [loadTimeEntries, loadPlans]);

  React.useEffect(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const data = days.map((day, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayEntries = timeEntries.filter((e) => e.date === dateStr);
      const totalHours = dayEntries.reduce((sum, e) => sum + e.duration, 0);
      return { day, hours: totalHours };
    });
    setWeeklyData(data);
  }, [timeEntries]);

  const totalTasks = tasks.length;
  const todoTasks = tasks.filter((t) => t.status === "todo").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const todayStr = format(now, "yyyy-MM-dd");

  const todayEntries = timeEntries.filter((e) => e.date === todayStr);
  const todayTime = todayEntries.reduce((sum, e) => sum + e.duration, 0);

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekEntries = timeEntries.filter((e) => {
    const entryDate = new Date(e.date);
    return isWithinInterval(entryDate, { start: weekStart, end: weekEnd });
  });
  const weekTime = weekEntries.reduce((sum, e) => sum + e.duration, 0);

  const monthEntries = timeEntries.filter((e) => {
    const entryDate = new Date(e.date);
    return isWithinInterval(entryDate, { start: monthStart, end: monthEnd });
  });
  const monthTime = monthEntries.reduce((sum, e) => sum + e.duration, 0);

  const totalTime = timeEntries.reduce((sum, e) => sum + e.duration, 0);
  const completionRate = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;

  const maxWeeklyHours = Math.max(...weeklyData.map((d) => d.hours), 1);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h2 className="text-xl font-semibold">Dashboard</h2>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                {todoTasks} todo, {inProgressTasks} in progress, {doneTasks} done
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{todayTime.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">
                {todayEntries.length} entries
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{weekTime.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">
                {weekEntries.length} entries
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{plans.length}</div>
              <p className="text-xs text-muted-foreground">
                {plans.filter((p) => p.date === todayStr).length} today
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Time Tracked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2 h-40">
                {weeklyData.map((d) => (
                  <div key={d.day} className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-full flex flex-col items-center justify-end h-32">
                      <div
                        className="w-full rounded-t-md bg-primary transition-all"
                        style={{ height: `${(d.hours / maxWeeklyHours) * 100}%` }}
                      />
                      <span className="text-xs text-muted-foreground mt-1">
                        {d.hours.toFixed(1)}h
                      </span>
                    </div>
                    <span className="text-xs font-medium">{d.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>To Do</span>
                    <span className="text-muted-foreground">{todoTasks} ({totalTasks > 0 ? ((todoTasks / totalTasks) * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${totalTasks > 0 ? (todoTasks / totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>In Progress</span>
                    <span className="text-muted-foreground">{inProgressTasks} ({totalTasks > 0 ? ((inProgressTasks / totalTasks) * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-yellow-500"
                      style={{ width: `${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Done</span>
                    <span className="text-muted-foreground">{doneTasks} ({totalTasks > 0 ? ((doneTasks / totalTasks) * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Time This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monthTime.toFixed(1)}h</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTime.toFixed(1)}h</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionRate.toFixed(0)}%</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
