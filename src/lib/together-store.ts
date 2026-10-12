"use client";

import { collection, deleteDoc, doc, getDoc, onSnapshot, setDoc, updateDoc, type Unsubscribe } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase/client";
import { generateRoomCode, normalizeRoomCode, roomPhase, type MemberState, type TogetherMember, type TogetherRoom } from "@/lib/together";
import { sanitizeNickname } from "@/lib/social";

function ctx() {
  const firebase = getFirebase();
  const user = firebase?.auth.currentUser;
  if (!firebase || !user) throw new Error("Ortak odak için giriş yapmış olman gerekiyor.");
  return { db: firebase.db, uid: user.uid };
}

const roomRef = (db: ReturnType<typeof ctx>["db"], id: string) => doc(db, "focusRooms", id);

export async function createRoom(input: { title: string; durationMin: number; nickname: string }): Promise<string> {
  const { db, uid } = ctx();
  const nickname = sanitizeNickname(input.nickname);
  if (nickname.length < 2) throw new Error("Takma ad en az 2 karakter olmalı.");
  let id = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateRoomCode();
    if (!(await getDoc(roomRef(db, candidate))).exists()) { id = candidate; break; }
  }
  if (!id) throw new Error("Oda kodu oluşturulamadı, tekrar dene.");
  const now = Date.now();
  await setDoc(roomRef(db, id), { hostUid: uid, hostNickname: nickname, title: input.title.trim().slice(0, 60) || "Ortak odak", durationMin: input.durationMin, status: "waiting", startedAt: null, createdAt: now });
  await setDoc(doc(db, "focusRooms", id, "members", uid), { nickname, joinedAt: now, state: "focusing" });
  return id;
}

function toRoom(id: string, data: Record<string, unknown>): TogetherRoom {
  return { id, hostUid: String(data.hostUid), hostNickname: String(data.hostNickname ?? ""), title: String(data.title ?? "Ortak odak"), durationMin: Number(data.durationMin) || 25, status: (data.status as TogetherRoom["status"]) ?? "waiting", startedAt: typeof data.startedAt === "number" ? data.startedAt : null, createdAt: Number(data.createdAt) || 0 };
}

export async function joinRoom(rawCode: string, nicknameInput: string): Promise<string> {
  const { db, uid } = ctx();
  const id = normalizeRoomCode(rawCode);
  if (!id) throw new Error("Oda kodu 6 karakter olmalı (harf ve rakam).");
  const nickname = sanitizeNickname(nicknameInput);
  if (nickname.length < 2) throw new Error("Takma ad en az 2 karakter olmalı.");
  const snapshot = await getDoc(roomRef(db, id));
  if (!snapshot.exists()) throw new Error("Bu kodla bir oda bulunamadı.");
  const room = toRoom(id, snapshot.data());
  const phase = roomPhase(room, Date.now());
  if (phase === "ended" || phase === "expired") throw new Error("Bu oda kapanmış.");
  if (phase === "finished") throw new Error("Bu odanın oturumu bitmiş.");
  await setDoc(doc(db, "focusRooms", id, "members", uid), { nickname, joinedAt: Date.now(), state: "focusing" });
  return id;
}

export function watchRoom(id: string, callback: (room: TogetherRoom | null) => void): Unsubscribe {
  const { db } = ctx();
  return onSnapshot(roomRef(db, id), (snapshot) => callback(snapshot.exists() ? toRoom(id, snapshot.data()) : null), () => callback(null));
}

export function watchMembers(id: string, callback: (members: TogetherMember[]) => void): Unsubscribe {
  const { db } = ctx();
  return onSnapshot(collection(db, "focusRooms", id, "members"), (snapshot) => callback(snapshot.docs.map((item) => ({ uid: item.id, ...(item.data() as Omit<TogetherMember, "uid">) })).sort((a, b) => a.joinedAt - b.joinedAt)), () => callback([]));
}

export async function startRoom(id: string) { const { db } = ctx(); await updateDoc(roomRef(db, id), { status: "running", startedAt: Date.now() }); }
export async function endRoom(id: string) { const { db } = ctx(); await updateDoc(roomRef(db, id), { status: "ended" }); }
export async function setMyState(id: string, state: MemberState) { const { db, uid } = ctx(); await updateDoc(doc(db, "focusRooms", id, "members", uid), { state }); }
export async function leaveRoom(id: string) { const { db, uid } = ctx(); await deleteDoc(doc(db, "focusRooms", id, "members", uid)).catch(() => {}); }
export function currentUid(): string | null { return getFirebase()?.auth.currentUser?.uid ?? null; }
