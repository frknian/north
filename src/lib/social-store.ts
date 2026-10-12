"use client";

import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, serverTimestamp, setDoc, type Unsubscribe } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase/client";
import { generateInviteCode, normalizeInviteCode, sanitizeNickname, type PublicProfile, type ShareStats } from "@/lib/social";

export interface FriendRequest { uid: string; nickname: string; createdAt?: unknown }
export interface SocialSettings { enabled: boolean; nickname: string; code: string }

function db() {
  const firebase = getFirebase();
  const user = firebase?.auth.currentUser;
  if (!firebase || !user) throw new Error("Bu özellik için giriş yapmış olman gerekiyor.");
  return { db: firebase.db, uid: user.uid };
}

export async function loadSocialSettings(): Promise<SocialSettings> {
  const { db: store, uid } = db();
  const snapshot = await getDoc(doc(store, "publicProfiles", uid));
  if (!snapshot.exists()) return { enabled: false, nickname: "", code: "" };
  const data = snapshot.data() as Partial<PublicProfile> & { code?: string };
  return { enabled: true, nickname: data.nickname ?? "", code: data.code ?? "" };
}

/** Turns sharing on: publishes a nickname, stats and a fresh invite code (nothing else about the account). */
export async function enableSharing(nicknameInput: string, stats: ShareStats): Promise<SocialSettings> {
  const { db: store, uid } = db();
  const nickname = sanitizeNickname(nicknameInput);
  if (nickname.length < 2) throw new Error("Takma ad en az 2 karakter olmalı.");
  let code = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateInviteCode();
    const existing = await getDoc(doc(store, "inviteCodes", candidate));
    if (!existing.exists()) { code = candidate; break; }
  }
  if (!code) throw new Error("Davet kodu oluşturulamadı, tekrar dene.");
  await setDoc(doc(store, "inviteCodes", code), { uid });
  await setDoc(doc(store, "publicProfiles", uid), { nickname, code, ...stats, updatedAt: new Date().toISOString() });
  return { enabled: true, nickname, code };
}

export async function disableSharing(code: string) {
  const { db: store, uid } = db();
  if (code) await deleteDoc(doc(store, "inviteCodes", code)).catch(() => {});
  await deleteDoc(doc(store, "publicProfiles", uid));
}

export async function publishStats(nickname: string, code: string, stats: ShareStats) {
  const { db: store, uid } = db();
  await setDoc(doc(store, "publicProfiles", uid), { nickname, code, ...stats, updatedAt: new Date().toISOString() });
}

export async function sendFriendRequest(rawCode: string, myNickname: string): Promise<string> {
  const { db: store, uid } = db();
  const code = normalizeInviteCode(rawCode);
  if (!code) throw new Error("Davet kodu 8 karakter olmalı (harf ve rakam).");
  const invite = await getDoc(doc(store, "inviteCodes", code));
  if (!invite.exists()) throw new Error("Bu kodla eşleşen biri bulunamadı.");
  const friendUid = (invite.data() as { uid: string }).uid;
  if (friendUid === uid) throw new Error("Kendi davet kodunu ekleyemezsin.");
  // Adding the friend on my side lets me read their stats; the request lets them add me back.
  await setDoc(doc(store, "users", uid, "friends", friendUid), { since: new Date().toISOString() });
  await setDoc(doc(store, "users", friendUid, "friendRequests", uid), { nickname: myNickname, createdAt: serverTimestamp() });
  return friendUid;
}

export async function acceptRequest(friendUid: string) {
  const { db: store, uid } = db();
  await setDoc(doc(store, "users", uid, "friends", friendUid), { since: new Date().toISOString() });
  await deleteDoc(doc(store, "users", uid, "friendRequests", friendUid));
}
export async function declineRequest(friendUid: string) { const { db: store, uid } = db(); await deleteDoc(doc(store, "users", uid, "friendRequests", friendUid)); }
export async function removeFriend(friendUid: string) { const { db: store, uid } = db(); await deleteDoc(doc(store, "users", uid, "friends", friendUid)); }

export function watchRequests(callback: (requests: FriendRequest[]) => void): Unsubscribe {
  const { db: store, uid } = db();
  return onSnapshot(collection(store, "users", uid, "friendRequests"), (snapshot) => callback(snapshot.docs.map((item) => ({ uid: item.id, ...(item.data() as { nickname: string }) }))), () => callback([]));
}

export async function loadFriendProfiles(): Promise<PublicProfile[]> {
  const { db: store, uid } = db();
  const friends = await getDocs(collection(store, "users", uid, "friends"));
  const profiles = await Promise.all(friends.docs.map(async (friend) => {
    try {
      const snapshot = await getDoc(doc(store, "publicProfiles", friend.id));
      return snapshot.exists() ? ({ uid: friend.id, ...(snapshot.data() as Omit<PublicProfile, "uid">) }) : null;
    } catch { return null; }
  }));
  return profiles.filter((profile): profile is PublicProfile => Boolean(profile));
}
