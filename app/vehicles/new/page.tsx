"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddVehiclePage() {
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [lastService, setLastService] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ name, model, lastService });
    alert("Vehicle added! (mock)");
    router.push("/vehicles");
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Add New Vehicle</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Vehicle Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Model / Year</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Last Service Date</label>
          <input
            type="date"
            value={lastService}
            onChange={(e) => setLastService(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
        >
          Add Vehicle
        </button>
      </form>
    </div>
  );
}