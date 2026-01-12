"use client";
import { useParams } from "next/navigation";

// Mock data
const mockVehicles = [
  { id: "1", name: "Toyota Corolla", model: "2020", lastService: "2025-01-01" },
  { id: "2", name: "Honda Civic", model: "2019", lastService: "2025-02-10" },
  { id: "3", name: "Ford F-150", model: "2021", lastService: "2024-12-20" },
];

export default function VehicleDetailPage() {
  const params = useParams();
  const vehicle = mockVehicles.find((v) => v.id === params.id);

  if (!vehicle) return <div className="p-6">Vehicle not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-4">{vehicle.name}</h1>
      <p className="text-lg mb-2">Model: {vehicle.model}</p>
      <p className="text-lg mb-6">Last Service: {vehicle.lastService}</p>

      <h2 className="text-2xl font-semibold mb-4">Service History</h2>
      <ul className="space-y-2">
        <li className="border p-3 rounded">Oil change - 2025-01-01</li>
        <li className="border p-3 rounded">Tire rotation - 2024-12-01</li>
      </ul>
    </div>
  );
}