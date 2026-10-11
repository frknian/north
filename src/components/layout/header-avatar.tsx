"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { UserRound } from "lucide-react";
import { getFirebase } from "@/lib/firebase/client";

export function HeaderAvatar() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const firebase = getFirebase();
    if (!firebase) return;
    return onAuthStateChanged(firebase.auth, setUser);
  }, []);
  const initial = (user?.displayName || user?.email || "").trim().slice(0, 1).toLocaleUpperCase("tr");
  return (
    <Link href="/profile?tab=account" className="ns-avatar" aria-label="Hesap ve profil">
      {user?.photoURL ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="ns-avatar-img" /> : initial ? <span className="ns-avatar-initial" aria-hidden="true">{initial}</span> : <UserRound size={16} />}
    </Link>
  );
}
