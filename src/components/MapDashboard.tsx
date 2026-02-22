import { useState, useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Marker,
  useMap,
} from "react-leaflet";
import {
  Navigation,
  FileText,
  ShieldCheck,
  X,
  BookOpen,
  MapPin,
} from "lucide-react";
import Papa from "papaparse";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom user-location marker icon
const USER_ICON = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;background:#6366f1;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(99,102,241,.3),0 2px 8px rgba(0,0,0,.25)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface ResourcePin {
  id: string;
  type: "food" | "health";
  label: string;
  lat: number;
  lng: number;
  detail: string;
  address: string;
  tags: string[];
  storeType: string;
  extra?: {
    phone?: string;
    services?: string;
    hours?: string;
    languages?: string;
    insurance?: string;
    walkIn?: string;
    webUrl?: string;
  };
}

interface MapDashboardProps {
  activeFilters: string[];
  searchLocation?: { lat: number; lng: number; label: string } | null;
  onClearSearch?: () => void;
}

const DC_CENTER: [number, number] = [38.9072, -77.0369];
const DEFAULT_ZOOM = 12;
const NEARBY_ZOOM = 14;
const NEARBY_COUNT = 8;

// --- Haversine distance (miles) ---
const haversine = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// --- Map controller (handles flyTo) ---
const MapController = ({
  center,
  zoom,
}: {
  center: [number, number] | null;
  zoom: number;
}) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

// --- Education data ---
const FOOD_EDUCATION: Record<
  string,
  { title: string; body: string; tip: string }
> = {
  Supermarket: {
    title: "Supermarket — SNAP Authorized",
    body: "Full-service grocery store accepting EBT/SNAP. You can purchase fresh produce, dairy, meats, bread, cereals, and non-alcoholic beverages. SNAP cannot be used for prepared hot foods, alcohol, tobacco, or household items.",
    tip: 'Look for "Double Up Food Bucks" programs that match your SNAP dollars on fresh fruits and vegetables.',
  },
  "Super Store": {
    title: "Super Store — SNAP Authorized",
    body: "Large retail store with a grocery section that accepts EBT/SNAP. These stores often combine general merchandise with a full grocery department, offering competitive prices on bulk food items.",
    tip: "The grocery section accepts SNAP, but non-food items at checkout must be paid separately.",
  },
  "Convenience Store": {
    title: "Convenience Store — SNAP Authorized",
    body: "Neighborhood store accepting EBT/SNAP for eligible food items. Selection may be limited compared to larger stores, but these locations are often closer to home and open extended hours.",
    tip: "Prioritize staple items like bread, milk, eggs, and canned goods. Compare prices — convenience stores may charge more than supermarkets.",
  },
  "Combination Grocery/Other": {
    title: "Combination Grocery — SNAP Authorized",
    body: "A store that combines grocery items with other retail goods. The grocery section accepts EBT/SNAP for eligible food purchases including fresh and packaged foods.",
    tip: "Only food items are SNAP-eligible. Keep grocery and non-grocery items separate at checkout.",
  },
  "Farmers' Market": {
    title: "Farmers' Market — SNAP Authorized",
    body: "Local farmers' market accepting EBT/SNAP. Shop directly from local growers for fresh, seasonal produce, baked goods, and other farm products. Many markets offer nutrition incentive programs.",
    tip: "Ask about SNAP matching programs — many DC farmers' markets double your EBT dollars on fresh produce.",
  },
  "Medium Grocery Store": {
    title: "Medium Grocery Store — SNAP Authorized",
    body: "Mid-size grocery store accepting EBT/SNAP. Offers a solid selection of fresh produce, meats, dairy, and pantry staples at neighborhood-accessible prices.",
    tip: "Check for weekly sales and store loyalty programs to stretch your SNAP benefits further.",
  },
  "Small Grocery Store": {
    title: "Small Grocery Store — SNAP Authorized",
    body: "Small neighborhood grocery accepting EBT/SNAP. These stores serve as essential food access points in communities where larger stores may be distant.",
    tip: "Small groceries often carry culturally specific foods that larger chains don't stock.",
  },
  "Large Grocery Store": {
    title: "Large Grocery Store — SNAP Authorized",
    body: "Large grocery store with extensive food selection accepting EBT/SNAP. Expect a wide range of fresh produce, meats, bakery, deli, and packaged goods.",
    tip: "Buy in bulk for staples like rice, beans, and frozen vegetables to maximize your monthly benefits.",
  },
  "Seafood Specialty": {
    title: "Seafood Specialty — SNAP Authorized",
    body: "Specialty seafood retailer accepting EBT/SNAP. Purchase fresh and frozen fish, shellfish, and other seafood products with your benefits.",
    tip: "Fresh seafood is SNAP-eligible. Ask about daily catches for the best prices and freshness.",
  },
  "Meat/Poultry Specialty": {
    title: "Meat & Poultry — SNAP Authorized",
    body: "Specialty meat and poultry shop accepting EBT/SNAP. These stores often offer butcher-cut meats, poultry, and specialty cuts at competitive prices.",
    tip: "Buying whole chickens or larger cuts and portioning at home is more cost-effective than pre-cut options.",
  },
  "Fruits/Veg Specialty": {
    title: "Fruits & Vegetables — SNAP Authorized",
    body: "Specialty produce store accepting EBT/SNAP. Focused selection of fresh fruits and vegetables, often with competitive pricing and seasonal variety.",
    tip: "Seasonal produce is fresher and cheaper. Ask what's in season for the best deals.",
  },
};

