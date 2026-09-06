/**
 * Verifies a Firebase ID token through Google Identity Toolkit.
 *
 * North currently uses client-managed Firestore access and does not need the
 * Firebase Admin SDK. Keeping verification on this official endpoint also
 * avoids loading an unused Admin dependency in every serverless AI function.
 */
export async function verifyFirebaseRequest(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!token || !apiKey) return null;

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
  } catch {
    return null;
  }
}
