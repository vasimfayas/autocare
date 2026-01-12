import Link from "next/link";

export default function Home() {
  // Dummy data (later replace with Firestore)
  const stats = {
    vehicles: 4,
    services: 12,
    totalCost: 3480,
    upcoming: 2,
  };

  const recent = [
    { id: 1, vehicle: "Toyota Corolla", title: "Oil Change", date: "2025-01-01", cost: 180 },
    { id: 2, vehicle: "BMW X5", title: "Brake Pads", date: "2025-02-10", cost: 950 },
    { id: 3, vehicle: "Ford F-150", title: "Tire Rotation", date: "2024-12-20", cost: 120 },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-gray-900 font-sans">
      {/* Top gradient band */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-fuchsia-600 opacity-95" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />

        <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-12 text-white">
          <p className="text-xs/5 opacity-90">Carcare</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">
            Maintenance made simple.
          </h1>
          <p className="mt-4 max-w-2xl text-white/85 text-base sm:text-lg">
            Track service history, costs, and upcoming maintenance — all in one place.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/vehicles/new"
              className="inline-flex items-center justify-center rounded-xl bg-white text-zinc-900 px-6 py-3 text-sm font-medium shadow-sm
                         hover:bg-white/90 transition"
            >
              + Add Vehicle
            </Link>

            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-xl border border-white/30 px-6 py-3 text-sm font-medium
                         hover:bg-white/10 transition"
            >
              View Service History
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl mt-4 px-6 pb-14 -mt-8">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Vehicles"
            value={stats.vehicles}
            sub="Tracked in garage"
            badge="Live soon"
          />
          <StatCard
            title="Services"
            value={stats.services}
            sub="Total logs"
            badge="This year"
          />
          <StatCard
            title="Total Cost"
            value={`QAR ${stats.totalCost.toLocaleString()}`}
            sub="Spent on maintenance"
            badge="Estimate"
          />
          <StatCard
            title="Upcoming"
            value={stats.upcoming}
            sub="Reminders due"
            badge="Next 30d"
          />
        </div>

        {/* Recent activity + quick actions */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent */}
          <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white shadow-sm dark:bg-gray-900 dark:border-zinc-700">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                  Recent Service Logs
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Dummy data for now — we’ll connect Firestore later.
                </p>
              </div>
              <Link
                href="/services"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                See all
              </Link>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {recent.map((r) => (
                <div key={r.id} className="p-5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                      {r.title}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {r.vehicle} • {r.date}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      QAR {r.cost.toLocaleString()}
                    </p>
                    <span className="inline-flex mt-1 text-[11px] px-2 py-1 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                      Completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:bg-gray-900 dark:border-zinc-700">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                Quick Actions
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Jump straight into what you need.
              </p>
            </div>

            <div className="p-5 space-y-3">
              <QuickAction
                href="/vehicles"
                title="View Vehicles"
                desc="Swipe cards & add service logs"
              />
              <QuickAction
                href="/vehicles/new"
                title="Add a Vehicle"
                desc="Name, model, last service date"
              />
              <QuickAction
                href="/upcoming"
                title="Upcoming Maintenance"
                desc="Reminders and due dates"
              />
            </div>

            <div className="p-5 pt-0">
              <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-4 shadow-sm">
                <p className="text-sm font-semibold">Tip</p>
                <p className="text-xs text-white/85 mt-1">
                  Add KM + price to every log — you’ll get clean cost summaries later.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Small footer note */}
        <p className="mt-8 text-xs text-zinc-500 dark:text-zinc-400">
          Next: connect these stats to Firestore (vehicles + serviceLogs) and compute totals.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  badge,
}: {
  title: string;
  value: string | number;
  sub: string;
  badge: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:bg-gray-900 dark:border-zinc-700">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
          <span className="text-[11px] px-2 py-1 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            {badge}
          </span>
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          {value}
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4
                 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
    >
      <p className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{desc}</p>
    </Link>
  );
}
