import { useState } from "react";
import { ShieldCheck, X, Fingerprint } from "lucide-react";

const PrivacyModal = () => {
  const [show, setShow] = useState(false);
  const [verified, setVerified] = useState(false);

  // Simulated trigger - in production this would be triggered by bot detection
  const triggerCheck = () => {
    setShow(true);
    setVerified(false);
  };

  const handleVerify = () => {
    setVerified(true);
    setTimeout(() => setShow(false), 1500);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
      <div className="relative glass-strong rounded-2xl p-6 max-w-sm w-full space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-pin-food" />
            <h2 className="text-sm font-display font-bold text-foreground">Privacy-Preserving Check</h2>
          </div>
          <button onClick={() => setShow(false)} className="p-1 rounded-lg hover:bg-secondary">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          We detected unusual activity. To protect our community's data, please verify you're a real person. 
          No personal data is stored.
        </p>

        {!verified ? (
          <button
            onClick={handleVerify}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-secondary border border-border hover:border-primary/40 transition-all"
          >
            <Fingerprint className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium text-foreground">Tap to Verify</span>
          </button>
        ) : (
          <div className="text-center py-4">
            <ShieldCheck className="w-8 h-8 text-pin-food mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Verified ✓</p>
          </div>
        )}

        <p className="text-[10px] text-center text-muted-foreground">
          Protected by AI • Zero-knowledge verification
        </p>
      </div>
    </div>
  );
};

export default PrivacyModal;
