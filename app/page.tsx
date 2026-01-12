import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-gray-900 font-sans">
    


      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center text-center py-32 px-6">
        <h2 className="text-4xl sm:text-5xl font-bold text-black dark:text-white mb-6">
          Track Your Vehicle Maintenance with Ease
        </h2>
        <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl">
          Autocare helps you monitor your vehicle’s service history, repair costs, and upcoming maintenance all in one place.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/vehicles/new"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-500 transition">
              Add Vehicle
          
          </Link>
          <Link href="/services"
             className="px-6 py-3 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition">
              View Service History
            
          </Link>
        </div>

        {/* Illustration / Image */}
        <div className="mt-16">
          <Image
            src="/car-illustration.svg" // Add your illustration in public/
            alt="Vehicle Illustration"
            width={400}
            height={250}
          />
        </div>
      </main>

  
    </div>
  );
}