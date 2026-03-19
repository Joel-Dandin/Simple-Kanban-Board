import { create } from "zustand";
import type { Task, Plan, TimeEntry, Settings } from "./models";
import * as db from "./db";

interface AppState {
  tasks: Task[];
  plans: Plan[];
  timeEntries: TimeEntry[];
  settings: Settings;
  isLoading: boolean;

  loadTasks: () => Promise<void>;
  addTask: (task: Omit<Task, "id" | "createdAt">) => Promise<number>;
  updateTask: (id: number, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;

  loadPlans: () => Promise<void>;
  addPlan: (plan: Omit<Plan, "id" | "createdAt">) => Promise<number>;
  updatePlan: (id: number, updates: Partial<Plan>) => Promise<void>;
  deletePlan: (id: number) => Promise<void>;

  loadTimeEntries: () => Promise<void>;
  addTimeEntry: (entry: Omit<TimeEntry, "id">) => Promise<number>;
  updateTimeEntry: (id: number, updates: Partial<TimeEntry>) => Promise<void>;
  deleteTimeEntry: (id: number) => Promise<void>;

  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;

  loadAll: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  tasks: [],
  plans: [],
  timeEntries: [],
  settings: {
    darkMode: false,
    hoursPerDay: 8.5,
    workStartHour: 9,
    workEndHour: 17.5,
  },
  isLoading: true,

  loadTasks: async () => {
    const tasks = await db.getAllTasks();
    set({ tasks });
  },

  addTask: async (taskData) => {
    const task = {
      ...taskData,
      createdAt: new Date().toISOString(),
    };
    const id = await db.createTask(task);
    await get().loadTasks();
    return id;
  },

  updateTask: async (id, updates) => {
    await db.updateTask(id, updates);
    await get().loadTasks();
  },

  deleteTask: async (id) => {
    await db.deleteTask(id);
    await get().loadTasks();
  },

  loadPlans: async () => {
    const plans = await db.getAllPlans();
    set({ plans });
  },

  addPlan: async (planData) => {
    const plan = {
      ...planData,
      createdAt: new Date().toISOString(),
    };
    const id = await db.createPlan(plan);
    await get().loadPlans();
    return id;
  },

  updatePlan: async (id, updates) => {
    await db.updatePlan(id, updates);
    await get().loadPlans();
  },

  deletePlan: async (id) => {
    await db.deletePlan(id);
    await get().loadPlans();
  },

  loadTimeEntries: async () => {
    const timeEntries = await db.getAllTimeEntries();
    set({ timeEntries });
  },

  addTimeEntry: async (entryData) => {
    const id = await db.createTimeEntry(entryData);
    await get().loadTimeEntries();
    return id;
  },

  updateTimeEntry: async (id, updates) => {
    await db.updateTimeEntry(id, updates);
    await get().loadTimeEntries();
  },

  deleteTimeEntry: async (id) => {
    await db.deleteTimeEntry(id);
    await get().loadTimeEntries();
  },

  loadSettings: async () => {
    const settings = await db.getSettings();
    set({ settings });
  },

  updateSettings: async (newSettings) => {
    for (const [key, value] of Object.entries(newSettings)) {
      await db.setSetting(key, String(value));
    }
    await get().loadSettings();
  },

  loadAll: async () => {
    set({ isLoading: true });
    try {
      await db.getDb();
      await Promise.all([
        get().loadTasks(),
        get().loadPlans(),
        get().loadTimeEntries(),
        get().loadSettings(),
      ]);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