const FOOD_DEFAULT = {
  title: "SNAP Authorized Retailer",
  body: "This location is authorized to accept EBT/SNAP benefits for eligible food purchases. You can buy fruits, vegetables, meats, dairy, breads, cereals, and other food items.",
  tip: "Remember: SNAP covers food items only. Hot prepared foods, alcohol, and non-food items are not eligible.",
};

const HEALTH_EDUCATION = {
  title: "Primary Care Facility",
  body: "Community health center providing primary care services. Many of these facilities operate on a sliding-scale fee basis, meaning your cost is adjusted based on your income. Most accept Medicaid, Medicare, and private insurance.",
  tip: "Even without insurance, you can receive care. Ask about sliding-scale fees and enrollment assistance for Medicaid or DC Health Link.",
};

const getEducation = (pin: ResourcePin) => {
  if (pin.type === "health") return HEALTH_EDUCATION;
  return FOOD_EDUCATION[pin.storeType] || FOOD_DEFAULT;
};

// --- CSV parsers ---
const parseSnapCsv = async (): Promise<ResourcePin[]> => {
  const res = await fetch("/DC_Active_SNAP_Retailers_2026.csv");
  const text = await res.text();
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });

  return (data as Record<string, string>[])
    .map((row, i) => ({
      id: `snap-${i}`,
      type: "food" as const,
      label: (row["Store Name"] || "SNAP Retailer").trim(),
      lat: parseFloat(row["Latitude"]),
      lng: parseFloat(row["Longitude"]),
      detail: `${(row["Store Type"] || "").trim()} — ${(row["Street Number"] || "").trim()} ${(row["Street Name"] || "").trim()}`,
      address: `${(row["Street Number"] || "").trim()} ${(row["Street Name"] || "").trim()}, Washington, DC ${(row["Zip Code"] || "").trim()}`,
      tags: ["Accepts EBT"],
      storeType: (row["Store Type"] || "").trim(),
    }))
    .filter((p) => !isNaN(p.lat) && !isNaN(p.lng));
};

