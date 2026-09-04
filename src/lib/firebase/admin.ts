import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || (!process.env.GOOGLE_APPLICATION_CREDENTIALS && (!clientEmail || !privateKey))) return null;
  const credential = process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? applicationDefault()
    : cert({ projectId, clientEmail, privateKey });
  return initializeApp({ credential, projectId });
}

export async function verifyFirebaseRequest(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const app = getAdminApp();
  if (app) {
    try { return await getAuth(app).verifyIdToken(token); } catch { return null; }
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = await response.json() as { users?: Array<{ localId: string; email?: string }> };
    const user = data.users?.[0];
    return user ? { uid: user.localId, email: user.email } : null;
  } catch { return null; }
}
