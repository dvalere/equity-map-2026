import { ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const AppHeader = () => {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-display font-bold text-foreground tracking-tight">
              Equity<span className="text-gradient">Map</span>
            </h1>
            <p className="text-[10px] text-muted-foreground">Wards 7 & 8 • Washington, D.C.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-pin-food/10 border border-pin-food/20">
              <ShieldCheck className="w-3 h-3 text-pin-food" />
              <span className="text-[10px] font-medium text-pin-food">Protected by AI</span>
            </div>
            <button
              onClick={() => setAboutOpen(!aboutOpen)}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
              aria-label="About"
            >
              {aboutOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* About section */}
        {aboutOpen && (
          <div className="px-4 pb-4 border-t border-border/50">
            <div className="mt-3 space-y-2">
              <h3 className="text-sm font-display font-semibold text-foreground">Truth & Service</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                EquityMap helps D.C. residents navigate "Benefit Deserts" caused by the 2026 federal budget cuts (OBBBA). 
                Built for BisonHacks 2026, this tool leverages AI to connect communities in Wards 7 & 8 with food assistance, 
                healthcare, and verified community resources — because everyone deserves equitable access.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-accent-foreground border border-primary/30">BisonHacks 2026</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-accent-foreground border border-primary/30">Howard University</span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Legend */}
      <div className="fixed top-16 left-4 z-30 glass rounded-xl p-4 space-y-2.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Legend</p>
        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded-full bg-pin-food" />
          <span className="text-xs text-foreground font-medium">Food / SNAP</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded-full bg-pin-health" />
          <span className="text-xs text-foreground font-medium">Healthcare</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded-full bg-pin-community" />
          <span className="text-xs text-foreground font-medium">Community</span>
        </div>
        <div className="flex items-center gap-2.5 pt-2 border-t border-border/50">
          <div className="w-3.5 h-3.5 rounded-full bg-heat-high/60" />
          <span className="text-xs text-foreground font-medium">High Risk Zone</span>
        </div>
      </div>
    </>
  );
};

export default AppHeader;
