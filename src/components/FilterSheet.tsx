import { useState } from "react";
import { Filter, X, ChevronUp } from "lucide-react";

const FILTERS = [
  { id: "Accepts EBT", label: "Accepts EBT", icon: "💳" },
  { id: "No ID Required", label: "No ID Required", icon: "🆓" },
  { id: "Student Discounts", label: "Student Discounts", icon: "🎓" },
];

interface FilterSheetProps {
  activeFilters: string[];
  onFiltersChange: (filters: string[]) => void;
}

const FilterSheet = ({ activeFilters, onFiltersChange }: FilterSheetProps) => {
  const [open, setOpen] = useState(false);

  const toggle = (id: string) => {
    onFiltersChange(
      activeFilters.includes(id)
        ? activeFilters.filter(f => f !== id)
        : [...activeFilters, id]
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 md:left-auto md:right-4 md:bottom-4 md:w-80">
      {/* Toggle bar */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full glass-strong flex items-center justify-between px-4 py-3 rounded-t-xl md:rounded-xl border-b border-border/50"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-foreground">Filters</span>
          {activeFilters.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold">
              {activeFilters.length}
            </span>
          )}
        </div>
        <ChevronUp className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "" : "rotate-180"}`} />
      </button>

      {/* Filter options */}
      {open && (
        <div className="glass-strong border-t-0 rounded-b-none md:rounded-b-xl p-4 space-y-2">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => toggle(f.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                activeFilters.includes(f.id)
                  ? "bg-primary/20 text-foreground border border-primary/40"
                  : "bg-secondary/50 text-muted-foreground border border-transparent hover:bg-secondary"
              }`}
            >
              <span>{f.icon}</span>
              <span className="font-medium">{f.label}</span>
              {activeFilters.includes(f.id) && (
                <X className="w-3 h-3 ml-auto" />
              )}
            </button>
          ))}
          {activeFilters.length > 0 && (
            <button
              onClick={() => onFiltersChange([])}
              className="w-full text-xs text-muted-foreground hover:text-foreground py-1 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterSheet;
