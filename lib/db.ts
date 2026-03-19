import Database from "@tauri-apps/plugin-sql";
import type { Task, Plan, TimeEntry, Settings } from "./models";

let db: Database | null = null;
let initPromise: Promise<Database> | null = null;

export async function getDb(): Promise<Database> {
  if (db) return db;
  
  if (initPromise) return initPromise;
  
  initPromise = Database.load("sqlite:kanban.db").then(async (database) => {
    db = database;
    await initializeTables();
    return db;
  });
  
  return initPromise;
}

async function initializeTables() {
  if (!db) return;

  const database = db;

  try {
    await database.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        status TEXT DEFAULT 'todo',
        color TEXT DEFAULT '#3b82f6',
        estimatedHours REAL,
        createdAt TEXT NOT NULL
      )
    `);
  } catch (e) {
    console.error("Failed to create tasks table:", e);
  }

  try {
    await database.execute(`
      CREATE TABLE IF NOT EXISTS plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        taskId INTEGER,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE SET NULL
      )
    `);
  } catch (e) {
    console.error("Failed to create plans table:", e);
  }

  try {
    await database.execute(`
      CREATE TABLE IF NOT EXISTS time_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        taskId INTEGER NOT NULL,
        date TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT,
        duration REAL DEFAULT 0,
        FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);
  } catch (e) {
    console.error("Failed to create time_entries table:", e);
  }

  try {
    await database.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
  } catch (e) {
    console.error("Failed to create settings table:", e);
  }

  await initializeDefaultSettings();
}

async function initializeDefaultSettings() {
  const database = db!;
  const defaults = [
    { key: "darkMode", value: "false" },
    { key: "hoursPerDay", value: "8.5" },
    { key: "workStartHour", value: "9" },
    { key: "workEndHour", value: "17.5" },
  ];

  for (const setting of defaults) {
    const existing = await database.select<{ key: string }[]>(
      "SELECT key FROM settings WHERE key = $1",
      [setting.key]
    );
    if (existing.length === 0) {
      await database.execute(
        "INSERT INTO settings (key, value) VALUES ($1, $2)",
        [setting.key, setting.value]
      );
    }
  }
}

export async function getAllTasks(): Promise<Task[]> {
  const database = await getDb();
  return database.select<Task[]>(
    "SELECT * FROM tasks ORDER BY createdAt DESC"
  );
}

export async function getTaskById(id: number): Promise<Task | null> {
  const database = await getDb();
  const results = await database.select<Task[]>(
    "SELECT * FROM tasks WHERE id = $1",
    [id]
  );
  return results[0] || null;
}

export async function createTask(task: Omit<Task, "id">): Promise<number> {
  const database = await getDb();
  const result = await database.execute(
    `INSERT INTO tasks (title, description, status, color, estimatedHours, createdAt)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      task.title,
      task.description,
      task.status,
      task.color,
      task.estimatedHours || null,
      task.createdAt,
    ]
  );
  return result.lastInsertId ?? 0;
}

export async function updateTask(
  id: number,
  updates: Partial<Task>
): Promise<void> {
  const database = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(updates.status);
  }
  if (updates.color !== undefined) {
    fields.push(`color = $${paramIndex++}`);
    values.push(updates.color);
  }
  if (updates.estimatedHours !== undefined) {
    fields.push(`estimatedHours = $${paramIndex++}`);
    values.push(updates.estimatedHours);
  }

  if (fields.length === 0) return;

  values.push(id);
  await database.execute(
    `UPDATE tasks SET ${fields.join(", ")} WHERE id = $${paramIndex}`,
    values
  );
}

export async function deleteTask(id: number): Promise<void> {
  const database = await getDb();
  await database.execute("DELETE FROM tasks WHERE id = $1", [id]);
}

export async function getAllPlans(): Promise<Plan[]> {
  const database = await getDb();
  return database.select<Plan[]>(
    "SELECT * FROM plans ORDER BY date ASC, startTime ASC"
  );
}

export async function getPlansForTask(taskId: number): Promise<Plan[]> {
  const database = await getDb();
  return database.select<Plan[]>(
    "SELECT * FROM plans WHERE taskId = $1 ORDER BY date ASC",
    [taskId]
  );
}

export async function getPlansForDate(date: string): Promise<Plan[]> {
  const database = await getDb();
  return database.select<Plan[]>(
    "SELECT * FROM plans WHERE date = $1 ORDER BY startTime ASC",
    [date]
  );
}

export async function getPlansInRange(
  startDate: string,
  endDate: string
): Promise<Plan[]> {
  const database = await getDb();
  return database.select<Plan[]>(
    "SELECT * FROM plans WHERE date >= $1 AND date <= $2 ORDER BY date ASC, startTime ASC",
    [startDate, endDate]
  );
}

export async function createPlan(plan: Omit<Plan, "id">): Promise<number> {
  const database = await getDb();
  const result = await database.execute(
    `INSERT INTO plans (taskId, name, date, startTime, endTime, createdAt)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [plan.taskId, plan.name, plan.date, plan.startTime, plan.endTime, plan.createdAt]
  );
  return result.lastInsertId ?? 0;
}