const parseHealthCsv = async (): Promise<ResourcePin[]> => {
  const res = await fetch("/Primary_Care_Facilities.csv");
  const text = await res.text();
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });

  return (data as Record<string, string>[])
    .map((row, i) => {
      const xMerc = parseFloat(row["X"]);
      const yMerc = parseFloat(row["Y"]);
      const lng = (xMerc / 20037508.34) * 180;
      let lat = (yMerc / 20037508.34) * 180;
      lat =
        (180 / Math.PI) *
        (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2);

      const name = (row["DCGISPrimaryCarePtNAME"] || "Health Center").trim();
      const addr = (row["DCGISPrimaryCarePtADDRESS"] || "").trim();
      const ward = row["DCGISPrimaryCarePtWARD"] || "";
      const facility = (
        row["DCGISPrimaryCarePtFACILITY_SETTING"] || ""
      ).trim();

      const yes = (val: string | undefined) =>
        (val || "").toLowerCase().includes("yes");
      const clean = (val: string | undefined) =>
        (val || "").trim() || undefined;

      const tags: string[] = [];
      if (yes(row["DCGISPrimaryCarePtMEDICAID"])) tags.push("Accepts Medicaid");
      if (yes(row["DCGISPrimaryCarePtWALKIN_UNSCHEDULED"]))
        tags.push("Walk-ins OK");

      const days = [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ];
      const dayAbbr = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const hours = days
        .map((d, idx) => {
          const h = clean(row[`DCGISPRIMARY_CARE_INFOHOURS_${d}`]);
          return h ? `${dayAbbr[idx]}: ${h}` : null;
        })
        .filter(Boolean)
        .join(" | ");

      const langs: string[] = [];
      if (yes(row["DCGISPRIMARY_CARE_INFOENGLISH"])) langs.push("English");
      if (yes(row["DCGISPRIMARY_CARE_INFOSPANISH"])) langs.push("Spanish");
      if (yes(row["DCGISPRIMARY_CARE_INFOFRENCH"])) langs.push("French");
      if (yes(row["DCGISPRIMARY_CARE_INFOAMHARIC"])) langs.push("Amharic");
      if (yes(row["DCGISPRIMARY_CARE_INFOCHINESE_TRADITIONAL"]))
        langs.push("Chinese");
      if (yes(row["DCGISPRIMARY_CARE_INFOKOREAN"])) langs.push("Korean");
      if (yes(row["DCGISPRIMARY_CARE_INFOASL"])) langs.push("ASL");

      return {
        id: `health-${i}`,
        type: "health" as const,
        label: name,
        lat,
        lng,
        detail: `${addr}${ward ? ` — Ward ${ward}` : ""}`,
        address: `${addr}, Washington, DC`,
        tags,
        storeType: facility,
        extra: {
          phone: clean(row["DCGISPrimaryCarePtPHONE"]),
          services: clean(
            row["DCGISPRIMARY_CARE_INFOMEDICAL_SERVICES_AVAILABLE"]
          ),
          hours: hours || undefined,
          languages: langs.length > 0 ? langs.join(", ") : undefined,
          insurance: clean(row["DCGISPrimaryCarePtINSURANCE_ACCEPTED"]),
          walkIn: clean(row["DCGISPrimaryCarePtWALKIN_UNSCHEDULED"]),
          webUrl: clean(row["DCGISPrimaryCarePtWEB_URL"]),
        },
      };
    })
    .filter((p) => !isNaN(p.lat) && !isNaN(p.lng));
};

const MARKER_COLORS = {
  food: "#22c55e",
  health: "#ef4444",
};

