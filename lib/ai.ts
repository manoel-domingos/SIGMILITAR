// Log store consumido pelo Console de Depuração IA (components/DebugAIPanel.tsx).
// Toda a geração de IA do sistema passa pelo DeepSeek via streamAI (/api/ai).

export interface AILog {
  id: string;
  timestamp: string;
  model: string;
  prompt: string;
  response: string;
  tokens?: number;
  status: 'success' | 'error';
  error?: string;
  provider: 'deepseek';
}

export const globalAILogs: AILog[] = [];
let onLogUpdate: ((logs: AILog[]) => void) | null = null;

export function subscribeToAILogs(callback: (logs: AILog[]) => void) {
  onLogUpdate = callback;
  return () => { onLogUpdate = null; };
}

export function addAILog(log: Omit<AILog, 'id' | 'timestamp'>) {
  const newLog: AILog = {
    ...log,
    id: Math.random().toString(36).substring(7),
    timestamp: new Date().toLocaleTimeString(),
  };
  globalAILogs.unshift(newLog);
  if (globalAILogs.length > 50) globalAILogs.pop();
  if (onLogUpdate) onLogUpdate([...globalAILogs]);
}
