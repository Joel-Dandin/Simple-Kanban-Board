export interface Task {
  id?: number;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  color: string;
  estimatedHours?: number;
  createdAt: string;
}

export interface Plan {
  id?: number;
  taskId: number;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface TimeEntry {
  id?: number;
  taskId: number;
  date: string;
  startTime: string;
  endTime: string | null;
  duration: number;
}

export interface Settings {
  darkMode: boolean;
  hoursPerDay: number;
  workStartHour: number;
  workEndHour: number;
}

export const TASK_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export type TaskStatus = "todo" | "in_progress" | "done";
