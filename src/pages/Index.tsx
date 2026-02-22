import { useState, useCallback } from "react";
import AppHeader from "@/components/AppHeader";
import MapDashboard from "@/components/MapDashboard";
import FilterSheet from "@/components/FilterSheet";
import AIChatBot from "@/components/AIChatBot";
import ContributorForm from "@/components/ContributorForm";

const Index = () => {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);

  const handleSearchResult = useCallback(
    (lat: number, lng: number, label: string) => {
      setSearchLocation({ lat, lng, label });
    },
    []
  );

  const handleClearSearch = useCallback(() => {
    setSearchLocation(null);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      <AppHeader
        onSearchResult={handleSearchResult}
        onClearSearch={handleClearSearch}
        hasActiveSearch={!!searchLocation}
      />
      <MapDashboard
        activeFilters={activeFilters}
        searchLocation={searchLocation}
        onClearSearch={handleClearSearch}
      />
      <FilterSheet
        activeFilters={activeFilters}
        onFiltersChange={setActiveFilters}
        onOpenChange={setFiltersOpen}
      />
      <AIChatBot fabOffset={filtersOpen || !!searchLocation} />
      <ContributorForm fabOffset={filtersOpen || !!searchLocation} />
    </div>
  );
};

export default Index;
