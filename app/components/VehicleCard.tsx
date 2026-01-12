interface VehicleCardProps {
    name: string;
    model: string;
    lastService: string;
  }
  
  export default function VehicleCard({ name, model, lastService }: VehicleCardProps) {
    return (
      <div className="p-4 border rounded-lg shadow hover:shadow-md transition w-full bg-white dark:bg-gray-800">
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-sm text-zinc-500">{model}</p>
        <p className="text-xs text-zinc-400 mt-1">Last service: {lastService}</p>
      </div>
    );
  }