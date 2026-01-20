"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "@/app/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function AddVehiclePage() {
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [lastService, setLastService] = useState("");
  const [garageId, setGarageId] = useState("");
  const [garages, setGarages] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const router = useRouter();

  // Get current user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else setUserId(null);
    });

    return () => unsubscribe();
  }, []);

  // Fetch garages for current user
  useEffect(() => {
    if (!userId) return;

    const fetchGarages = async () => {
      try {
        // 1. Get all garageIds from garage_users
        const q = query(
          collection(db, "garage_users"),
          where("uid", "==", userId)
        );

        const snapshot = await getDocs(q);

        const garageIds: string[] = [];
        snapshot.forEach((doc) => {
          garageIds.push(doc.data().garageId);
        });

        if (garageIds.length === 0) return;

        // 2. Fetch garage names from garages collection using IDs
        const garagePromises = garageIds.map(async (id) => {
          const garageDoc = await getDocs(
            query(collection(db, "garages"), where("__name__", "==", id))
          );
          const data = garageDoc.docs[0]?.data();
          return {
            id,
            name: data?.name || "Unnamed Garage",
          };
        });

        const garageList = await Promise.all(garagePromises);
        setGarages(garageList);

      } catch (err) {
        console.error("Fetch garages error:", err);
      }
    };

    fetchGarages();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!garageId) {
      setError("Please select a garage.");
      return;
    }

    try {
      setSaving(true);

      await addDoc(collection(db, "vehicles"), {
        garageId: garageId,
        name: name.trim(),
        model: model.trim(),
        lastService,
        createdAt: serverTimestamp(),
        userId: userId,
      });

      router.push("/vehicles");
    } catch (err: any) {
      console.error("Add vehicle error:", err);
      setError(err?.message || "Failed to add vehicle.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          Add New Vehicle
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Save your vehicle details to track service history.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:bg-gray-900 dark:border-zinc-700">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              Vehicle Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Toyota Corolla"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900
                         shadow-sm outline-none transition
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                         dark:border-zinc-700 dark:bg-gray-950 dark:text-white dark:focus:ring-blue-500/20"
              required
            />
          </div>

          {/* Garage dropdown */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              Select Garage
            </label>

            <select
              value={garageId}
              onChange={(e) => setGarageId(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900
                         shadow-sm outline-none transition
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                         dark:border-zinc-700 dark:bg-gray-950 dark:text-white dark:focus:ring-blue-500/20"
              required
            >
              <option value="">Select garage</option>
              {garages.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              Model / Year
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g., 2020"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900
                         shadow-sm outline-none transition
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                         dark:border-zinc-700 dark:bg-gray-950 dark:text-white dark:focus:ring-blue-500/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              Last Service Date
            </label>
            <input
              type="date"
              value={lastService}
              onChange={(e) => setLastService(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900
                         shadow-sm outline-none transition
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                         dark:border-zinc-700 dark:bg-gray-950 dark:text-white dark:focus:ring-blue-500/20"
              required
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm
                         hover:bg-zinc-50 transition
                         dark:border-zinc-700 dark:hover:bg-zinc-800"
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white
                         hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Add Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}