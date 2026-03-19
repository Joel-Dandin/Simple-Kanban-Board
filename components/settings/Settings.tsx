"use client";

import * as React from "react";
import { Moon, Sun, Download, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { useAppStore } from "@/lib/store";
import * as db from "@/lib/db";

export function Settings() {
  const { resolvedTheme, setTheme } = useTheme();
  const { settings, updateSettings } = useAppStore();
  const [hoursPerDay, setHoursPerDay] = React.useState(settings.hoursPerDay.toString());
  const [workStartHour, setWorkStartHour] = React.useState(settings.workStartHour.toString());
  const [workEndHour, setWorkEndHour] = React.useState(settings.workEndHour.toString());
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setHoursPerDay(settings.hoursPerDay.toString());
    setWorkStartHour(settings.workStartHour.toString());
    setWorkEndHour(settings.workEndHour.toString());
  }, [settings]);

  const handleSaveWorkHours = async () => {
    await updateSettings({
      hoursPerDay: parseFloat(hoursPerDay) || 8.5,
      workStartHour: parseFloat(workStartHour) || 9,
      workEndHour: parseFloat(workEndHour) || 17.5,
    });
  };

  const handleExport = async () => {
    const data = await db.exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kanban-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      await db.importData(text);
      window.location.reload();
    } catch (err) {
      alert("Failed to import data. Please check the file format.");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h2 className="text-xl font-semibold">Settings</h2>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred theme
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={resolvedTheme === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("light")}
                  >
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                  </Button>
                  <Button
                    variant={resolvedTheme === "dark" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("dark")}
                  >
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Work Hours</CardTitle>
              <CardDescription>
                Configure your work schedule for time tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="hoursPerDay">Hours per Day</Label>
                  <Input
                    id="hoursPerDay"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={hoursPerDay}
                    onChange={(e) => setHoursPerDay(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workStartHour">Work Start</Label>
                  <Input
                    id="workStartHour"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={workStartHour}
                    onChange={(e) => setWorkStartHour(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workEndHour">Work End</Label>
                  <Input
                    id="workEndHour"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={workEndHour}
                    onChange={(e) => setWorkEndHour(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleSaveWorkHours}>
                Save Work Hours
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Export or import your kanban board data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Data
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Importing data will replace all existing tasks, plans, and time entries.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
