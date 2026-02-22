import { useState } from "react";
import { MapPin, Navigation, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import mapBg from "@/assets/map-bg.jpg";

interface ResourcePin {
  id: string;
  type: "food" | "health" | "community";
  label: string;
  x: number;
  y: number;
  detail: string;
  tags: string[];
}

const PINS: ResourcePin[] = [
  { id: "1", type: "food", label: "Ward 8 Food Pantry", x: 35, y: 55, detail: "Open Mon-Fri 9am-5pm", tags: ["Accepts EBT", "No ID Required"] },
  { id: "2", type: "health", label: "Unity Health Clinic", x: 55, y: 40, detail: "Walk-ins accepted, Medicaid OK", tags: ["Accepts EBT"] },
  { id: "3", type: "community", label: "Community Fridge", x: 62, y: 65, detail: "24/7 access, community-verified", tags: ["No ID Required"] },
  { id: "4", type: "food", label: "SNAP Enrollment Center", x: 28, y: 38, detail: "Help with 2026 applications", tags: ["Student Discounts"] },
  { id: "5", type: "health", label: "Mobile Health Van", x: 72, y: 48, detail: "Tues & Thurs, 10am-4pm", tags: ["No ID Required"] },
  { id: "6", type: "community", label: "Howard Student Aid Hub", x: 48, y: 30, detail: "Textbooks, meals, mentoring", tags: ["Student Discounts"] },
  { id: "7", type: "food", label: "Martha's Table", x: 42, y: 72, detail: "Hot meals daily, no questions asked", tags: ["No ID Required"] },
  { id: "8", type: "health", label: "Ward 7 Wellness Center", x: 78, y: 35, detail: "Mental health + primary care", tags: ["Accepts EBT"] },
];

const HEAT_ZONES = [
  { x: 30, y: 50, size: 180, opacity: 0.35 },
  { x: 65, y: 60, size: 140, opacity: 0.25 },
  { x: 45, y: 70, size: 160, opacity: 0.3 },
  { x: 75, y: 45, size: 120, opacity: 0.2 },
];

const pinColors = {
  food: "bg-pin-food",
  health: "bg-pin-health",
  community: "bg-pin-community",
};

const pinRingColors = {
  food: "ring-pin-food",
  health: "ring-pin-health",
  community: "ring-pin-community",
};

interface MapDashboardProps {
  activeFilters: string[];
}

const MapDashboard = ({ activeFilters }: MapDashboardProps) => {
  const [selectedPin, setSelectedPin] = useState<ResourcePin | null>(null);
  const isMobile = useIsMobile();

  const filteredPins = activeFilters.length === 0
    ? PINS
    : PINS.filter(p => p.tags.some(t => activeFilters.includes(t)));

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Map background */}
      <img
        src={mapBg}
        alt="Washington DC aerial map"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Light overlay */}
      <div className="absolute inset-0 bg-background/30" />

      {/* Heat zones */}
      {HEAT_ZONES.map((zone, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-pulse-slow pointer-events-none"
          style={{
            left: `${zone.x}%`,
            top: `${zone.y}%`,
            width: zone.size,
            height: zone.size,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, hsla(0, 85%, 55%, ${zone.opacity}) 0%, hsla(30, 90%, 50%, ${zone.opacity * 0.5}) 50%, transparent 70%)`,
          }}
        />
      ))}

      {/* Resource Pins */}
      {filteredPins.map((pin) => (
        <button
          key={pin.id}
          className={`absolute z-10 group cursor-pointer`}
          style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: "translate(-50%, -50%)" }}
          onClick={() => setSelectedPin(selectedPin?.id === pin.id ? null : pin)}
        >
          <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${pinColors[pin.type]} ring-2 ${pinRingColors[pin.type]} ring-offset-2 ring-offset-background/50 shadow-lg transition-transform group-hover:scale-125`}>
            <MapPin className="w-4 h-4 text-primary-foreground" />
          </div>
          {/* Label on hover */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="glass rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap text-foreground">
              {pin.label}
            </div>
          </div>
        </button>
      ))}

      {/* Click-anywhere-to-close overlay + detail panel */}
      {selectedPin && (
        <>
          {/* Invisible overlay to close on any map click */}
          <div
            className="absolute inset-0 z-15"
            onClick={() => setSelectedPin(null)}
          />

          {/* Desktop: right-side drawer (avoids legend on left) */}
          {!isMobile ? (
            <div className="absolute top-16 right-4 bottom-4 w-80 z-20 flex flex-col">
              <div className="glass-strong rounded-xl p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full ${pinColors[selectedPin.type]}`} />
                    <h3 className="font-display font-semibold text-foreground text-sm">{selectedPin.label}</h3>
                  </div>
                  <button onClick={() => setSelectedPin(null)} className="p-1 rounded-lg hover:bg-secondary transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">{selectedPin.detail}</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPin.tags.map(tag => (
                    <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full bg-primary/15 text-foreground border border-primary/25 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <button className="w-full mt-1 text-xs font-semibold py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-accent transition-colors flex items-center justify-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5" />
                  Get Directions
                </button>
              </div>
            </div>
          ) : (
            /* Mobile: bottom sheet */
            <div className="absolute bottom-0 left-0 right-0 z-20">
              <div className="glass-strong rounded-t-2xl p-5 pb-8 space-y-3 shadow-xl">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full ${pinColors[selectedPin.type]}`} />
                    <h3 className="font-display font-semibold text-foreground text-sm">{selectedPin.label}</h3>
                  </div>
                  <button onClick={() => setSelectedPin(null)} className="p-1 rounded-lg hover:bg-secondary transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">{selectedPin.detail}</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPin.tags.map(tag => (
                    <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full bg-primary/15 text-foreground border border-primary/25 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <button className="w-full mt-1 text-xs font-semibold py-3 rounded-lg bg-primary text-primary-foreground hover:bg-accent transition-colors flex items-center justify-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5" />
                  Get Directions
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Map center marker */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-5 pointer-events-none">
        <div className="w-3 h-3 rounded-full bg-primary/60 ring-4 ring-primary/20 animate-pulse" />
      </div>
    </div>
  );
};

export default MapDashboard;
