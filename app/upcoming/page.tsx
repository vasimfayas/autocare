const upcomingServices = [
    { vehicle: "Toyota Corolla", service: "Tire Rotation", due: "2025-03-01" },
    { vehicle: "Honda Civic", service: "Oil Change", due: "2025-03-15" },
  ];
  
  export default function UpcomingPage() {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">Upcoming Maintenance</h1>
        <ul className="space-y-4">
          {upcomingServices.map((u, index) => (
            <li key={index} className="border p-4 rounded hover:shadow-md transition">
              <p className="font-semibold">{u.vehicle}</p>
              <p>{u.service}</p>
              <p className="text-sm text-zinc-500">Due: {u.due}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  }