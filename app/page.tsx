"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSwipeable } from "react-swipeable";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";

type Vehicle = {
  id: string;
  name: string;
  model: string;
  lastService: string; // "YYYY-MM-DD"
  createdAt?: any;
};

type ServiceForm = {
  serviceType: string;
  date: string;
  km: string;
  price: string;
  description: string;
};

const initialForm: ServiceForm = {
  serviceType: "",
  date: "",
  km: "",
  price: "",
  description: "",
};

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function initials(name?: string) {
  if (!name) return "U";
  const p = name.trim().split(/\s+/).slice(0, 2);
  return (p.map((x) => x[0]?.toUpperCase()).join("") || "U").slice(0, 2);
}

/** tiny inline icons (no dependencies) */
function Icon({
  children,
  className = "h-5 w-5",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center justify-center", className)}>
      {children}
    </span>
  );
}

export default function HomeLandingPage() {
  const router = useRouter();

  // Vehicles from DB
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  // Selection
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ServiceForm>(initialForm);
  const [errors, setErrors] = useState<{ [K in keyof ServiceForm]?: string }>(
    {}
  );
  const [savingLog, setSavingLog] = useState(false);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  // Replace with your auth user values
  const userName = "Kaixa";
  const notificationsCount = 2;

  // Read vehicles (real-time)
  useEffect(() => {
    const q = query(collection(db, "vehicles"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data: Vehicle[] = snap.docs.map((d) => {
          const v = d.data() as Omit<Vehicle, "id">;
          return { id: d.id, ...v };
        });

        setVehicles(data);
        setLoadingVehicles(false);

        setSelectedIndex((prev) => {
          if (data.length === 0) return 0;
          return Math.min(prev, data.length - 1);
        });
      },
      (err) => {
        console.error("Vehicles read error:", err);
        setLoadingVehicles(false);
      }
    );

    return () => unsub();
  }, []);

  const selectedVehicle = useMemo(
    () => vehicles[selectedIndex],
    [vehicles, selectedIndex]
  );

  const handlers = useSwipeable({
    onSwipedLeft: () =>
      setSelectedIndex((prev) =>
        Math.min(prev + 1, Math.max(vehicles.length - 1, 0))
      ),
    onSwipedRight: () => setSelectedIndex((prev) => Math.max(prev - 1, 0)),
    trackMouse: true,
  });

  const openModal = () => {
    if (!selectedVehicle) return;
    setIsModalOpen(true);
    setErrors({});
    setForm((prev) => ({
      ...prev,
      date: prev.date || new Date().toISOString().slice(0, 10),
    }));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setErrors({});
    setSavingLog(false);
  };

  // Modal: ESC + lock scroll + focus
  useEffect(() => {
    if (!isModalOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    setTimeout(() => firstInputRef.current?.focus(), 0);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  // Modal: outside click
  useEffect(() => {
    if (!isModalOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (modalRef.current && !modalRef.current.contains(target)) closeModal();
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isModalOpen]);

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!form.serviceType.trim()) nextErrors.serviceType = "Service type is required.";
    if (!form.date) nextErrors.date = "Date is required.";
    if (!form.km) nextErrors.km = "KM is required.";
    if (!form.price) nextErrors.price = "Price is required.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // Save service log
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    if (!validate()) return;

    try {
      setSavingLog(true);

      await addDoc(collection(db, "vehicles", selectedVehicle.id, "serviceLogs"), {
        vehicleId: selectedVehicle.id,
        vehicleName: selectedVehicle.name,
        serviceType: form.serviceType.trim(),
        date: form.date,
        km: Number(form.km),
        price: Number(form.price),
        description: form.description.trim(),
        createdAt: serverTimestamp(),
      });

      setForm(initialForm);
      closeModal();
    } catch (err) {
      console.error("Add service log error:", err);
      setSavingLog(false);
    }
  };

  const menu = [
    { label: "Service Logs", emoji: "🧾", onClick: () => router.push("/service-logs") },
    { label: "Add Car", emoji: "➕", onClick: () => router.push("/add-vehicle") },
    { label: "Statements", emoji: "📄", onClick: () => router.push("/statements") },
    { label: "Documents", emoji: "📁", onClick: () => router.push("/documents") },
    { label: "Chatbot", emoji: "🤖", onClick: () => router.push("/chatbot") },
    { label: "Other", emoji: "⋯", onClick: () => router.push("/other") },
  ];

  return (
    <div className="min-h-[calc(100vh-56px)] bg-zinc-50 dark:bg-gray-950">
      {/* HERO / TOP */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 12%, rgba(255,255,255,.55) 0, rgba(255,255,255,0) 32%), radial-gradient(circle at 85% 18%, rgba(255,255,255,.35) 0, rgba(255,255,255,0) 36%)",
          }}
        />

        <div className="relative mx-auto max-w-md px-4 pt-6 pb-28">
          {/* Greeting row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="h-12 w-12 rounded-full bg-white/20 ring-1 ring-white/30 flex items-center justify-center text-white font-semibold"
                onClick={() => router.push("/profile")}
                aria-label="Open profile"
              >
                {initials(userName)}
              </button>

              <div className="text-white">
                <p className="text-sm/5 opacity-90">Hi {userName},</p>
                <p className="text-lg font-semibold tracking-tight">
                  Welcome back!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Search"
                className="h-10 w-10 rounded-full bg-white/15 hover:bg-white/20 ring-1 ring-white/20 flex items-center justify-center text-white transition"
                onClick={() => router.push("/search")}
              >
                <Icon>🔍</Icon>
              </button>

              <button
                type="button"
                aria-label="Notifications"
                className="relative h-10 w-10 rounded-full bg-white/15 hover:bg-white/20 ring-1 ring-white/20 flex items-center justify-center text-white transition"
                onClick={() => router.push("/notifications")}
              >
                <Icon>🔔</Icon>
                {notificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-rose-500 text-[11px] font-semibold flex items-center justify-center">
                    {notificationsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* MENU GRID */}
          <div className="mt-6 rounded-3xl bg-white dark:bg-gray-900 shadow-sm border border-white/30 dark:border-zinc-800 overflow-hidden">
            <div className="grid grid-cols-3">
              {menu.map((item, idx) => {
                const isRightEdge = (idx + 1) % 3 === 0;
                const isBottomRow = idx >= 3;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    className={cn(
                      "p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition",
                      !isRightEdge && "border-r border-zinc-100 dark:border-zinc-800",
                      !isBottomRow && "border-b border-zinc-100 dark:border-zinc-800"
                    )}
                  >
                    <div className="flex flex-col items-start gap-2">
                      <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                        <span className="text-lg">{item.emoji}</span>
                      </div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                        {item.label}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* white cut */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-zinc-50 dark:bg-gray-950 rounded-t-[32px]" />
      </div>

      {/* BELOW HERO */}
      <div className="mx-auto max-w-md px-4 pb-28 -mt-6">
        {/* Vehicles header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            My Vehicles
          </h2>

          <button
            type="button"
            className="text-sm font-medium text-blue-600 dark:text-blue-300"
            onClick={() => router.push("/vehicles")}
          >
            View all →
          </button>
        </div>

        {/* Vehicles row */}
        <div {...handlers} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {loadingVehicles &&
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[230px] h-[135px] rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-gray-900 shadow-sm animate-pulse"
              />
            ))}

          {!loadingVehicles && vehicles.length === 0 && (
            <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-gray-900 p-5 text-sm text-zinc-600 dark:text-zinc-300">
              No vehicles yet. Add one from <span className="font-semibold">Add Car</span>.
            </div>
          )}

          {!loadingVehicles &&
            vehicles.map((v, index) => {
              const active = index === selectedIndex;
              return (
                <button
                  type="button"
                  key={v.id}
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    "min-w-[230px] text-left rounded-3xl p-4 border shadow-sm transition",
                    "bg-white dark:bg-gray-900",
                    active
                      ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-500/20"
                      : "border-zinc-200 dark:border-zinc-800 hover:shadow-md"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                        {v.name}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Model • {v.model}
                      </p>
                    </div>

                    <div className="h-10 w-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      🚗
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>Last service</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                      {v.lastService || "-"}
                    </span>
                  </div>
                </button>
              );
            })}
        </div>

        {/* Dots */}
        {!loadingVehicles && vehicles.length > 0 && (
          <div className="flex justify-center gap-2 my-4">
            {vehicles.map((_, index) => (
              <span
                key={index}
                className={cn(
                  "h-2 rounded-full transition-all",
                  index === selectedIndex ? "w-6 bg-blue-600" : "w-2 bg-zinc-300 dark:bg-zinc-700"
                )}
              />
            ))}
          </div>
        )}

        {/* Optional “selected vehicle quick details” */}
        {selectedVehicle && (
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-gray-900 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                  {selectedVehicle.name}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  Model: {selectedVehicle.model}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  Last service: {selectedVehicle.lastService || "-"}
                </p>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-3 py-2 text-xs shadow-sm">
                Active
              </div>
            </div>
          </div>
        )}

        {/* Floating button: Add Service Log */}
        <button
          type="button"
          aria-label="Add new service log"
          onClick={openModal}
          disabled={!selectedVehicle}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full text-white shadow-lg
                     bg-gradient-to-br from-blue-600 to-indigo-600
                     flex items-center justify-center text-2xl
                     active:scale-95 transition
                     disabled:opacity-50 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
        >
          +
        </button>

        {/* Modal */}
        {isModalOpen && selectedVehicle && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/45" />

            <div
              ref={modalRef}
              className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800"
            >
              <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                    Add Service Log
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {selectedVehicle.name} • {selectedVehicle.model}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-9 w-9 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center justify-center"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={onSubmit} className="px-5 py-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
                    Service Type
                  </label>
                  <input
                    ref={firstInputRef}
                    value={form.serviceType}
                    onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-2.5 bg-white dark:bg-gray-950 text-sm outline-none transition",
                      errors.serviceType
                        ? "border-red-500"
                        : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/20"
                    )}
                    placeholder="e.g., Oil change"
                  />
                  {errors.serviceType && (
                    <p className="text-xs text-red-500 mt-1">{errors.serviceType}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
                    Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-2.5 bg-white dark:bg-gray-950 text-sm outline-none transition",
                      errors.date
                        ? "border-red-500"
                        : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/20"
                    )}
                  />
                  {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
                      KM
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={form.km}
                      onChange={(e) => setForm({ ...form, km: e.target.value })}
                      className={cn(
                        "w-full rounded-2xl border px-4 py-2.5 bg-white dark:bg-gray-950 text-sm outline-none transition",
                        errors.km
                          ? "border-red-500"
                          : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/20"
                      )}
                      placeholder="84500"
                    />
                    {errors.km && <p className="text-xs text-red-500 mt-1">{errors.km}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
                      Price
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className={cn(
                        "w-full rounded-2xl border px-4 py-2.5 bg-white dark:bg-gray-950 text-sm outline-none transition",
                        errors.price
                          ? "border-red-500"
                          : "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/20"
                      )}
                      placeholder="120.00"
                    />
                    {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
                    Description (optional)
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 bg-white dark:bg-gray-950 text-sm outline-none transition min-h-[90px]
                               focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/20"
                    placeholder="Notes, parts used, garage name, warranty, etc."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={savingLog}
                    className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 text-sm
                               hover:bg-zinc-50 dark:hover:bg-zinc-800 transition disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingLog}
                    className="flex-1 rounded-2xl text-white px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60
                               bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {savingLog ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
