// Area color mapping helpers
export const areaColorMap: Record<string, { color: string; bg: string; border: string; dot: string; text: string }> = {
  cyber: { color: "#06B6D4", bg: "bg-cyan-500/10", border: "border-cyan-500/20", dot: "bg-cyan-400", text: "text-cyan-700 dark:text-cyan-300" },
  math: { color: "#A855F7", bg: "bg-purple-500/10", border: "border-purple-500/20", dot: "bg-purple-400", text: "text-purple-700 dark:text-purple-300" },
  chess: { color: "#F59E0B", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-400", text: "text-amber-700 dark:text-amber-300" },
  english: { color: "#3B82F6", bg: "bg-blue-500/10", border: "border-blue-500/20", dot: "bg-blue-400", text: "text-blue-700 dark:text-blue-300" },
  german: { color: "#10B981", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400", text: "text-emerald-700 dark:text-emerald-300" },
  french: { color: "#EC4899", bg: "bg-pink-500/10", border: "border-pink-500/20", dot: "bg-pink-400", text: "text-pink-700 dark:text-pink-300" },
  japanese: { color: "#EF4444", bg: "bg-rose-500/10", border: "border-rose-500/20", dot: "bg-rose-400", text: "text-rose-700 dark:text-rose-300" },
  arabic: { color: "#14B8A6", bg: "bg-teal-500/10", border: "border-teal-500/20", dot: "bg-teal-400", text: "text-teal-700 dark:text-teal-300" },
};

export function getAreaStyling(areaId?: string, areaName?: string) {
  const key = (areaId || "").toLowerCase();
  const nameKey = (areaName || "").toLowerCase();
  for (const [k, val] of Object.entries(areaColorMap)) {
    if (key.includes(k) || nameKey.includes(k)) {
      return val;
    }
  }
  if (nameKey.includes("siber") || nameKey.includes("güvenlik")) return areaColorMap.cyber;
  if (nameKey.includes("matematik") || nameKey.includes("ayt") || nameKey.includes("tyt")) return areaColorMap.math;
  if (nameKey.includes("satranç") || nameKey.includes("chess")) return areaColorMap.chess;
  return { color: "#3B82F6", bg: "bg-blue-500/10", border: "border-blue-500/20", dot: "bg-blue-400", text: "text-blue-700 dark:text-blue-300" };
}
