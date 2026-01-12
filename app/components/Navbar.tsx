"use client";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md px-4 py-3 fixed w-full z-50">
      <div className="flex justify-between items-center max-w-md mx-auto">
        <h1 className="text-xl font-bold">Autocare</h1>
        <button className="sm:hidden" onClick={() => setOpen(!open)}>
          ☰
        </button>
        <nav className={`sm:flex flex-col sm:flex-row gap-3 absolute sm:static bg-white sm:bg-transparent w-full left-0 sm:w-auto p-4 sm:p-0 top-12 ${open ? "block" : "hidden"} shadow sm:shadow-none`}>
          <Link href="/vehicles" className="hover:text-blue-600 dark:hover:text-blue-400 block">Vehicles</Link>
          <Link href="/services" className="hover:text-blue-600 dark:hover:text-blue-400 block">Service History</Link>
          <Link href="/upcoming" className="hover:text-blue-600 dark:hover:text-blue-400 block">Upcoming</Link>
        </nav>
      </div>
    </header>
  );
}