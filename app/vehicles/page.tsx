"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  id: string; // Firestore doc id
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

export default function VehiclesPage() {
  // Vehicles from DB
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  // Selection
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ServiceForm>(initialForm);
  const [errors, setErrors] = useState<{ [K in keyof ServiceForm]?: string }>({});
  const [savingLog, setSavingLog] = useState(false);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  // 1) Read vehicles from Firestore (real-time)
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

        // Keep selectedIndex valid when list changes
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

  const selectedVehicle = useMemo(() => vehicles[selectedIndex], [vehicles, selectedIndex]);

  const handlers = useSwipeable({
    onSwipedLeft: () => setSelectedIndex((prev) => Math.min(prev + 1, Math.max(vehicles.length - 1, 0))),
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

  // Close modal on ESC + focus + lock scroll
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

  // Close modal on outside click
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

  // 2) Save service log into vehicles/{vehicleId}/serviceLogs
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    if (!validate()) return;

    try {
      setSavingLog(true);

      await addDoc(collection(db, "vehicles", selectedVehicle.id, "serviceLogs"), {
        vehicleId: selectedVehicle.id, // keep for convenience
        vehicleName: selectedVehicle.name, // optional, helps display without joins
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

  return (
    <div className="min-h-[calc(100vh-56px)]">
      {/* Gradient header (modern mobile feel) */}
      <div className="sticky top-14 z-10">
        <div className="mx-auto max-w-md px-4 pt-5 pb-4">
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-700 bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
            <div className="px-5 py-4">
              <p className="text-xs/5 opacity-90">Garage</p>
              <h1 className="text-xl font-semibold tracking-tight">
                Vehicles
              </h1>
              <p className="mt-1 text-xs/5 opacity-90">
                Swipe to switch • Tap + to add service log
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md my-12 mx-auto px-4 pb-28">
        {/* Vehicles row */}
        <div {...handlers} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {loadingVehicles &&
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[210px] h-[120px] rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-gray-900 shadow-sm animate-pulse"
              />
            ))}

          {!loadingVehicles && vehicles.length === 0 && (
            <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-gray-900 p-5 text-sm text-zinc-600 dark:text-zinc-300">
              No vehicles yet. Add one from <span className="font-medium">Add Vehicle</span>.
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
                  className={[
                    "min-w-[210px] text-left rounded-2xl p-4 shadow-sm border transition",
                    "bg-white dark:bg-gray-900",
                    active
                      ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-500/20"
                      : "border-zinc-200 dark:border-zinc-700 hover:shadow-md",
                  ].join(" ")}
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
                    <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-200">
                      🚗
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>Last service</span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">
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
                className={[
                  "h-2 rounded-full transition-all",
                  index === selectedIndex
                    ? "w-6 bg-blue-600"
                    : "w-2 bg-zinc-300 dark:bg-zinc-600",
                ].join(" ")}
              />
            ))}
          </div>
        )}

        {/* Selected vehicle details */}
        {selectedVehicle && (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-gray-900 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {selectedVehicle.name}
                </h2>
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

        {/* Floating button */}
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
                     focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          +
        </button>

        {/* Modal */}
        {isModalOpen && selectedVehicle && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/45" />

            <div
              ref={modalRef}
              className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-700"
            >
              <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
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
                    className={`w-full rounded-xl border px-4 py-2.5 bg-white dark:bg-gray-950 text-sm outline-none transition
                      ${
                        errors.serviceType
                          ? "border-red-500"
                          : "border-zinc-200 dark:border-zinc-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/20"
                      }`}
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
                    className={`w-full rounded-xl border px-4 py-2.5 bg-white dark:bg-gray-950 text-sm outline-none transition
                      ${
                        errors.date
                          ? "border-red-500"
                          : "border-zinc-200 dark:border-zinc-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/20"
                      }`}
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
                      className={`w-full rounded-xl border px-4 py-2.5 bg-white dark:bg-gray-950 text-sm outline-none transition
                        ${
                          errors.km
                            ? "border-red-500"
                            : "border-zinc-200 dark:border-zinc-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/20"
                        }`}
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
                      className={`w-full rounded-xl border px-4 py-2.5 bg-white dark:bg-gray-950 text-sm outline-none transition
                        ${
                          errors.price
                            ? "border-red-500"
                            : "border-zinc-200 dark:border-zinc-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/20"
                        }`}
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
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 bg-white dark:bg-gray-950 text-sm outline-none transition min-h-[90px]
                               focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/20"
                    placeholder="Notes, parts used, garage name, warranty, etc."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={savingLog}
                    className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm
                               hover:bg-zinc-50 dark:hover:bg-zinc-800 transition disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingLog}
                    className="flex-1 rounded-xl text-white px-4 py-2.5 text-sm font-medium transition disabled:opacity-60
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
