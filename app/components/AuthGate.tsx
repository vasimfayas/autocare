"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/lib/firebase";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      const isAuthed = !!user;
      setAuthed(isAuthed);
      setChecking(false);

      // If not authenticated, go login
      if (!isAuthed) {
        // optional: keep where they were trying to go
        const next = encodeURIComponent(pathname || "/");
        router.replace(`/login?next=${next}`);
      }
    });

    return () => unsub();
  }, [router, pathname]);

  // While checking auth state, you can show skeleton or nothing
  if (checking) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-gray-900 px-5 py-3 text-sm text-zinc-600 dark:text-zinc-300">
          Loading...
        </div>
      </div>
    );
  }

  // If not authed, we already redirected
  if (!authed) return null;

  return <>{children}</>;
}
