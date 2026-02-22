import { useState } from "react";
import { Plus, X, MapPin, Tag, Camera, CheckCircle, Loader2 } from "lucide-react";

type Step = 1 | 2 | 3 | 4;
type BenefitType = "food" | "health" | "community";

const BENEFIT_OPTIONS: { value: BenefitType; label: string; emoji: string; color: string }[] = [
  { value: "food", label: "Food / SNAP", emoji: "🍎", color: "bg-pin-food" },
  { value: "health", label: "Healthcare / Medicaid", emoji: "🏥", color: "bg-pin-health" },
  { value: "community", label: "Community Resource", emoji: "💙", color: "bg-pin-community" },
];

const ContributorForm = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [location, setLocation] = useState("");
  const [benefitType, setBenefitType] = useState<BenefitType | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const reset = () => {
    setStep(1);
    setLocation("");
    setBenefitType(null);
    setVerifying(false);
    setVerified(false);
  };

  const handleVerify = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
      setStep(4);
    }, 3000);
  };

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => { reset(); setOpen(true); }}
          className="fixed bottom-20 left-4 z-40 w-14 h-14 rounded-full bg-secondary text-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform border border-border"
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
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Enter address or landmark..."
                  className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={() => step === 1 && location && setStep(2)}
                  disabled={!location}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-accent transition-colors disabled:opacity-50"
                >
                  Next
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

            {/* Step 3: AI Verification */}
            {step === 3 && !verifying && !verified && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Camera className="w-4 h-4" />
                  <span className="text-sm font-medium">Step 3: AI Verification</span>
                </div>
                <p className="text-xs text-muted-foreground">Upload a photo of the storefront, menu, or receipt to verify this resource with AI.</p>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
                  <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Tap to upload photo</p>
                </div>
                <button
                  onClick={handleVerify}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-accent transition-colors"
                >
                  Submit for Verification
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
                  <p className="text-sm font-display font-semibold text-foreground">Verifying with AI...</p>
                  <p className="text-xs text-muted-foreground mt-1">Analyzing image for resource confirmation</p>
                </div>
                <div className="h-1 w-48 mx-auto bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full animate-scan" style={{ width: "40%" }} />
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
                  <p className="text-sm font-display font-semibold text-foreground">Resource Verified!</p>
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
