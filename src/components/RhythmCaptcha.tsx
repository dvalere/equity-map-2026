import { useState, useEffect, useRef, useCallback } from "react";

// ─── AI Behavioral Analysis Engine ───────────────────────────────────────────
class BehaviorAnalyzer {
  mousePositions: { x: number; y: number; t: number }[] = [];
  clickTimings: number[] = [];
  tapTimings: number[] = [];
  mouseVelocities: number[] = [];
  hesitations = 0;
  microMovements = 0;
  lastMouseTime = 0;
  lastMousePos = { x: 0, y: 0 };
  startTime = Date.now();

  trackMouse(x: number, y: number) {
    const now = Date.now();
    const dt = now - this.lastMouseTime;
    if (dt < 30) return; // Throttle: ~33 samples/sec is enough for analysis
    const dx = x - this.lastMousePos.x;
    const dy = y - this.lastMousePos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const velocity = dt > 0 ? dist / dt : 0;
    this.mousePositions.push({ x, y, t: now });
    this.mouseVelocities.push(velocity);
    if (this.mousePositions.length > 150) {
      this.mousePositions.shift();
      this.mouseVelocities.shift();
    }
    if (dist > 0 && dist < 3) this.microMovements++;
    if (dt > 200 && dist > 5) this.hesitations++;
    this.lastMouseTime = now;
    this.lastMousePos = { x, y };
  }

  trackClick(ts: number) {
    this.clickTimings.push(ts);
  }

  trackTap(ts: number) {
    this.tapTimings.push(ts);
  }

  private computePathJitter() {
    if (this.mousePositions.length < 10) return 0;
    let j = 0;
    for (let i = 2; i < this.mousePositions.length; i++) {
      const p0 = this.mousePositions[i - 2];
      const p1 = this.mousePositions[i - 1];
      const p2 = this.mousePositions[i];
      j += Math.abs(
        Math.atan2(p2.y - p1.y, p2.x - p1.x) -
          Math.atan2(p1.y - p0.y, p1.x - p0.x)
      );
    }
    return j / (this.mousePositions.length - 2);
  }

  private computeTimingVariance(t: number[]) {
    if (t.length < 3) return 0;
    const iv: number[] = [];
    for (let i = 1; i < t.length; i++) iv.push(t[i] - t[i - 1]);
    const m = iv.reduce((a, b) => a + b, 0) / iv.length;
    return Math.sqrt(iv.reduce((a, b) => a + (b - m) ** 2, 0) / iv.length);
  }

  private computeVelocityNaturalness() {
    if (this.mouseVelocities.length < 5) return 0;
    const acc: number[] = [];
    for (let i = 1; i < this.mouseVelocities.length; i++) {
      acc.push(this.mouseVelocities[i] - this.mouseVelocities[i - 1]);
    }
    return (
      acc.filter(
        (a, i) => i > 0 && Math.sign(a) !== Math.sign(acc[i - 1] || 0)
      ).length / acc.length
    );
  }

  analyze(
    mode: "rhythm" | "precision",
    accuracy: number
  ): {
    scores: Record<string, number>;
    total: number;
    isHuman: boolean;
    confidence: number;
    totalTime: number;
    details: Record<string, string | number>;
  } {
    const s: Record<string, number> = {};
    const jitter = this.computePathJitter();
    s.pathNaturalness =
      jitter > 0.05 && jitter < 1.5 ? 25 : jitter > 0.02 ? 15 : 5;

    const timings = mode === "rhythm" ? this.tapTimings : this.clickTimings;
    const variance = this.computeTimingVariance(timings);
    s.timingHumanness =
      variance > 15 && variance < 300 ? 25 : variance > 5 ? 15 : 0;

    const tr =
      this.mousePositions.length > 0
        ? this.microMovements / this.mousePositions.length
        : 0;
    s.bioSignal = tr > 0.02 && tr < 0.5 ? 15 : tr > 0.01 ? 8 : 0;

    const vn = this.computeVelocityNaturalness();
    s.velocityProfile = vn > 0.15 ? 15 : vn > 0.05 ? 8 : 2;

    s.taskAccuracy = Math.round(accuracy * 20);
    const total = Object.values(s).reduce((a, b) => a + b, 0);

    return {
      scores: s,
      total,
      isHuman: total >= 55,
      confidence: Math.min(99, Math.round(total * 1.1)),
      totalTime: Date.now() - this.startTime,
      details: {
        mouseEvents: this.mousePositions.length,
        microMovements: this.microMovements,
        hesitations: this.hesitations,
        pathJitter: jitter.toFixed(4),
        timingVariance: variance.toFixed(1),
        velocityNaturalness: vn.toFixed(3),
      },
    };
  }
}