// --- Main component ---
const MapDashboard = ({ activeFilters, searchLocation, onClearSearch }: MapDashboardProps) => {
  const [pins, setPins] = useState<ResourcePin[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailPin, setDetailPin] = useState<ResourcePin | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [snap, health] = await Promise.all([
          parseSnapCsv(),
          parseHealthCsv(),
        ]);
        setPins([...snap, ...health]);
      } catch (err) {
        console.error("Failed to load CSV data:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (searchLocation) {
      setFlyTarget([searchLocation.lat, searchLocation.lng]);
    } else {
      setFlyTarget(DC_CENTER);
    }
  }, [searchLocation]);

  const filteredPins =
    activeFilters.length === 0
      ? pins
      : pins.filter((p) => p.tags.some((t) => activeFilters.includes(t)));

  const nearbyPins = useMemo(() => {
    if (!searchLocation) return [];
    return [...filteredPins]
      .map((p) => ({
        ...p,
        distance: haversine(searchLocation.lat, searchLocation.lng, p.lat, p.lng),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, NEARBY_COUNT);
  }, [searchLocation, filteredPins]);

  const education = detailPin ? getEducation(detailPin) : null;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-xs text-muted-foreground">
              Loading resources…
            </p>
          </div>
        </div>
      )}

      <MapContainer
        center={DC_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full z-0"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        <MapController
          center={flyTarget}
          zoom={searchLocation ? NEARBY_ZOOM : DEFAULT_ZOOM}
        />

        {/* User location marker */}
        {searchLocation && (
          <Marker
            position={[searchLocation.lat, searchLocation.lng]}
            icon={USER_ICON}
          >
            <Popup>
              <p className="text-sm font-semibold text-foreground">
                {searchLocation.label}
              </p>
            </Popup>
          </Marker>
        )}

        {filteredPins.map((pin) => (
          <CircleMarker
            key={pin.id}
            center={[pin.lat, pin.lng]}
            radius={7}
            pathOptions={{
              fillColor: MARKER_COLORS[pin.type],
              color: "#fff",
              weight: 2,
              fillOpacity: 0.9,
            }}
          >
            <Popup>
              <div className="min-w-[200px] space-y-2 py-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: MARKER_COLORS[pin.type] }}
                  />
                  <p className="font-semibold text-sm text-foreground leading-tight">
                    {pin.label}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{pin.detail}</p>
                <div className="flex flex-wrap gap-1">
                  {pin.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-foreground border border-primary/20 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-[11px] font-semibold py-2 rounded-lg bg-primary text-primary-foreground hover:bg-accent transition-colors flex items-center justify-center gap-1"
                  >
                    <Navigation className="w-3 h-3" />
                    Directions
                  </a>
                  <button
                    onClick={() => setDetailPin(pin)}
                    className="flex-1 text-[11px] font-semibold py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1 border border-border"
                  >
                    <FileText className="w-3 h-3" />
                    Details
                  </button>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Pin count badge */}
      {!loading && !searchLocation && (
        <div className="absolute bottom-4 left-4 z-10 glass rounded-xl px-3 py-2 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">
            {filteredPins.length} verified resources
          </span>
        </div>
      )}

      {/* Nearby resources panel */}
      {searchLocation && (
        <div className="absolute bottom-0 left-0 right-0 z-10 max-h-[45%] flex flex-col bg-white/95 backdrop-blur-md border-t border-border/50 rounded-t-2xl shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-display font-semibold text-foreground">
                  Nearby Resources
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {searchLocation.label}
                </p>
              </div>
            </div>
            <button
              onClick={onClearSearch}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {nearbyPins.map((pin) => (
              <button
                key={pin.id}
                onClick={() => {
                  setFlyTarget([pin.lat, pin.lng]);
                  setDetailPin(pin);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors text-left border-b border-border/20 last:border-b-0"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: MARKER_COLORS[pin.type] }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {pin.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {pin.address}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs font-semibold text-primary">
                    {pin.distance < 0.1
                      ? `${Math.round(pin.distance * 5280)} ft`
                      : `${pin.distance.toFixed(1)} mi`}
                  </p>
                  <p className="text-[10px] text-muted-foreground capitalize">
                    {pin.type === "food" ? "Food" : "Health"}
                  </p>
                </div>
              </button>
            ))}
            {nearbyPins.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">
                No resources found nearby with current filters.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Education detail panel */}
      {detailPin && education && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setDetailPin(null)}
          />
          <div className="relative glass-strong rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-display font-bold text-foreground">
                  {education.title}
                </h2>
              </div>
              <button
                onClick={() => setDetailPin(null)}
                className="p-1 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: MARKER_COLORS[detailPin.type] }}
              />
              <span className="text-xs font-medium text-foreground">
                {detailPin.label}
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {education.body}
            </p>

            {detailPin.extra && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                {detailPin.extra.phone && (
                  <div>
                    <p className="text-[11px] font-semibold text-foreground">
                      Phone
                    </p>
                    <a
                      href={`tel:${detailPin.extra.phone}`}
                      className="text-xs text-primary hover:underline"
                    >
                      {detailPin.extra.phone}
                    </a>
                  </div>
                )}
                {detailPin.extra.services && (
                  <div>
                    <p className="text-[11px] font-semibold text-foreground">
                      Services
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {detailPin.extra.services}
                    </p>
                  </div>
                )}
                {detailPin.extra.hours && (
                  <div>
                    <p className="text-[11px] font-semibold text-foreground">
                      Hours
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {detailPin.extra.hours}
                    </p>
                  </div>
                )}
                {detailPin.extra.languages && (
                  <div>
                    <p className="text-[11px] font-semibold text-foreground">
                      Languages
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {detailPin.extra.languages}
                    </p>
                  </div>
                )}
                {detailPin.extra.insurance && (
                  <div>
                    <p className="text-[11px] font-semibold text-foreground">
                      Insurance
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {detailPin.extra.insurance}
                    </p>
                  </div>
                )}
                {detailPin.extra.webUrl && (
                  <div>
                    <p className="text-[11px] font-semibold text-foreground">
                      Website
                    </p>
                    <a
                      href={detailPin.extra.webUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline break-all"
                    >
                      {detailPin.extra.webUrl}
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="bg-primary/5 border border-primary/15 rounded-xl p-3">
              <p className="text-[11px] font-semibold text-primary mb-1">Tip</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {education.tip}
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              {detailPin.address}
            </p>

            <div className="flex gap-2 pt-1">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${detailPin.lat},${detailPin.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-xs font-semibold py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-accent transition-colors text-center"
              >
                Get Directions
              </a>
              <button
                onClick={() => setDetailPin(null)}
                className="flex-1 text-xs font-semibold py-2.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-muted transition-colors border border-border"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapDashboard;
