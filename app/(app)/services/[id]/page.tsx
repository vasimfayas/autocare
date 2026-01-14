"use client";
import { useParams } from "next/navigation";

const services = [
  { id: "1", vehicle: "Toyota Corolla", service: "Oil Change", date: "2025-01-01", cost: "$50", notes: "Changed oil and filter" },
  { id: "2", vehicle: "Honda Civic", service: "Brake Pads", date: "2025-02-10", cost: "$120", notes: "Front pads replaced" },
];

export default function ServiceDetailPage() {
  const params = useParams();
  const service = services.find((s) => s.id === params.id);

  if (!service) return <div className="p-6">Service not found</div>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-4">{service.service}</h1>
      <p className="mb-2">Vehicle: {service.vehicle}</p>
      <p className="mb-2">Date: {service.date}</p>
      <p className="mb-2">Cost: {service.cost}</p>
      <p className="mb-4">Notes: {service.notes}</p>
    </div>
  );
}