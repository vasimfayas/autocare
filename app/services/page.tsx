import Link from "next/link";

const services = [
  { id: 1, vehicle: "Toyota Corolla", service: "Oil Change", date: "2025-01-01" },
  { id: 2, vehicle: "Honda Civic", service: "Brake Pads", date: "2025-02-10" },
];

export default function ServicesPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Service History</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {services.map((s) => (
          <Link key={s.id} href={`/services/${s.id}`}
            className="border p-4 rounded hover:shadow-md transition">
              <p className="font-semibold">{s.vehicle}</p>
              <p>{s.service}</p>
              <p className="text-sm text-zinc-500">{s.date}</p>
           
          </Link>
        ))}
      </div>
    </div>
  );
}