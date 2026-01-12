"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click / tap
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Close on Escape + lock scroll when open
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    if (open) {
      document.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/90 dark:bg-gray-900/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-700">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-3">
      <Image
    src="/assets/logo2.png"
    alt="Autocare logo"
    width={32}
    height={32}
    priority
  />
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Autocare
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6 text-sm">
          <Link className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors" href="/vehicles">
            Vehicles
          </Link>
          <Link className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors" href="/services">
            Service History
          </Link>
          <Link className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors" href="/upcoming">
            Upcoming
          </Link>
        </nav>

        {/* Mobile button */}
        <button
          type="button"
          className="sm:hidden inline-flex items-center justify-center rounded-md px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile overlay + dropdown */}
      {open && (
        <div className="sm:hidden fixed inset-0 z-50">
          {/* overlay (tap anywhere closes due to outside click handler too) */}
          <div className="absolute inset-0 bg-black/30" />

          {/* panel */}
          <div
            ref={menuRef}
            className="absolute top-14 left-0 right-0 mx-auto max-w-6xl bg-white dark:bg-gray-900 border-t border-zinc-200 dark:border-zinc-700 shadow-lg"
          >
            <nav className="px-4 py-4 flex flex-col gap-3 text-sm">
              <Link
                href="/vehicles"
                onClick={closeMenu}
                className="rounded-md px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Vehicles
              </Link>
              <Link
                href="/services"
                onClick={closeMenu}
                className="rounded-md px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Service History
              </Link>
              <Link
                href="/upcoming"
                onClick={closeMenu}
                className="rounded-md px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Upcoming
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
