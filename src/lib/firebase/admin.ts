import "server-only";

/**
 * Verifies a Firebase ID token through Google Identity Toolkit.
 *
 * Planorth currently uses client-managed Firestore access and does not need the
 * Firebase Admin SDK. Keeping verification on this official endpoint also
 * avoids loading an unused Admin dependency in every serverless AI function.
 */
export async function verifyFirebaseRequest(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer ([A-Za-z0-9._-]{20,4096})$/.exec(authorization);
  const token = match?.[1];
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!token || !apiKey) return null;

  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return null;
    const data = await response.json() as { users?: Array<{ localId: string; email?: string }> };
    const user = data.users?.[0];
    return user ? { uid: user.localId, email: user.email } : null;
  } catch {
    return null;
  }
}
