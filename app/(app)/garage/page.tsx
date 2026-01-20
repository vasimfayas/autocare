"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  documentId,
  getCountFromServer,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
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
  garageId: string;
  uid: string;
  role: "owner" | "admin" | "member";
  createdAt?: any;
};

type Vehicle = {
  id: string;
  uid: string;
  name: string;
  model: string;
  garageId: string | null;
  createdAt?: any;
  updatedAt?: any;
};

type AppUser = {
  id: string;
  displayName?: string;
  email?: string;
};

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function GaragePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // garages list
  const [garages, setGarages] = useState<Garage[]>([]);
  const [loading, setLoading] = useState(true);

  // counts
  const [vehiclesCountByGarage, setVehiclesCountByGarage] = useState<
    Record<string, number>
  >({});
  const [usersCountByGarage, setUsersCountByGarage] = useState<
    Record<string, number>
  >({});

  // create modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [gName, setGName] = useState("");
  const [gAddress, setGAddress] = useState("");
  const [gNotes, setGNotes] = useState("");
  const [gErr, setGErr] = useState<string | null>(null);

  // vehicles selection
  const [myVehicles, setMyVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);

  // add members by email
  const [userSearchEmail, setUserSearchEmail] = useState("");
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);
  const [members, setMembers] = useState<AppUser[]>([]);

  const createModalRef = useRef<HTMLDivElement | null>(null);
  const createFirstInputRef = useRef<HTMLInputElement | null>(null);

  // auth guard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) router.replace("/login");
    });
    return () => unsub();
  }, [router]);

  // realtime: read memberships for current user -> fetch garages
  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);

    const membershipsQ = query(
      collection(db, "garage_users"),
      where("uid", "==", user.uid)
    );

    const unsub = onSnapshot(
      membershipsQ,
      async (snap) => {
        try {
          const memberships = snap.docs.map((d) => d.data() as GarageUser);
          const garageIds = Array.from(
            new Set(memberships.map((m) => m.garageId).filter(Boolean))
          );

          if (garageIds.length === 0) {
            setGarages([]);
            setVehiclesCountByGarage({});
            setUsersCountByGarage({});
            setLoading(false);
            return;
          }

          // fetch garages by IDs (chunked by 10)
          const parts = chunk(garageIds, 10);
          const fetched: Garage[] = [];

          for (const ids of parts) {
            const garagesQ = query(
              collection(db, "garages"),
              where(documentId(), "in", ids)
            );
            const gs = await getDocs(garagesQ);
            gs.forEach((g) =>
              fetched.push({ id: g.id, ...(g.data() as Omit<Garage, "id">) })
            );
          }

          // order by createdAt desc (fallback by name)
          fetched.sort((a, b) => {
            const as = a.createdAt?.seconds ?? 0;
            const bs = b.createdAt?.seconds ?? 0;
            if (bs !== as) return bs - as;
            return (a.name || "").localeCompare(b.name || "");
          });

          setGarages(fetched);
          setLoading(false);

          // fetch counts for each garage
          void fetchCounts(fetched);
        } catch (err) {
          console.error("Fetch garages error:", err);
          setLoading(false);
        }
      },
      (err) => {
        console.error("garage_users read error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const fetchCounts = async (list: Garage[]) => {
    try {
      const vCounts: Record<string, number> = {};
      const uCounts: Record<string, number> = {};

      await Promise.all(
        list.map(async (g) => {
          const vehiclesQ = query(
            collection(db, "vehicles"),
            where("garageId", "==", g.id)
          );
          const usersQ = query(
            collection(db, "garage_users"),
            where("garageId", "==", g.id)
          );

          const [vAgg, uAgg] = await Promise.all([
            getCountFromServer(vehiclesQ),
            getCountFromServer(usersQ),
          ]);

          vCounts[g.id] = vAgg.data().count;
          uCounts[g.id] = uAgg.data().count;
        })
      );

      setVehiclesCountByGarage(vCounts);
      setUsersCountByGarage(uCounts);
    } catch (e) {
      console.error("Count fetch error:", e);
    }
  };

  const hasGarages = useMemo(() => garages.length > 0, [garages.length]);

  // open create modal + load available vehicles (owned by user & unassigned)
  const openCreate = async () => {
    setGErr(null);
    setUserSearchError(null);
    setIsCreateOpen(true);
    setGName("");
    setGAddress("");
    setGNotes("");
    setMembers([]);
    setSelectedVehicleIds([]);
    setUserSearchEmail("");
    setMyVehicles([]);

    if (!user?.uid) return;

    try {
      // IMPORTANT: this requires vehicles have garageId: null if unassigned
      const vQ = query(
        collection(db, "vehicles"),
        where("uid", "==", user.uid),
        where("garageId", "==", null),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(vQ);
      const data: Vehicle[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Vehicle, "id">),
      }));
      setMyVehicles(data);
    } catch (e) {
      console.error("Load vehicles error:", e);
      setMyVehicles([]);
    }
  };

  const closeCreate = () => {
    if (creating) return;
    setIsCreateOpen(false);
    setGErr(null);
    setUserSearchError(null);
  };

  // modal behavior: ESC + scroll lock + focus
  useEffect(() => {
    if (!isCreateOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCreate();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    setTimeout(() => createFirstInputRef.current?.focus(), 0);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreateOpen, creating]);

  // modal behavior: outside click
  useEffect(() => {
    if (!isCreateOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (createModalRef.current && !createModalRef.current.contains(target)) {
        closeCreate();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreateOpen, creating]);

  // search existing user by email (users collection)
  const searchUserByEmail = async () => {
    const email = userSearchEmail.trim();
    if (!email) return;

    try {
      setUserSearchLoading(true);
      setUserSearchError(null);

      // This assumes users docs contain `email` field.
      // If you store `emailLower`, change query to emailLower == email.toLowerCase()
      const uQ = query(collection(db, "users"), where("email", "==", email));
      const snap = await getDocs(uQ);

      if (snap.empty) {
        setUserSearchError("No user found with that email.");
        return;
      }

      const udoc = snap.docs[0];
      const udata = udoc.data() as any;

      const found: AppUser = {
        id: udoc.id,
        displayName: udata.displayName,
        email: udata.email,
      };

      if (found.id === user?.uid) {
        setUserSearchError("You are already the owner.");
        return;
      }
      if (members.some((m) => m.id === found.id)) {
        setUserSearchError("User already added.");
        return;
      }

      setMembers((prev) => [...prev, found]);
      setUserSearchEmail("");
    } catch (e) {
      console.error("User search error:", e);
      setUserSearchError("Search failed. Check console / rules.");
    } finally {
      setUserSearchLoading(false);
    }
  };

  // create garage (top-level garages + garage_users join + assign vehicles)
  const createGarage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    const name = gName.trim();
    if (!name) {
      setGErr("Garage name is required.");
      return;
    }

    try {
      setCreating(true);
      setGErr(null);

      // 1) create garage
      const garageRef = await addDoc(collection(db, "garages"), {
        name,
        address: gAddress.trim() || null,
        notes: gNotes.trim() || null,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2) batch: memberships + assign vehicles
      const batch = writeBatch(db);

      // owner membership
      batch.set(doc(collection(db, "garage_users")), {
        garageId: garageRef.id,
        uid: user.uid,
        role: "owner",
        createdAt: serverTimestamp(),
      });

      // member memberships
      for (const m of members) {
        batch.set(doc(collection(db, "garage_users")), {
          garageId: garageRef.id,
          uid: m.id,
          role: "member",
          createdAt: serverTimestamp(),
        });
      }

      // assign vehicles
      for (const vehicleId of selectedVehicleIds) {
        batch.update(doc(db, "vehicles", vehicleId), {
          garageId: garageRef.id,
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();

      closeCreate();
    } catch (err) {
      console.error("Create garage error:", err);
      setGErr("Failed to create garage. Check console and Firestore rules.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-zinc-50 dark:bg-gray-950">
      <div className="mx-auto max-w-md px-4 pt-6 pb-24">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
              My Garages
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">
              View and manage your garages.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white
                       bg-gradient-to-br from-blue-600 to-indigo-600
                       hover:from-blue-700 hover:to-indigo-700 transition"
          >
            + Add Garage
          </button>
        </div>

        {/* Body */}
        <div className="mt-6 space-y-3">
          {loading && (
            <>
              <div className="h-24 rounded-3xl bg-white dark:bg-gray-900 border border-zinc-200 dark:border-zinc-800 animate-pulse" />
              <div className="h-24 rounded-3xl bg-white dark:bg-gray-900 border border-zinc-200 dark:border-zinc-800 animate-pulse" />
            </>
          )}

          {!loading && garages.length === 0 && (
            <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-gray-900 p-5">
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                No garages yet. Create one to organize your vehicles and service
                records.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-white
                           bg-gradient-to-br from-blue-600 to-indigo-600
                           hover:from-blue-700 hover:to-indigo-700 transition"
              >
                Create your first garage
              </button>
            </div>
          )}

          {!loading &&
            hasGarages &&
            garages.map((g) => (
              <div
                key={g.id}
                className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-gray-900 shadow-sm p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-white truncate">
                      {g.name}
                    </h3>

                    {!!g.address && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">
                        {g.address}
                      </p>
                    )}

                    {!!g.notes && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                        {g.notes}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>
                        Vehicles:{" "}
                        <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                          {vehiclesCountByGarage[g.id] ?? 0}
                        </span>
                      </span>
                      <span>
                        Users:{" "}
                        <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                          {usersCountByGarage[g.id] ?? 0}
                        </span>
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push(`/garage/${g.id}/edit`)}
                    className="shrink-0 rounded-2xl border border-zinc-200 dark:border-zinc-800
                               px-3 py-2 text-sm font-semibold text-zinc-900 dark:text-white
                               hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Create Garage Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/45" />

          <div
            ref={createModalRef}
            className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900
                       rounded-t-3xl sm:rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800"
          >
            <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                  Create Garage
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Add a new garage for your account
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreate}
                disabled={creating}
                className="h-9 w-9 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition
                           flex items-center justify-center disabled:opacity-60"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={createGarage} className="px-5 py-5 space-y-4">
              {gErr && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {gErr}
                </div>
              )}

              {/* Basic info */}
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
                  Garage Name
                </label>
                <input
                  ref={createFirstInputRef}
                  value={gName}
                  onChange={(e) => setGName(e.target.value)}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-2.5 bg-white dark:bg-gray-950 text-sm outline-none transition",
                    "border-zinc-200 dark:border-zinc-800",
                    "focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/20"
                  )}
                  placeholder="e.g., Home Garage"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
                  Address (optional)
                </label>
                <input
                  value={gAddress}
                  onChange={(e) => setGAddress(e.target.value)}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-2.5 bg-white dark:bg-gray-950 text-sm outline-none transition",
                    "border-zinc-200 dark:border-zinc-800",
                    "focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/20"
                  )}
                  placeholder="Street / Zone / City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
                  Notes (optional)
                </label>
                <textarea
                  value={gNotes}
                  onChange={(e) => setGNotes(e.target.value)}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-2.5 bg-white dark:bg-gray-950 text-sm outline-none transition min-h-[90px]",
                    "border-zinc-200 dark:border-zinc-800",
                    "focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/20"
                  )}
                  placeholder="Any notes about this garage..."
                />
              </div>

              {/* Select vehicles */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Add existing vehicles (optional)
                  </label>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Unassigned only
                  </span>
                </div>

                {myVehicles.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3 text-sm text-zinc-600 dark:text-zinc-300">
                    No available vehicles to add.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    {myVehicles.map((v) => {
                      const checked = selectedVehicleIds.includes(v.id);
                      return (
                        <label
                          key={v.id}
                          className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 border-zinc-200 dark:border-zinc-800
                                     cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setSelectedVehicleIds((prev) =>
                                checked
                                  ? prev.filter((id) => id !== v.id)
                                  : [...prev, v.id]
                              );
                            }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                              {v.name}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                              {v.model}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add users */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Add users to this garage (optional)
                </label>

                <div className="flex gap-2">
                  <input
                    value={userSearchEmail}
                    onChange={(e) => setUserSearchEmail(e.target.value)}
                    className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 px-4 py-2.5
                               bg-white dark:bg-gray-950 text-sm outline-none transition
                               focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/20"
                    placeholder="Enter user email"
                  />
                  <button
                    type="button"
                    onClick={searchUserByEmail}
                    disabled={userSearchLoading || !userSearchEmail.trim()}
                    className="rounded-2xl px-4 py-2.5 text-sm font-semibold
                               border border-zinc-200 dark:border-zinc-800
                               hover:bg-zinc-50 dark:hover:bg-zinc-800 transition
                               disabled:opacity-60"
                  >
                    {userSearchLoading ? "Searching..." : "Add"}
                  </button>
                </div>

                {userSearchError && (
                  <p className="text-xs text-red-500">{userSearchError}</p>
                )}

                {members.length > 0 && (
                  <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    {members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 border-zinc-200 dark:border-zinc-800"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                            {m.displayName || "User"}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {m.email}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setMembers((prev) => prev.filter((x) => x.id !== m.id))
                          }
                          className="text-sm font-semibold text-rose-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCreate}
                  disabled={creating}
                  className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 text-sm
                             hover:bg-zinc-50 dark:hover:bg-zinc-800 transition disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-2xl text-white px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60
                             bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