const RHYTHM_PATTERNS = [
  { name: "4/4 Basic", beats: [0, 600, 1200, 1800, 2400, 3000, 3600, 4200] },
  {
    name: "Syncopated",
    beats: [0, 545, 1090, 1450, 2180, 2725, 3270, 3630, 4360],
  },
  {
    name: "Swing",
    beats: [0, 632, 948, 1580, 2212, 2528, 3160, 3792, 4108],
  },
] as const;

function createBeep(
  ctx: AudioContext,
  freq = 800,
  dur = 0.08,
  vol = 0.3
): void {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.connect(g);
  g.connect(ctx.destination);
  o.frequency.value = freq;
  o.type = "sine";
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  o.start();
  o.stop(ctx.currentTime + dur);
}

function createKick(ctx: AudioContext, vol = 0.4): void {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.connect(g);
  g.connect(ctx.destination);
  o.frequency.setValueAtTime(150, ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.12);
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  o.start();
  o.stop(ctx.currentTime + 0.15);
}

const CIRCLE_POSITIONS = [
  { x: 50, y: 35 },
  { x: 25, y: 60 },
  { x: 75, y: 50 },
  { x: 40, y: 75 },
  { x: 60, y: 28 },
] as const;

const TOTAL_CIRCLES = 5;

export interface RhythmCaptchaProps {
  onResult?: (isHuman: boolean) => void;
}

