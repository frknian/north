"use client";

export interface ActiveFocusLock {
  taskId: string;
  taskTitle: string;
  areaId: string;
  areaName: string;
  areaKind?: string;
  taskGoal: string;
  startedAt: number;
  tabId: string;
  status: "running" | "interrupted_locked";
  exitQuestion: string;
}

export const FOCUS_LOCK_KEY = "north:active_focus_lock";
export const TAB_ID_SESSION_KEY = "north:current_tab_id";
export const BROADCAST_CHANNEL_NAME = "north_focus_lock_channel";

let cachedTabId = "";

export function getTabId(): string {
  if (typeof window === "undefined") return "server";
  if (cachedTabId) return cachedTabId;
  let stored = sessionStorage.getItem(TAB_ID_SESSION_KEY);
  if (!stored) {
    stored = crypto.randomUUID();
    sessionStorage.setItem(TAB_ID_SESSION_KEY, stored);
  }
  cachedTabId = stored;
  return stored;
}

export function generateExitQuestion(
  taskTitle: string,
  taskGoal: string,
  areaName: string,
  areaKind?: string
): string {
  const lower = (areaName + " " + (areaKind || "") + " " + taskTitle).toLowerCase();

  if (lower.includes("matematik") || lower.includes("math") || lower.includes("türev") || lower.includes("integral") || lower.includes("geometri")) {
    return `"${taskTitle}" çalışırken uyguladığın veya çözdüğün ana formülü, soru çözüm kuralını veya vardığın matematiksel sonucu açıkla:`;
  }
  if (lower.includes("siber") || lower.includes("cyber") || lower.includes("güvenlik") || lower.includes("owasp") || lower.includes("lab")) {
    return `"${taskTitle}" oturumunda incelediğin zafiyet türünü, exploit/payload mantığını veya elde ettiğin güvenlik çıkarımını yaz:`;
  }
  if (lower.includes("satranç") || lower.includes("chess") || lower.includes("taktik") || lower.includes("elo")) {
    return `"${taskTitle}" çalışmasında öğrendiğin veya uyguladığın ana taktik motifi (çatal, açmaz, şiş, zayıf kare vb.) ve kritik hamle mantığını açıkla:`;
  }
  if (
    lower.includes("dil") ||
    lower.includes("ingilizce") ||
    lower.includes("almanca") ||
    lower.includes("fransızca") ||
    lower.includes("japonca") ||
    lower.includes("arapça") ||
    lower.includes("language")
  ) {
    return `"${taskTitle}" seansında öğrendiğin en az 3 yeni kelimeyi/kalıbı ve bunların Türkçe anlamlarını veya örnek cümlelerini yaz:`;
  }
  if (lower.includes("kod") || lower.includes("yazılım") || lower.includes("software") || lower.includes("dev") || lower.includes("react") || lower.includes("python")) {
    return `"${taskTitle}" çalışmasında yazdığın en kritik kod bloğunu, fonksiyon algoritmasını veya çözdüğün hatayı açıkla:`;
  }
  return `"${taskTitle}" (${taskGoal}) çalışması sırasında ürettiğin en somut çıktıyı veya kavradığın temel prensibi açıkla:`;
}

export function getActiveFocusLock(): ActiveFocusLock | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FOCUS_LOCK_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveFocusLock;
  } catch {
    return null;
  }
}

export function setFocusLock(lock: ActiveFocusLock): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FOCUS_LOCK_KEY, JSON.stringify(lock));
    notifyBroadcast("lock_updated");
  } catch {}
}

export function markFocusLockInterrupted(): void {
  const current = getActiveFocusLock();
  if (current) {
    current.status = "interrupted_locked";
    try {
      localStorage.setItem(FOCUS_LOCK_KEY, JSON.stringify(current));
      notifyBroadcast("lock_updated");
    } catch {}
  }
}

export function clearFocusLock(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(FOCUS_LOCK_KEY);
    notifyBroadcast("lock_cleared");
  } catch {}
}

function notifyBroadcast(event: "lock_updated" | "lock_cleared") {
  try {
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({ type: event, timestamp: Date.now() });
      channel.close();
    }
  } catch {}
}

export function isCurrentTabLocked(): {
  isLocked: boolean;
  reason?: "other_tab" | "reopened_unanswered";
  lock?: ActiveFocusLock;
} {
  const lock = getActiveFocusLock();
  if (!lock) return { isLocked: false };

  const currentTab = getTabId();

  // If status is interrupted_locked, it requires answering the exit question!
  if (lock.status === "interrupted_locked") {
    return { isLocked: true, reason: "reopened_unanswered", lock };
  }

  // If status is running:
  if (lock.status === "running") {
    // If it's a different tab, block it!
    if (lock.tabId !== currentTab) {
      return { isLocked: true, reason: "other_tab", lock };
    }
  }

  return { isLocked: false };
}
