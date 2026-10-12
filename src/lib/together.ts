export type RoomStatus = "waiting" | "running" | "ended";
export type MemberState = "focusing" | "done" | "left";
export interface TogetherRoom { id: string; hostUid: string; hostNickname: string; title: string; durationMin: number; status: RoomStatus; startedAt: number | null; createdAt: number }
export interface TogetherMember { uid: string; nickname: string; joinedAt: number; state: MemberState }
export type RoomPhase = "lobby" | "running" | "finished" | "ended" | "expired";

export const DURATION_OPTIONS = [25, 50, 90] as const;
export const ROOM_LIFETIME_MS = 8 * 3_600_000;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode(random: () => number = Math.random): string {
  return Array.from({ length: 6 }, () => ALPHABET[Math.floor(random() * ALPHABET.length)]).join("");
}
export function normalizeRoomCode(input: string): string | null {
  const code = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return code.length === 6 && [...code].every((char) => ALPHABET.includes(char)) ? code : null;
}

export function roomEndsAt(room: Pick<TogetherRoom, "startedAt" | "durationMin">): number | null {
  return room.startedAt === null ? null : room.startedAt + room.durationMin * 60_000;
}

export function roomPhase(room: TogetherRoom, now: number): RoomPhase {
  if (room.status === "ended") return "ended";
  if (now - room.createdAt > ROOM_LIFETIME_MS) return "expired";
  if (room.status === "waiting" || room.startedAt === null) return "lobby";
  return now >= (roomEndsAt(room) ?? 0) ? "finished" : "running";
}

export function remainingMs(room: TogetherRoom, now: number): number {
  const end = roomEndsAt(room);
  return end === null ? room.durationMin * 60_000 : Math.max(0, end - now);
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  return `${String(minutes).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function memberSummary(members: TogetherMember[]) {
  const active = members.filter((member) => member.state !== "left");
  return { total: active.length, done: active.filter((member) => member.state === "done").length, focusing: active.filter((member) => member.state === "focusing").length };
}
