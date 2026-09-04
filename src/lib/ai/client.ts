import { getFirebase } from "@/lib/firebase/client";

export async function authenticatedAiFetch(path: string, init: RequestInit) {
  const token = await getFirebase()?.auth.currentUser?.getIdToken();
  if (!token) throw new Error("AI özelliklerini kullanmak için Firebase hesabına giriş yapmalısın.");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(path, { ...init, headers });
}
