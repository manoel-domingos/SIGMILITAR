"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X, ClipboardList } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  autoCompleteTrigger?: "whatsapp"; // item é autoconcluído ao enviar WA
};

export type OccurrenceTask = {
  occurrenceId: string;
  occurrenceNum: string; // ex: "O47"
  studentName: string;
  items: ChecklistItem[];
  createdAt: string;
};

// ─── Storage helpers ──────────────────────────────────────────────────────────

const STORAGE_KEY = (userId: string) => `occ_checklist_${userId}`;

export function loadChecklists(userId: string): OccurrenceTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveChecklists(userId: string, tasks: OccurrenceTask[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(tasks));
}

export function addOccurrenceTask(
  userId: string,
  task: OccurrenceTask
): OccurrenceTask[] {
  const current = loadChecklists(userId);
  // evita duplicata
  const filtered = current.filter((t) => t.occurrenceId !== task.occurrenceId);
  const updated = [task, ...filtered];
  saveChecklists(userId, updated);
  return updated;
}

export function removeOccurrenceTask(
  userId: string,
  occurrenceId: string
): OccurrenceTask[] {
  const updated = loadChecklists(userId).filter(
    (t) => t.occurrenceId !== occurrenceId
  );
  saveChecklists(userId, updated);
  return updated;
}

export function toggleChecklistItem(
  userId: string,
  occurrenceId: string,
  itemId: string
): OccurrenceTask[] {
  const tasks = loadChecklists(userId).map((t) => {
    if (t.occurrenceId !== occurrenceId) return t;
    return {
      ...t,
      items: t.items.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item
      ),
    };
  });
  saveChecklists(userId, tasks);
  return tasks;
}

export function autocompleteWhatsapp(
  userId: string,
  occurrenceId: string
): OccurrenceTask[] {
  const tasks = loadChecklists(userId).map((t) => {
    if (t.occurrenceId !== occurrenceId) return t;
    return {
      ...t,
      items: t.items.map((item) =>
        item.autoCompleteTrigger === "whatsapp" ? { ...item, done: true } : item
      ),
    };
  });
  saveChecklists(userId, tasks);
  return tasks;
}

// ─── Helper export ────────────────────────────────────────────────────────────

export function hasPendingTasks(userId: string): boolean {
  const tasks = loadChecklists(userId);
  return tasks.some((t) => t.items.some((i) => !i.done));
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  userId: string;
  tasks: OccurrenceTask[];
  onUpdate: (tasks: OccurrenceTask[]) => void;
  autoOpen?: boolean; // abre o painel automaticamente se true
};

export default function OccurrenceChecklist({ userId, tasks, onUpdate, autoOpen = true }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [panelOpen, setPanelOpen] = useState(autoOpen);

  const pendingCount = tasks.reduce(
    (acc, t) => acc + t.items.filter((i) => !i.done).length,
    0
  );

  const handleToggleItem = useCallback(
    (occurrenceId: string, itemId: string) => {
      const updated = toggleChecklistItem(userId, occurrenceId, itemId);
      onUpdate(updated);
    },
    [userId, onUpdate]
  );

  const handleRemoveTask = useCallback(
    (occurrenceId: string) => {
      const updated = removeOccurrenceTask(userId, occurrenceId);
      onUpdate(updated);
    },
    [userId, onUpdate]
  );

  if (tasks.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[70] w-80 max-h-[80vh] flex flex-col"
      role="complementary"
      aria-label="Pendências de ocorrências"
    >
      {/* Header */}
      <button
        onClick={() => setPanelOpen((v) => !v)}
        className="flex items-center justify-between w-full px-3.5 py-2.5 bg-slate-800 text-white rounded-t-xl shadow-xl focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-blue-300 shrink-0" />
          <span className="text-sm font-semibold">Pendências</span>
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {pendingCount}
            </span>
          )}
        </div>
        {panelOpen ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Body */}
      {panelOpen && (
        <div className="overflow-y-auto flex-1 bg-white border border-t-0 border-slate-200 rounded-b-xl shadow-xl divide-y divide-slate-100">
          {tasks.map((task) => {
            const isCollapsed = collapsed[task.occurrenceId];
            const allDone = task.items.every((i) => i.done);
            const pending = task.items.filter((i) => !i.done).length;

            return (
              <div key={task.occurrenceId} className="text-sm">
                {/* Task header */}
                <div
                  className={'flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ' + (allDone ? 'bg-green-50' : 'bg-white hover:bg-slate-50')}
                  onClick={() =>
                    setCollapsed((c) => ({
                      ...c,
                      [task.occurrenceId]: !c[task.occurrenceId],
                    }))
                  }
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate text-xs">
                      {task.occurrenceNum} — {task.studentName}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {allDone ? (
                        <span className="text-green-600 font-medium">Concluido</span>
                      ) : (
                        `${pending} pendente${pending > 1 ? "s" : ""}`
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {allDone && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTask(task.occurrenceId);
                        }}
                        className="text-slate-300 hover:text-slate-500 transition-colors"
                        title="Remover"
                        aria-label="Remover pendência concluída"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isCollapsed ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Items */}
                {!isCollapsed && (
                  <ul className="px-3 pb-2.5 pt-1 space-y-1.5 bg-white">
                    {task.items.map((item) => (
                      <li key={item.id} className="flex items-start gap-2">
                        <button
                          onClick={() =>
                            handleToggleItem(task.occurrenceId, item.id)
                          }
                          className={'mt-0.5 shrink-0 transition-colors ' + (item.done ? 'text-green-500' : 'text-slate-300 hover:text-blue-500')}
                          aria-label={item.done ? "Marcar como pendente" : "Marcar como concluído"}
                        >
                          {item.done ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <span
                          className={'text-xs leading-relaxed ' + (item.done ? 'line-through text-slate-400' : 'text-slate-700')}
                        >
                          {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
