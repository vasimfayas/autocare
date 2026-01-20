"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "@/app/lib/firebase";

type Garage = {
  id: string;
  name: string;
  address?: string | null;
  notes?: string | null;
  ownerId: string;
  createdAt?: any;
  updatedAt?: any;
};

type GarageUser = {
  id: string; // membership doc id
  garageId: string;
  uid: string;
  role: "owner" | "admin" | "member";
  createdAt?: any;
};

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

export default function EditGaragePage() {
  const router = useRouter();
  const params = useParams();
  const garageId = (params?.id as string) || ""; // route: /garage/[id]/edit

  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [garage, setGarage] = useState<Garage | null>(null);
  const [membership, setMembership] = useState<GarageUser | null>(null);

  // form
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const firstInputRef = useRef<HTMLInputElement | null>(null);

  // auth guard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) router.replace("/login");
    });
    return () => unsub();
  }, [router]);

  // load garage + membership
  useEffect(() => {
    if (!user?.uid || !garageId) return;

    const run = async () => {
      setLoading(true);
      setErr(null);

      try {
        // 1) read membership for this user+garage
        const mQ = query(
          collection(db, "garage_users"),
          where("uid", "==", user.uid),
          where("garageId", "==", garageId)
        );

        const mSnap = await getDocs(mQ);
        if (mSnap.empty) {
          setErr("You do not have access to this garage.");
          setLoading(false);
          return;
        }

        const mDoc = mSnap.docs[0];
        const mData = mDoc.data() as Omit<GarageUser, "id">;
        const mem: GarageUser = { id: mDoc.id, ...mData };
        setMembership(mem);

        // 2) read garage
        const gRef = doc(db, "garages", garageId);
        const gSnap = await getDoc(gRef);

        if (!gSnap.exists()) {
          setErr("Garage not found.");
          setLoading(false);
          return;
        }

        const gData = gSnap.data() as Omit<Garage, "id">;
        const g: Garage = { id: gSnap.id, ...gData };

        setGarage(g);
        setName(g.name ?? "");
        setAddress((g.address as string) ?? "");
        setNotes((g.notes as string) ?? "");
        setLoading(false);

        setTimeout(() => firstInputRef.current?.focus(), 0);
      } catch (e) {
        console.error("Load garage error:", e);
        setErr("Failed to load garage. Check console.");
        setLoading(false);
      }
    };

    run();
  }, [user?.uid, garageId]);

  const canEdit = useMemo(() => {
    if (!user?.uid || !garage) return false;
    // allow edit if owner/admin, or ownerId matches
    if (garage.ownerId === user.uid) return true;
    return membership?.role === "owner" || membership?.role === "admin";
  }, [user?.uid, garage, membership?.role]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!garageId) return;

    const n = name.trim();
    if (!n) {
      setErr("Garage name is required.");
      return;
    }
    if (!canEdit) {
      setErr("You don’t have permission to edit this garage.");
      return;
    }

    try {
      setSaving(true);
      setErr(null);

      await updateDoc(doc(db, "garages", garageId), {
        name: n,
        address: address.trim() || null,
        notes: notes.trim() || null,
        updatedAt: serverTimestamp(),
      });

      router.push("/garage");
    } catch (e) {
      console.error("Update garage error:", e);
      setErr("Failed to save changes. Check console and Firestore rules.");
      setSaving(false);
    } finally {
      setSaving(false);
    }
  };

  // optional: leave garage (remove membership doc)
  const onLeave = async () => {
    if (!membership?.id) return;

    try {
      setDeleting(true);
      setErr(null);
      await deleteDoc(doc(db, "garage_users", membership.id));
      router.push("/garage");
    } catch (e) {
      console.error("Leave garage error:", e);
      setErr("Failed to leave garage. Check console.");
      setDeleting(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-zinc-50 dark:bg-gray-950">
      <div className="mx-auto max-w-md px-4 pt-6 pb-24">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Edit Garage
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">
              Update garage details.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/garage")}
            className="shrink-0 rounded-2xl border border-zinc-200 dark:border-zinc-800
                       px-4 py-2.5 text-sm font-semibold text-zinc-900 dark:text-white
                       hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
          >
            Back
          </button>
        </div>

        {/* Body */}
        <div className="mt-6">
          {loading && (
            <div className="h-40 rounded-3xl bg-white dark:bg-gray-900 border border-zinc-200 dark:border-zinc-800 animate-pulse" />
          )}

          {!loading && err && (
            <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {err}
            </div>
          )}

          {!loading && !err && garage && (
            <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-gray-900 shadow-sm p-5">
              {!canEdit && (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  You can view this garage, but you don’t have permission to edit
                  it.
                </div>
              )}

              <form onSubmit={onSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
                    Garage Name
                  </label>
                  <input
                    ref={firstInputRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!canEdit || saving}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-2.5 bg-white dark:bg-gray-950 text-sm outline-none transition",
                      "border-zinc-200 dark:border-zinc-800",
                      "focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/20",
                      (!canEdit || saving) && "opacity-70 cursor-not-allowed"
                    )}
                    placeholder="e.g., Home Garage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
                    Address (optional)
                  </label>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={!canEdit || saving}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-2.5 bg-white dark:bg-gray-950 text-sm outline-none transition",
                      "border-zinc-200 dark:border-zinc-800",
                      "focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/20",
                      (!canEdit || saving) && "opacity-70 cursor-not-allowed"
                    )}
                    placeholder="Street / Zone / City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={!canEdit || saving}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-2.5 bg-white dark:bg-gray-950 text-sm outline-none transition min-h-[110px]",
                      "border-zinc-200 dark:border-zinc-800",
                      "focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/20",
                      (!canEdit || saving) && "opacity-70 cursor-not-allowed"
                    )}
                    placeholder="Any notes about this garage..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => router.push("/garage")}
                    disabled={saving}
                    className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 text-sm
                               hover:bg-zinc-50 dark:hover:bg-zinc-800 transition disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!canEdit || saving}
                    className="flex-1 rounded-2xl text-white px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60
                               bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>

              {/* Leave garage (membership delete) */}
              <div className="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={onLeave}
                  disabled={deleting || !membership?.id}
                  className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700
                             hover:bg-rose-100 transition disabled:opacity-60"
                >
                  {deleting ? "Leaving..." : "Leave Garage"}
                </button>

                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  This removes your access by deleting your record in{" "}
                  <span className="font-semibold">garage_users</span>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