export async function updatePlan(
  id: number,
  updates: Partial<Plan>
): Promise<void> {
  const database = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.taskId !== undefined) {
    fields.push(`taskId = $${paramIndex++}`);
    values.push(updates.taskId);
  }
  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.date !== undefined) {
    fields.push(`date = $${paramIndex++}`);
    values.push(updates.date);
  }
  if (updates.startTime !== undefined) {
    fields.push(`startTime = $${paramIndex++}`);
    values.push(updates.startTime);
  }
  if (updates.endTime !== undefined) {
    fields.push(`endTime = $${paramIndex++}`);
    values.push(updates.endTime);
  }

  if (fields.length === 0) return;

  values.push(id);
  await database.execute(
    `UPDATE plans SET ${fields.join(", ")} WHERE id = $${paramIndex}`,
    values
  );
}

export async function deletePlan(id: number): Promise<void> {
  const database = await getDb();
  await database.execute("DELETE FROM plans WHERE id = $1", [id]);
}

export async function getTimeEntriesForTask(taskId: number): Promise<TimeEntry[]> {
  const database = await getDb();
  return database.select<TimeEntry[]>(
    "SELECT * FROM time_entries WHERE taskId = $1 ORDER BY date DESC, startTime DESC",
    [taskId]
  );
}

export async function getTimeEntriesForDate(date: string): Promise<TimeEntry[]> {
  const database = await getDb();
  return database.select<TimeEntry[]>(
    "SELECT * FROM time_entries WHERE date = $1 ORDER BY startTime ASC",
    [date]
  );
}

export async function getAllTimeEntries(): Promise<TimeEntry[]> {
  const database = await getDb();
  return database.select<TimeEntry[]>(
    "SELECT * FROM time_entries ORDER BY date DESC, startTime DESC"
  );
}

export async function getTimeEntriesInRange(
  startDate: string,
  endDate: string
): Promise<TimeEntry[]> {
  const database = await getDb();
  return database.select<TimeEntry[]>(
    "SELECT * FROM time_entries WHERE date >= $1 AND date <= $2 ORDER BY date ASC, startTime ASC",
    [startDate, endDate]
  );
}

export async function createTimeEntry(
  entry: Omit<TimeEntry, "id">
): Promise<number> {
  const database = await getDb();
  const result = await database.execute(
    `INSERT INTO time_entries (taskId, date, startTime, endTime, duration)
     VALUES ($1, $2, $3, $4, $5)`,
    [entry.taskId, entry.date, entry.startTime, entry.endTime, entry.duration]
  );
  return result.lastInsertId ?? 0;
}

