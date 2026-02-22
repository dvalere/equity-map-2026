import { ChevronDown, ChevronUp, Search, LocateFixed, Loader2, X } from "lucide-react";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface AppHeaderProps {
  onSearchResult?: (lat: number, lng: number, label: string) => void;
  onClearSearch?: () => void;
  hasActiveSearch?: boolean;
}

const AppHeader = ({ onSearchResult, onClearSearch, hasActiveSearch }: AppHeaderProps) => {
  const navigate = useNavigate();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searchError, setSearchError] = useState("");

  const geocode = useCallback(async (address: string) => {
    setSearching(true);
    setSearchError("");
    try {
      const encoded = encodeURIComponent(address + ", Washington, DC");
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1&countrycodes=us`
      );
      const results = await resp.json();
      if (!results.length) {
        setSearchError("No results found.");
        return;
      }
      const { lat, lon, display_name } = results[0];
      onSearchResult?.(parseFloat(lat), parseFloat(lon), display_name.split(",").slice(0, 2).join(","));
    } catch {
      setSearchError("Search failed.");
    } finally {
      setSearching(false);
    }
  }, [onSearchResult]);

  const geolocate = useCallback(() => {
    if (!navigator.geolocation) {
      setSearchError("Geolocation not supported.");
      return;
    }
    setLocating(true);
    setSearchError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSearchResult?.(pos.coords.latitude, pos.coords.longitude, "Your Location");
        setLocating(false);
      },
      () => {
        setSearchError("Location access denied.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [onSearchResult]);

  const handleClear = () => {
    setQuery("");
    setSearchError("");
    onClearSearch?.();
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong">
        <div className="flex items-center gap-3 px-4 py-2.5">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <h1 className="text-lg font-display font-bold text-foreground tracking-tight leading-none">
              Equity<span className="text-gradient">Map</span>
            </h1>
          </button>

          {/* Search bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) geocode(query.trim());
            }}
            className="flex-1 flex gap-1.5 min-w-0"
          >
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search an address..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-secondary/80 rounded-lg border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <button
              type="submit"
              disabled={!query.trim() || searching}
              className="px-2.5 py-2 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-accent transition-colors disabled:opacity-50 flex items-center gap-1 flex-shrink-0"
            >
              {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            </button>
          </form>

          {/* Locate & About buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {hasActiveSearch && (
              <button
                onClick={handleClear}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
            <button
              onClick={geolocate}
              disabled={locating}
              className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
              title="Use my location"
            >
              {locating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              ) : (
                <LocateFixed className="w-3.5 h-3.5 text-primary" />
              )}
            </button>
            <button
              onClick={() => setAboutOpen(!aboutOpen)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="About"
            >
              {aboutOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Search error */}
        {searchError && (
          <div className="px-4 pb-2">
            <p className="text-[11px] text-destructive">{searchError}</p>
          </div>
        )}

        {/* About section */}
        {aboutOpen && (
          <div className="px-4 pb-4 border-t border-border/50">
            <div className="mt-3 space-y-2">
              <h3 className="text-sm font-display font-semibold text-foreground">About EquityMap</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                EquityMap helps D.C. residents navigate "Benefit Deserts" inspired by the 2026 federal budget changes. 
                Using AI and verified public data, EquityMap connects communities with food assistance, 
                healthcare, and essential resources — because everyone deserves equitable access.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-accent-foreground border border-primary/30">AI-Powered</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-accent-foreground border border-primary/30">Open Data</span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Legend */}
      <div className="fixed top-16 left-3 z-20 glass rounded-xl px-3 py-2.5 space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-pin-food" />
          <span className="text-[11px] text-foreground font-medium">Food / SNAP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-pin-health" />
          <span className="text-[11px] text-foreground font-medium">Healthcare</span>
        </div>
      </div>
    </>
  );
};

export default AppHeader;
