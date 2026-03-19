"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useAppStore } from "@/lib/store";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { TaskDialog } from "./TaskDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/models";

const columns: { id: TaskStatus; title: string }[] = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

export function KanbanBoard() {
  const { tasks, updateTask } = useAppStore();
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getColumnTasks = (status: TaskStatus) =>
    tasks.filter((task) => task.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    let newStatus: TaskStatus | null = null;

    if (columns.some((col) => col.id === overId)) {
      newStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    if (newStatus && newStatus !== activeTask.status) {
      await updateTask(activeId as number, { status: newStatus });
    }
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-xl font-semibold">Kanban Board</h2>
        <Button onClick={handleAddTask}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      <div className="flex-1 overflow-x-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full min-w-max">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
              >
                <SortableContext
                  items={getColumnTasks(column.id).map((t) => t.id!)}
                  strategy={verticalListSortingStrategy}
                >
                  {getColumnTasks(column.id).map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={() => handleEditTask(task)}
                    />
                  ))}
                </SortableContext>
              </KanbanColumn>
            ))}
          </div>

          <DragOverlay>
            {activeTask && (
              <TaskCard task={activeTask} isDragging onEdit={() => {}} />
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
      />
    </div>
  );
}