export async function updateTimeEntry(
  id: number,
  updates: Partial<TimeEntry>
): Promise<void> {
  const database = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.taskId !== undefined) {
    fields.push(`taskId = $${paramIndex++}`);
    values.push(updates.taskId);
  }
  if (updates.date !== undefined) {
    fields.push(`date = $${paramIndex++}`);
    values.push(updates.date);
  }
  if (updates.startTime !== undefined) {
    fields.push(`startTime = $${paramIndex++}`);
    values.push(updates.startTime);
  }
  if (updates.endTime !== undefined) {
    fields.push(`endTime = $${paramIndex++}`);
    values.push(updates.endTime);
  }
  if (updates.duration !== undefined) {
    fields.push(`duration = $${paramIndex++}`);
    values.push(updates.duration);
  }

  if (fields.length === 0) return;

  values.push(id);
  await database.execute(
    `UPDATE time_entries SET ${fields.join(", ")} WHERE id = $${paramIndex}`,
    values
  );
}

export async function deleteTimeEntry(id: number): Promise<void> {
  const database = await getDb();
  await database.execute("DELETE FROM time_entries WHERE id = $1", [id]);
}

export async function getTotalTimeForTask(taskId: number): Promise<number> {
  const database = await getDb();
  const result = await database.select<{ total: number }[]>(
    "SELECT COALESCE(SUM(duration), 0) as total FROM time_entries WHERE taskId = $1",
    [taskId]
  );
  return result[0]?.total || 0;
}

export async function getSetting(key: string): Promise<string | null> {
  const database = await getDb();
  const results = await database.select<{ value: string }[]>(
    "SELECT value FROM settings WHERE key = $1",
    [key]
  );
  return results[0]?.value || null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const database = await getDb();
  await database.execute(
    "INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)",
    [key, value]
  );
}

export async function getSettings(): Promise<Settings> {
  const database = await getDb();
  const results = await database.select<{ key: string; value: string }[]>(
    "SELECT key, value FROM settings"
  );
  const settings: Record<string, string> = {};
  for (const row of results) {
    settings[row.key] = row.value;
  }
  return {
    darkMode: settings.darkMode === "true",
    hoursPerDay: parseFloat(settings.hoursPerDay || "8.5"),
    workStartHour: parseFloat(settings.workStartHour || "9"),
    workEndHour: parseFloat(settings.workEndHour || "17.5"),
  };
}

export async function exportData(): Promise<string> {
  const database = await getDb();
  const tasks = await database.select("SELECT * FROM tasks");
  const plans = await database.select("SELECT * FROM plans");
  const timeEntries = await database.select("SELECT * FROM time_entries");
  const settings = await database.select("SELECT * FROM settings");

  return JSON.stringify(
    {
      version: 1,
      tasks,
      plans,
      timeEntries,
      settings,
    },
    null,
    2
  );
}

export async function importData(jsonString: string): Promise<void> {
  const database = await getDb();
  const data = JSON.parse(jsonString);

  await database.execute("DELETE FROM time_entries");
  await database.execute("DELETE FROM plans");
  await database.execute("DELETE FROM tasks");
  await database.execute("DELETE FROM settings");

  if (data.tasks?.length) {
    for (const task of data.tasks) {
      await database.execute(
        `INSERT INTO tasks (id, title, description, status, color, estimatedHours, createdAt)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [task.id, task.title, task.description, task.status, task.color, task.estimatedHours, task.createdAt]
      );
    }
  }

  if (data.plans?.length) {
    for (const plan of data.plans) {
      await database.execute(
        `INSERT INTO plans (id, taskId, name, date, startTime, endTime, createdAt)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [plan.id, plan.taskId, plan.name, plan.date, plan.startTime, plan.endTime, plan.createdAt]
      );
    }
  }

  if (data.timeEntries?.length) {
    for (const entry of data.timeEntries) {
      await database.execute(
        `INSERT INTO time_entries (id, taskId, date, startTime, endTime, duration)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [entry.id, entry.taskId, entry.date, entry.startTime, entry.endTime, entry.duration]
      );
    }
  }

  if (data.settings?.length) {
    for (const setting of data.settings) {
      await database.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES ($1, $2)",
        [setting.key, setting.value]
      );
    }
  }
}