export default function RhythmCaptcha({ onResult }: RhythmCaptchaProps) {
  const [phase, setPhase] = useState<
    "idle" | "select" | "listen" | "play" | "target" | "checking" | "result"
  >("idle");
  const [mode, setMode] = useState<"rhythm" | "precision" | null>(null);
  const [result, setResult] = useState<ReturnType<BehaviorAnalyzer["analyze"]> | null>(null);
  const [hoverCheck, setHoverCheck] = useState(false);

  const [currentPattern, setCurrentPattern] =
    useState<(typeof RHYTHM_PATTERNS)[number] | null>(null);
  const [beatIndex, setBeatIndex] = useState(-1);
  const [userTaps, setUserTaps] = useState<number[]>([]);

  const [activeCircle, setActiveCircle] = useState<{
    id: number;
    x: number;
    y: number;
    startTime: number;
    duration: number;
    size: number;
  } | null>(null);
  const [circleResults, setCircleResults] = useState<
    { hit: boolean; timing: number }[]
  >([]);
  const [circlePhase, setCirclePhase] = useState(0);
  const [clickedThisRound, setClickedThisRound] = useState(false);
  const [checking, setChecking] = useState(false);
  const [hasReported, setHasReported] = useState(false);

  const analyzerRef = useRef(new BehaviorAnalyzer());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const patternStartRef = useRef<number | null>(null);
  const circleTimerRef = useRef<number | null>(null);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current!;
  };

  const lastMouseTrackRef = useRef(0);
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const now = Date.now();
      if (now - lastMouseTrackRef.current < 40) return;
      lastMouseTrackRef.current = now;
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        analyzerRef.current.trackMouse(
          e.clientX - rect.left,
          e.clientY - rect.top
        );
      }
    },
    []
  );

  useEffect(() => {
    if (phase === "result" && result && !hasReported) {
      if (onResult) {
        onResult(result.isHuman);
      }
      setHasReported(true);
    }
  }, [phase, result, hasReported, onResult]);

  const startListen = () => {
    const p =
      RHYTHM_PATTERNS[Math.floor(Math.random() * RHYTHM_PATTERNS.length)];
    setCurrentPattern(p);
    setPhase("listen");
    setBeatIndex(-1);
    const ctx = getAudioCtx();
    p.beats.forEach((bt, i) => {
      setTimeout(() => {
        createKick(ctx);
        setBeatIndex(i);
        setTimeout(() => setBeatIndex(-1), 120);
      }, bt);
    });
    setTimeout(() => {
      setPhase("play");
      setUserTaps([]);
      patternStartRef.current = Date.now();
    }, p.beats[p.beats.length - 1] + 800);
  };

  const handleRhythmTap = () => {
    if (phase !== "play" || !patternStartRef.current) return;
    const tap = Date.now() - patternStartRef.current;
    createBeep(getAudioCtx(), 600, 0.06, 0.2);
    const now = Date.now();
    analyzerRef.current.trackTap(now);
    analyzerRef.current.trackClick(now);
    setUserTaps((prev) => {
      const n = [...prev, tap];
      if (currentPattern && n.length >= currentPattern.beats.length) {
        setTimeout(() => evaluateRhythm(n), 300);
      }
      return n;
    });
  };

  const evaluateRhythm = (taps: number[]) => {
    if (!currentPattern) return;
    const beats = currentPattern.beats;
    let totalErr = 0;
    let matched = 0;
    const tol = 250;
    taps.forEach((t) => {
      let min = Infinity;
      beats.forEach((b) => {
        const e = Math.abs(t - b);
        if (e < min) min = e;
      });
      if (min < tol) {
        matched++;
        totalErr += min;
      }
    });
    const acc = matched / beats.length;
    const ts = matched > 0 ? Math.max(0, 1 - totalErr / matched / tol) : 0;
    showResult("rhythm", acc * 0.6 + ts * 0.4);
  };

  const startPrecision = () => {
    setMode("precision");
    setPhase("target");
    setCircleResults([]);
    setCirclePhase(0);
    setClickedThisRound(false);
    spawnCircle(0);
  };

  const spawnCircle = (i: number) => {
    if (i >= TOTAL_CIRCLES) return;
    const pos = CIRCLE_POSITIONS[i];
    const duration = 2200 - i * 150;
    const size = 90 - i * 6;
    setActiveCircle({
      id: Date.now(),
      x: pos.x,
      y: pos.y,
      startTime: Date.now(),
      duration,
      size,
    });
    setClickedThisRound(false);
    setCirclePhase(i);
    const timeoutId = window.setTimeout(() => {
      setCircleResults((prev) => [...prev, { hit: false, timing: 1 }]);
      setActiveCircle(null);
      window.setTimeout(() => spawnCircle(i + 1), 400);
    }, duration);
    circleTimerRef.current = timeoutId;
  };

  const handleCircleClick = () => {
    if (!activeCircle || phase !== "target" || clickedThisRound) return;
    setClickedThisRound(true);
    if (circleTimerRef.current) {
      clearTimeout(circleTimerRef.current);
    }
    const progress =
      (Date.now() - activeCircle.startTime) / activeCircle.duration;
    const accuracy = 1 - Math.min(1, Math.abs(progress - 0.7) / 0.4);
    const ctx = getAudioCtx();
    if (accuracy > 0.5) {
      createBeep(ctx, 880, 0.1, 0.25);
    } else {
      createBeep(ctx, 300, 0.15, 0.2);
    }
    analyzerRef.current.trackClick(Date.now());
    setCircleResults((prev) => [
      ...prev,
      { hit: accuracy > 0.3, timing: accuracy },
    ]);
    setActiveCircle(null);
    window.setTimeout(() => spawnCircle(circlePhase + 1), 500);
  };

  useEffect(() => {
    if (circleResults.length === TOTAL_CIRCLES && phase === "target") {
      const hits = circleResults.filter((r) => r.hit).length;
      const avg =
        circleResults.reduce((a, r) => a + r.timing, 0) / TOTAL_CIRCLES;
      showResult("precision", (hits / TOTAL_CIRCLES) * 0.5 + avg * 0.5);
    }
  }, [circleResults, phase]);

  const showResult = (m: "rhythm" | "precision", acc: number) => {
    setChecking(true);
    setPhase("checking");
    setTimeout(() => {
      const analysis = analyzerRef.current.analyze(m, acc);
      setResult(analysis);
      setChecking(false);
      setPhase("result");
    }, 2200);
  };

  const reset = () => {
    analyzerRef.current = new BehaviorAnalyzer();
    setPhase("idle");
    setMode(null);
    setResult(null);
    setHoverCheck(false);
    setBeatIndex(-1);
    setCurrentPattern(null);
    setUserTaps([]);
    setActiveCircle(null);
    setCircleResults([]);
    setCirclePhase(0);
    setClickedThisRound(false);
    setChecking(false);
    setHasReported(false);
  };

  const accent = "#4285f4";
  const green = "#22c55e";
  const red = "#ef4444";

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 3,
            border: "1px solid #d1d5db",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          {/* Idle checkbox */}
          {phase === "idle" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 18px",
                minHeight: 78,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <button
                  onClick={() => setPhase("select")}
                  onMouseEnter={() => setHoverCheck(true)}
                  onMouseLeave={() => setHoverCheck(false)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 3,
                    cursor: "pointer",
                    border: `2px solid ${hoverCheck ? "#6b7280" : "#9ca3af"}`,
                    background: hoverCheck ? "#f9fafb" : "#fff",
                    transition: "all 0.15s",
                  }}
                />
                <span style={{ fontSize: 14, color: "#1f2937" }}>
                  I&apos;m not a robot
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <svg width="30" height="30" viewBox="0 0 64 64" fill="none">
                  <path
                    d="M32 8C18.7 8 8 18.7 8 32s10.7 24 24 24 24-10.7 24-24S45.3 8 32 8z"
                    fill={accent}
                    opacity="0.1"
                  />
                  <path
                    d="M32 14c-9.9 0-18 8.1-18 18s8.1 18 18 18 18-8.1 18-18-8.1-18-18-18z"
                    stroke={accent}
                    strokeWidth="2.5"
                    fill="none"
                  />
                  <path
                    d="M25 32l5 5 9-10"
                    stroke={accent}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
                <span
                  style={{
                    fontSize: 7,
                    color: "#9ca3af",
                    fontWeight: 600,
                    letterSpacing: 0.3,
                  }}
                >
                  rhythmCAPTCHA
                </span>
              </div>
            </div>
          )}

          {/* Checking spinner */}
          {phase === "checking" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 18px",
                minHeight: 78,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 28, height: 28 }}>
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 28 28"
                    style={{ animation: "rhythmSpin 0.9s linear infinite" }}
                  >
                    <circle
                      cx="14"
                      cy="14"
                      r="11"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M14 3a11 11 0 0 1 11 11"
                      fill="none"
                      stroke={accent}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <span style={{ fontSize: 14, color: "#6b7280" }}>
                  Verifying...
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <svg width="30" height="30" viewBox="0 0 64 64" fill="none">
                  <path
                    d="M32 8C18.7 8 8 18.7 8 32s10.7 24 24 24 24-10.7 24-24S45.3 8 32 8z"
                    fill={accent}
                    opacity="0.1"
                  />
                  <path
                    d="M32 14c-9.9 0-18 8.1-18 18s8.1 18 18 18 18-8.1 18-18-8.1-18-18-18z"
                    stroke={accent}
                    strokeWidth="2.5"
                    fill="none"
                  />
                  <path
                    d="M25 32l5 5 9-10"
                    stroke={accent}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
                <span
                  style={{
                    fontSize: 7,
                    color: "#9ca3af",
                    fontWeight: 600,
                    letterSpacing: 0.3,
                  }}
                >
                  rhythmCAPTCHA
                </span>
              </div>
            </div>
          )}

          {/* Result row */}
          {phase === "result" && result && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 18px",
                minHeight: 78,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: result.isHuman ? green : red,
                    animation: result.isHuman
                      ? "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)"
                      : "shake 0.4s ease",
                  }}
                >
                  {result.isHuman ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8.5l3.5 3.5 6.5-7"
                        stroke="#fff"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M3 3l8 8M11 3l-8 8"
                        stroke="#fff"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 14, color: "#1f2937" }}>
                  {result.isHuman
                    ? "Verification complete"
                    : "Verification failed"}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <svg width="30" height="30" viewBox="0 0 64 64" fill="none">
                  <path
                    d="M32 8C18.7 8 8 18.7 8 32s10.7 24 24 24 24-10.7 24-24S45.3 8 32 8z"
                    fill={accent}
                    opacity="0.1"
                  />
                  <path
                    d="M32 14c-9.9 0-18 8.1-18 18s8.1 18 18 18 18-8.1 18-18-8.1-18-18-18z"
                    stroke={accent}
                    strokeWidth="2.5"
                    fill="none"
                  />
                  <path
                    d="M25 32l5 5 9-10"
                    stroke={accent}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
                <span
                  style={{
                    fontSize: 7,
                    color: "#9ca3af",
                    fontWeight: 600,
                    letterSpacing: 0.3,
                  }}
                >
                  rhythmCAPTCHA
                </span>
              </div>
            </div>
          )}

          {/* Challenge panel */}
          {(phase === "select" ||
            phase === "listen" ||
            phase === "play" ||
            phase === "target") && (
            <div>
              <div
                style={{
                  background: `linear-gradient(135deg, ${accent} 0%, #5c9cf5 100%)`,
                  padding: "14px 18px",
                  color: "#fff",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    opacity: 0.85,
                    marginBottom: 3,
                  }}
                >
                  Verification Challenge
                </div>
                <div
                  style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}
                >
                  {phase === "select" && "Select a challenge type"}
                  {phase === "listen" && "Listen to the rhythm..."}
                  {phase === "play" && "Now tap the rhythm back"}
                  {phase === "target" &&
                    `Click the closing ring · ${circlePhase + 1}/${TOTAL_CIRCLES}`}
                </div>
                {phase === "select" && (
                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.8,
                      marginTop: 3,
                    }}
                  >
                    Prove you&apos;re human with timing or precision
                  </div>
                )}
              </div>

              <div style={{ padding: "16px 18px", background: "#f9fafb" }}>
                {/* Mode select cards */}
                {phase === "select" && (
                  <div style={{ display: "flex", gap: 10 }}>
                    {[
                      {
                        id: "rhythm" as const,
                        emoji: "🎵",
                        label: "Rhythm",
                        sub: "Tap the beat back",
                      },
                      {
                        id: "precision" as const,
                        emoji: "◎",
                        label: "Precision",
                        sub: "Hit closing rings",
                      },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setMode(opt.id);
                          opt.id === "rhythm" ? startListen() : startPrecision();
                        }}
                        style={{
                          flex: 1,
                          padding: "18px 12px",
                          background: "#fff",
                          border: "2px solid #e5e7eb",
                          borderRadius: 8,
                          cursor: "pointer",
                          textAlign: "center",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = accent;
                          e.currentTarget.style.background = "#f0f6ff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#e5e7eb";
                          e.currentTarget.style.background = "#fff";
                        }}
                      >
                        <div style={{ fontSize: 26, marginBottom: 5 }}>
                          {opt.emoji}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#1f2937",
                          }}
                        >
                          {opt.label}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#6b7280",
                            marginTop: 2,
                          }}
                        >
                          {opt.sub}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Rhythm listen */}
                {mode === "rhythm" && phase === "listen" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: "14px 0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        marginBottom: 18,
                      }}
                    >
                      {currentPattern?.beats.map((_, i) => (
                        <div
                          key={i}
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            background:
                              i === beatIndex ? accent : "#e5e7eb",
                            boxShadow:
                              i === beatIndex
                                ? `0 0 10px ${accent}`
                                : "none",
                            transition: "all 0.1s",
                          }}
                        />
                      ))}
                    </div>
                    <div
                      style={{
                        width: 88,
                        height: 88,
                        borderRadius: "50%",
                        background:
                          beatIndex >= 0
                            ? `radial-gradient(circle,rgba(66,133,244,0.15),transparent 70%)`
                            : `radial-gradient(circle,rgba(66,133,244,0.04),transparent 70%)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.1s",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 30,
                          transform:
                            beatIndex >= 0 ? "scale(1.15)" : "scale(1)",
                          transition: "transform 0.1s",
                        }}
                      >
                        🔊
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                        marginTop: 12,
                      }}
                    >
                      Pattern:{" "}
                      <span
                        style={{
                          color: accent,
                          fontWeight: 600,
                        }}
                      >
                        {currentPattern?.name}
                      </span>
                    </div>
                  </div>
                )}

                {/* Rhythm play */}
                {mode === "rhythm" && phase === "play" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: "8px 0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 5,
                        marginBottom: 14,
                      }}
                    >
                      {currentPattern?.beats.map((_, i) => (
                        <div
                          key={i}
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background:
                              i < userTaps.length ? accent : "#e5e7eb",
                            transition: "all 0.15s",
                          }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={handleRhythmTap}
                      style={{
                        width: 110,
                        height: 110,
                        borderRadius: "50%",
                        border: `3px solid ${accent}`,
                        background: "rgba(66,133,244,0.04)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        transition: "all 0.08s",
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = "scale(0.93)";
                        e.currentTarget.style.background =
                          "rgba(66,133,244,0.12)";
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.background =
                          "rgba(66,133,244,0.04)";
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: accent,
                        }}
                      >
                        TAP
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: "#9ca3af",
                          marginTop: 2,
                        }}
                      >
                        {userTaps.length}/{currentPattern?.beats.length}
                      </span>
                    </button>
                    <button
                      onClick={startListen}
                      style={{
                        marginTop: 12,
                        padding: "6px 14px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 500,
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                        color: "#4b5563",
                        cursor: "pointer",
                      }}
                    >
                      ↻ Replay
                    </button>
                  </div>
                )}

                {/* Precision */}
                {mode === "precision" && phase === "target" && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        gap: 5,
                        justifyContent: "center",
                        marginBottom: 10,
                      }}
                    >
                      {Array.from({ length: TOTAL_CIRCLES }).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: circleResults[i]
                              ? circleResults[i].hit
                                ? green
                                : red
                              : i === circlePhase
                              ? "rgba(66,133,244,0.4)"
                              : "#e5e7eb",
                            transition: "all 0.2s",
                          }}
                        />
                      ))}
                    </div>
                    <div
                      onClick={handleCircleClick}
                      style={{
                        position: "relative",
                        width: "100%",
                        height: 210,
                        background: "#fff",
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                        cursor: activeCircle ? "crosshair" : "default",
                        overflow: "hidden",
                      }}
                    >
                      {[25, 50, 75].map((p) => (
                        <div
                          key={`h${p}`}
                          style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: `${p}%`,
                            height: 1,
                            background: "#f3f4f6",
                          }}
                        />
                      ))}
                      {[25, 50, 75].map((p) => (
                        <div
                          key={`v${p}`}
                          style={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            left: `${p}%`,
                            width: 1,
                            background: "#f3f4f6",
                          }}
                        />
                      ))}

                      {activeCircle && (
                        <div
                          style={{
                            position: "absolute",
                            left: `${activeCircle.x}%`,
                            top: `${activeCircle.y}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                        >
                          <div
                            style={{
                              width: activeCircle.size,
                              height: activeCircle.size,
                              borderRadius: "50%",
                              border: "2px dashed #d1d5db",
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                            }}
                          />
                          <div
                            style={{
                              width: activeCircle.size * 0.35,
                              height: activeCircle.size * 0.35,
                              borderRadius: "50%",
                              border: "1.5px solid rgba(66,133,244,0.3)",
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                            }}
                          />
                          <div
                            style={{
                              width: activeCircle.size,
                              height: activeCircle.size,
                              borderRadius: "50%",
                              border: "3px solid rgba(66,133,244,0.45)",
                              background: "transparent",
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              animation: `rhythmRingShrink ${activeCircle.duration}ms linear forwards`,
                              transformOrigin: "center center",
                            }}
                          />
                          <div
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              background: accent,
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#9ca3af",
                        textAlign: "center",
                        marginTop: 8,
                      }}
                    >
                      Click when ring{" "}
                      <span
                        style={{
                          color: accent,
                          fontWeight: 600,
                        }}
                      >
                        turns blue
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Result detail */}
          {phase === "result" && result && (
            <div
              style={{
                borderTop: "1px solid #e5e7eb",
                background: "#f9fafb",
                padding: "12px 18px",
              }}
            >
              <details>
                <summary
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#6b7280",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  AI Analysis · Score {result.total}/100 ·{" "}
                  {result.confidence}% confidence
                </summary>
                <div style={{ marginTop: 10 }}>
                  {[
                    {
                      label: "Path Naturalness",
                      val: result.scores.pathNaturalness,
                      max: 25,
                      col: accent,
                    },
                    {
                      label: "Timing Humanness",
                      val: result.scores.timingHumanness,
                      max: 25,
                      col: "#5c9cf5",
                    },
                    {
                      label: "Bio Signal (Tremor)",
                      val: result.scores.bioSignal,
                      max: 15,
                      col: "#8b5cf6",
                    },
                    {
                      label: "Velocity Profile",
                      val: result.scores.velocityProfile,
                      max: 15,
                      col: "#f59e0b",
                    },
                    {
                      label: "Task Accuracy",
                      val: result.scores.taskAccuracy,
                      max: 20,
                      col:
                        result.scores.taskAccuracy >= 12 ? green : red,
                    },
                  ].map((s) => (
                    <div key={s.label} style={{ marginBottom: 6 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 10,
                          color: "#6b7280",
                          marginBottom: 2,
                        }}
                      >
                        <span>{s.label}</span>
                        <span
                          style={{
                            color: s.col,
                            fontWeight: 600,
                          }}
                        >
                          {s.val}/{s.max}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 3,
                          background: "#e5e7eb",
                          borderRadius: 2,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${(s.val / s.max) * 100}%`,
                            background: s.col,
                            borderRadius: 2,
                            transition:
                              "width 0.8s cubic-bezier(0.16,1,0.3,1)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <details style={{ marginTop: 8 }}>
                    <summary
                      style={{
                        fontSize: 10,
                        color: "#9ca3af",
                        cursor: "pointer",
                      }}
                    >
                      Raw Telemetry
                    </summary>
                    <div
                      style={{
                        marginTop: 5,
                        background: "#fff",
                        borderRadius: 6,
                        padding: 10,
                        border: "1px solid #e5e7eb",
                        fontSize: 10,
                        color: "#6b7280",
                        lineHeight: 1.8,
                      }}
                    >
                      {Object.entries(result.details).map(([k, v]) => (
                        <div
                          key={k}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>
                            {k.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                          <span
                            style={{
                              color: "#374151",
                              fontWeight: 500,
                            }}
                          >
                            {v}
                          </span>
                        </div>
                      ))}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>session duration</span>
                        <span
                          style={{
                            color: "#374151",
                            fontWeight: 500,
                          }}
                        >
                          {(result.totalTime / 1000).toFixed(1)}s
                        </span>
                      </div>
                    </div>
                  </details>
                </div>
              </details>
              {!result.isHuman && (
                <button
                  onClick={reset}
                  style={{
                    width: "100%",
                    marginTop: 10,
                    padding: "9px",
                    borderRadius: 6,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    color: "#374151",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Try again
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "8px 4px",
            fontSize: 9,
            color: "#9ca3af",
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ cursor: "pointer" }}>Privacy</span>
            <span style={{ cursor: "pointer" }}>Terms</span>
          </div>
          <span>AI-powered verification</span>
        </div>
      </div>

      <style>
        {`
        @keyframes popIn { 0%{transform:scale(0)} 60%{transform:scale(1.15)} 100%{transform:scale(1)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-4px)} 40%{transform:translateX(4px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(2px)} }
        @keyframes rhythmSpin { to { transform: rotate(360deg); } }
        @keyframes rhythmRingShrink {
          0% { transform: translate(-50%,-50%) scale(1); border-color: rgba(66,133,244,0.45); }
          50% { transform: translate(-50%,-50%) scale(0.5); border-color: rgba(66,133,244,0.45); }
          55% { border-color: #4285f4; background: rgba(66,133,244,0.06); box-shadow: 0 0 14px rgba(66,133,244,0.2); }
          75% { transform: translate(-50%,-50%) scale(0.25); border-color: #4285f4; }
          85% { border-color: #ef4444; background: transparent; box-shadow: none; }
          100% { transform: translate(-50%,-50%) scale(0.01); border-color: #ef4444; }
        }
        *{box-sizing:border-box;margin:0;padding:0}
        button{font-family:inherit}
      `}
      </style>
    </div>
  );
}

