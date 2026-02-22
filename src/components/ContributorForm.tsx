import { useState, useCallback } from "react";
import { Plus, X, MapPin, Tag, ShieldCheck, CheckCircle, Loader2 } from "lucide-react";
import RhythmCaptcha from "./RhythmCaptcha";

type Step = 1 | 2 | 3 | 4;
type BenefitType = "food" | "health" | "community";

const BENEFIT_OPTIONS: { value: BenefitType; label: string; emoji: string; color: string }[] = [
  { value: "food", label: "Food / SNAP", emoji: "🍎", color: "bg-pin-food" },
  { value: "health", label: "Healthcare / Medicaid", emoji: "🏥", color: "bg-pin-health" },
];

const ContributorForm = ({ fabOffset = false }: { fabOffset?: boolean }) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [location, setLocation] = useState("");
  const [addressValid, setAddressValid] = useState(false);
  const [validating, setValidating] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [benefitType, setBenefitType] = useState<BenefitType | null>(null);
  const [captchaPassed, setCaptchaPassed] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const reset = () => {
    setStep(1);
    setLocation("");
    setAddressValid(false);
    setValidating(false);
    setAddressError("");
    setBenefitType(null);
    setCaptchaPassed(false);
    setVerifying(false);
    setVerified(false);
  };

  const validateAddress = useCallback(async () => {
    const addr = location.trim();
    if (!addr) return;
    if (addr.length < 5) {
      setAddressError("Please enter a full street address (e.g. 1600 Pennsylvania Ave NW).");
      return;
    }
    setValidating(true);
    setAddressError("");
    try {
      const encoded = encodeURIComponent(addr + ", Washington, DC");
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1&countrycodes=us&addressdetails=1`
      );
      const results = await resp.json();
      if (!results.length) {
        setAddressError("We couldn't find that address. Please enter a valid D.C. address.");
        return;
      }
      const r = results[0];
      const lat = parseFloat(r.lat);
      const lon = parseFloat(r.lon);
      const displayName: string = r.display_name || "";
      const inDC =
        lat >= 38.79 && lat <= 38.996 && lon >= -77.12 && lon <= -76.91;
      const nameMatchesDC =
        displayName.includes("Washington") ||
        displayName.includes("District of Columbia");
      const hasStreetInfo =
        r.address?.road || r.address?.house_number || r.type === "house";

      if (inDC && nameMatchesDC && hasStreetInfo) {
        setAddressValid(true);
        setLocation(displayName.split(",").slice(0, 3).join(",").trim());
        setStep(2);
      } else if (!inDC || !nameMatchesDC) {
        setAddressError("That address doesn't appear to be in Washington, D.C.");
      } else {
        setAddressError("Please enter a specific street address, not just a city or area name.");
      }
    } catch {
      setAddressError("Validation failed. Check your connection.");
    } finally {
      setValidating(false);
    }
  }, [location]);

  const handleSubmit = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
      setStep(4);
    }, 2000);
  };

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => { reset(); setOpen(true); }}
          className={`fixed left-4 z-40 w-14 h-14 rounded-full bg-secondary text-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-all duration-300 border border-border ${fabOffset ? "bottom-[48%]" : "bottom-20"}`}
          aria-label="Contribute a resource"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md glass-strong rounded-t-2xl md:rounded-2xl p-6 space-y-5 mx-4 mb-0 md:mb-0">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-bold text-foreground">Add a Resource</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Progress */}
            <div className="flex gap-1">
              {[1, 2, 3].map(s => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    step >= s ? "bg-primary" : "bg-secondary"
                  }`}
                />
              ))}
            </div>

            {/* Step 1: Location */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">Step 1: Pin Location</span>
                </div>
                <input
                  value={location}
                  onChange={e => {
                    setLocation(e.target.value);
                    setAddressValid(false);
                    setAddressError("");
                  }}
                  placeholder="Enter a valid D.C. address..."
                  className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {addressError && (
                  <p className="text-xs text-destructive">{addressError}</p>
                )}
                <button
                  onClick={validateAddress}
                  disabled={!location.trim() || validating}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-accent transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {validating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Validating address...
                    </>
                  ) : (
                    "Next"
                  )}
                </button>
              </div>
            )}

            {/* Step 2: Benefit Type */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Tag className="w-4 h-4" />
                  <span className="text-sm font-medium">Step 2: Select Benefit Type</span>
                </div>
                {addressValid && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-pin-food/10 border border-pin-food/20">
                    <CheckCircle className="w-3.5 h-3.5 text-pin-food flex-shrink-0" />
                    <p className="text-[11px] text-foreground truncate">{location}</p>
                  </div>
                )}
                <div className="space-y-2">
                  {BENEFIT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setBenefitType(opt.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all border ${
                        benefitType === opt.value
                          ? "bg-primary/15 border-primary/40 text-foreground"
                          : "bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      <span className="text-lg">{opt.emoji}</span>
                      <span className="font-medium">{opt.label}</span>
                      <div className={`w-2.5 h-2.5 rounded-full ${opt.color} ml-auto`} />
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => benefitType && setStep(3)}
                  disabled={!benefitType}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-accent transition-colors disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}

            {/* Step 3: Captcha Verification */}
            {step === 3 && !verifying && !verified && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-sm font-medium">Step 3: Verify You're Human</span>
                </div>

                <div
                  id="captcha-container"
                  className="border border-border rounded-xl bg-secondary/30"
                >
                  <RhythmCaptcha onResult={(isHuman) => setCaptchaPassed(isHuman)} />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!captchaPassed}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-accent transition-colors disabled:opacity-50"
                >
                  Submit Resource
                </button>
              </div>
            )}

            {/* Verifying animation */}
            {step === 3 && verifying && (
              <div className="py-8 text-center space-y-4">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
                  <div className="absolute inset-0 rounded-full border-2 border-t-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-display font-semibold text-foreground">Submitting resource...</p>
                  <p className="text-xs text-muted-foreground mt-1">Verifying and adding to the map</p>
                </div>
              </div>
            )}

            {/* Step 4: Success */}
            {step === 4 && verified && (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-pin-food/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-pin-food" />
                </div>
                <div>
                  <p className="text-sm font-display font-semibold text-foreground">Resource Submitted!</p>
                  <p className="text-xs text-muted-foreground mt-1">Your contribution has been added to the map. Thank you for helping your community.</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-accent transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ContributorForm;
