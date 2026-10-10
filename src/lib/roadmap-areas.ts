import { resolveRoadmapAreaId, type LearningRoadmapState } from "./learning-roadmap";
import { createArea, type AreaKind, type NorthState } from "./north";

function kindForLabel(label: string): AreaKind {
  const name = label.toLocaleLowerCase("tr-TR");
  if (/siber|security|pentest|güvenlik|offensive/.test(name)) return "cyber";
  if (/matematik|üniversite|istatistik|olasılık/.test(name)) return "math";
  if (/uygulama|ürün|ritim|hedefit|geliştirme/.test(name)) return "projects";
  if (/kitap|okuma/.test(name)) return "reading";
  return "custom";
}

/** Keep the imported plan's labels in this account's Areas without touching other accounts. */
export function syncRoadmapAreas(roadmap: LearningRoadmapState, north: NorthState): { roadmap: LearningRoadmapState; north: NorthState } {
  if (!roadmap.plan) return { roadmap, north };
  const totals = new Map<string, number>();
  for (const week of roadmap.plan.weeks) for (const task of week.tasks) {
    const label = task.area.trim();
    if (label) totals.set(label, (totals.get(label) ?? 0) + task.minutes);
  }
  const areas = [...north.areas];
  const areaLinks = { ...roadmap.areaLinks };
  let changed = false;
  for (const [label, totalMinutes] of totals) {
    if (areaLinks[label] === "-") continue;
    let areaId = resolveRoadmapAreaId(label, areas, areaLinks);
    if (!areaId) {
      const kind = kindForLabel(label);
      const area = createArea(kind, crypto.randomUUID());
      area.name = label;
      area.weeklyMinutes = Math.round(totalMinutes / roadmap.plan.weeks.length);
      areas.push(area);
      areaId = area.id;
      changed = true;
    }
    if (areaLinks[label] !== areaId) {
      areaLinks[label] = areaId;
      changed = true;
    }
  }
  return changed ? { roadmap: { ...roadmap, areaLinks }, north: { ...north, areas } } : { roadmap, north };
}
