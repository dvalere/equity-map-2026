import { useNavigate } from "react-router-dom";
import { MapPin, Bot, ClipboardCheck, ShieldCheck, ArrowRight } from "lucide-react";

const FEATURES = [
  {
    icon: MapPin,
    title: "Resource Map",
    description:
      "450+ verified SNAP retailers and healthcare facilities across Washington, D.C., sourced from USDA and DC government datasets.",
    color: "text-pin-food",
    bg: "bg-pin-food/10",
  },
  {
    icon: Bot,
    title: "EquityGuide AI",
    description:
      "An AI assistant that explains benefit eligibility, the 80-hour work requirement, and helps you find resources near you.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: ClipboardCheck,
    title: "Eligibility Screener",
    description:
      "A guided, step-by-step flow that assesses your SNAP eligibility in under 30 seconds — no account required.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight leading-tight">
            Navigate D.C. resources
            <br />
            <span className="text-gradient">with confidence</span>
          </h1>

          <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            EquityMap connects Washington, D.C. residents with food assistance
            and healthcare — powered by verified government data and AI guidance.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate("/map")}
              className="px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-accent transition-colors shadow-lg glow-primary flex items-center gap-2"
            >
              Explore the Map
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            No sign-up required. Free and open-source.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-10">
          What EquityMap offers
        </h2>

        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="glass-strong rounded-2xl p-6 space-y-4 hover:shadow-lg transition-shadow"
            >
              <div
                className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center`}
              >
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="text-sm font-display font-bold text-foreground">
                {f.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Transparency */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div className="glass-strong rounded-2xl p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-foreground">
                How We Use AI
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Transparency & ethics
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground">
                What AI powers EquityGuide?
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Google Gemini 2.5 Flash, a large language model. It receives
                your questions and general policy context — never personal data.
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground">
                What data does it have?
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                General knowledge about SNAP and Medicaid rules. Map data comes
                from public USDA and DC government datasets — not from AI.
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground">
                What can't it do?
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                It cannot determine your actual eligibility, access your
                benefits, or make decisions on your behalf. Always verify with
                official sources.
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground">
                Is my data stored?
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                No. Conversations are not saved and no personal information is
                collected. Your session resets when you close the page.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          EquityMap &middot; Built with open data &middot; Washington, D.C.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
