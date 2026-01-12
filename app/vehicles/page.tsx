"use client";

import { useState } from "react";
import { useSwipeable } from "react-swipeable";

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

export default function VehiclesPage() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectedVehicle = vehicles[selectedIndex];

  const handlers = useSwipeable({
    onSwipedLeft: () => setSelectedIndex((prev) => Math.min(prev + 1, vehicles.length - 1)),
    onSwipedRight: () => setSelectedIndex((prev) => Math.max(prev - 1, 0)),
    trackMouse: true, // optional: allows swipe with mouse on desktop
  });

  return (
    <div className="max-w-md mx-auto px-4 py-20">
           {/* Horizontal Scroll Cards with swipe detection */}
           <div {...handlers} className="flex space-x-4 overflow-x-auto  pb-4 scrollbar-hide">
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

  

      
    </div>
  );
}