"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/app/lib/firebase"; // adjust if your path is different

type ServiceLog = {
  id: string;
  vehicleId: number;
  serviceType: string;
  date: string; // "YYYY-MM-DD"
  km: number;
  price: number;
  description?: string;
  createdAt?: any; // Firestore Timestamp
};

export default function ServicesPage() {
  const [logs, setLogs] = useState<ServiceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Make sure your writes include createdAt: serverTimestamp()
    const q = query(collection(db, "serviceLogs"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data: ServiceLog[] = snap.docs.map((doc) => {
          const d = doc.data() as Omit<ServiceLog, "id">;
          return { id: doc.id, ...d };
        });
        setLogs(data);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore read error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  return (
    <div className="max-w-6xl my-8 mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight mb-8 text-zinc-900 dark:text-white">
        Service History
      </h1>

      {loading && (
        <div className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</div>
      )}

      {!loading && logs.length === 0 && (
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          No service logs yet.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {logs.map((s) => (
          <Link
            key={s.id}
            href={`/services/${s.id}`}
            className="group block rounded-2xl border border-zinc-200 bg-white
                       shadow-sm hover:shadow-md transition-shadow
                       dark:border-zinc-700 dark:bg-gray-900"
          >
            <div className="p-5 space-y-2">
              <p className="text-base font-semibold text-zinc-900 dark:text-white">
                Vehicle #{s.vehicleId}
              </p>

              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                {s.serviceType}
              </p>

              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>{s.date}</span>
                <span>{s.km.toLocaleString()} km</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
