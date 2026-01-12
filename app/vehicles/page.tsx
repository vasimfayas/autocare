"use client";

import { useEffect, useRef, useState } from "react";
import { useSwipeable } from "react-swipeable";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase"; // or "@/lib/firebase" depending on where you put it


interface Vehicle {
  id: number;
  name: string;
  model: string;
  lastService: string;
}

const vehicles: Vehicle[] = [
  { id: 1, name: "Toyota Corolla", model: "2020", lastService: "2025-01-01" },
  { id: 2, name: "Honda Civic", model: "2019", lastService: "2025-02-10" },
  { id: 3, name: "Ford F-150", model: "2021", lastService: "2024-12-20" },
  { id: 4, name: "BMW X5", model: "2022", lastService: "2025-01-15" },
];

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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedVehicle = vehicles[selectedIndex];

  const handlers = useSwipeable({
    onSwipedLeft: () => setSelectedIndex((prev) => Math.min(prev + 1, vehicles.length - 1)),
    onSwipedRight: () => setSelectedIndex((prev) => Math.max(prev - 1, 0)),
    trackMouse: true,
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ServiceForm>(initialForm);
  const [errors, setErrors] = useState<{ [K in keyof ServiceForm]?: string }>({});
  const modalRef = useRef<HTMLDivElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  const openModal = () => {
    setIsModalOpen(true);
    setErrors({});
    // Optional: prefill date with today
    setForm((prev) => ({ ...prev, date: prev.date || new Date().toISOString().slice(0, 10) }));
  };

  const closeModal = () => setIsModalOpen(false);

  // Close on ESC + focus first input
  useEffect(() => {
    if (!isModalOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };

    document.addEventListener("keydown", onKeyDown);

    // focus after open
    setTimeout(() => firstInputRef.current?.focus(), 0);

    // lock scroll
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  // Close on outside click
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
    // description optional

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Build payload (convert numeric strings)
    const payload = {
      vehicleId: selectedVehicle.id,
      serviceType: form.serviceType.trim(),
      date: form.date,
      km: Number(form.km),
      price: Number(form.price),
      description: form.description.trim(),
    };

    console.log("NEW SERVICE LOG:", payload);

    // TODO: send to API / store in DB
    await addDoc(collection(db, "serviceLogs"), {
        vehicleId: selectedVehicle.id,
        serviceType: form.serviceType.trim(),
        date: form.date,
        km: Number(form.km),
        price: Number(form.price),
        description: form.description.trim(),
        createdAt: serverTimestamp(),
      });
    setForm(initialForm);
    closeModal();
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20 pb-28">
      {/* Horizontal Scroll Cards with swipe detection */}
      <div {...handlers} className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        {vehicles.map((v, index) => (
          <div
            key={v.id}
            onClick={() => setSelectedIndex(index)}
            className={`min-w-[180px] p-4 rounded-xl shadow flex-shrink-0 cursor-pointer transition-transform transform m-4
              ${index === selectedIndex ? "border-2 border-blue-600 scale-105 " : "border border-gray-200 dark:border-gray-700"}`}
          >
            <h3 className="font-semibold">{v.name}</h3>
            <p className="text-sm text-zinc-500">{v.model}</p>
            <p className="text-xs text-zinc-400 mt-1">Last service: {v.lastService}</p>
          </div>
        ))}
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center space-x-2 my-2">
        {vehicles.map((_, index) => (
          <span
            key={index}
            className={`h-2 w-2 rounded-full transition-all ${
              index === selectedIndex ? "bg-blue-600 w-4" : "bg-gray-300 dark:bg-gray-600"
            }`}
          />
        ))}
      </div>

      {/* Top Detail Box */}
      <div className="p-4 bg-blue-50 dark:bg-gray-800 rounded-xl mb-4 shadow transition-all duration-300">
        <h2 className="text-xl font-bold">{selectedVehicle.name}</h2>
        <p className="text-sm text-zinc-500">Model: {selectedVehicle.model}</p>
        <p className="text-sm text-zinc-500">Last Service: {selectedVehicle.lastService}</p>
      </div>

      {/* Floating Action Button */}
      <button
        type="button"
        aria-label="Add new service log"
        onClick={openModal}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg
                   flex items-center justify-center text-2xl hover:bg-blue-700 active:scale-95 transition
                   focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        +
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Panel */}
          <div
            ref={modalRef}
            className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700"
          >
            <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Add Service Log</h3>
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

            <form onSubmit={onSubmit} className="px-5 py-4 space-y-4">
              {/* Service type */}
              <div>
                <label className="block text-sm font-medium mb-1">Service Type</label>
                <input
                  ref={firstInputRef}
                  value={form.serviceType}
                  onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                  className={`w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-950
                    ${errors.serviceType ? "border-red-500" : "border-zinc-200 dark:border-zinc-700"}`}
                  placeholder="e.g., Oil change"
                />
                {errors.serviceType && <p className="text-xs text-red-500 mt-1">{errors.serviceType}</p>}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className={`w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-950
                    ${errors.date ? "border-red-500" : "border-zinc-200 dark:border-zinc-700"}`}
                />
                {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
              </div>

              {/* KM + Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">KM</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={form.km}
                    onChange={(e) => setForm({ ...form, km: e.target.value })}
                    className={`w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-950
                      ${errors.km ? "border-red-500" : "border-zinc-200 dark:border-zinc-700"}`}
                    placeholder="e.g., 84500"
                  />
                  {errors.km && <p className="text-xs text-red-500 mt-1">{errors.km}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className={`w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-950
                      ${errors.price ? "border-red-500" : "border-zinc-200 dark:border-zinc-700"}`}
                    placeholder="e.g., 120.00"
                  />
                  {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-gray-950 min-h-[90px]"
                  placeholder="Notes, parts used, garage name, warranty, etc."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
