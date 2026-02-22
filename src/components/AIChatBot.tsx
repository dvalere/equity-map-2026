import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2, ClipboardCheck } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface QuickReply {
  label: string;
  value: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  quickReplies?: QuickReply[];
}

const SYSTEM_INSTRUCTION =
  "You are EquityGuide (2026). You help DC residents understand the 2026 federal budget changes " +
  "and navigate SNAP, Medicaid, and community resources across Washington, D.C. " +
  "Key facts: New rules introduce an 80-hour/month work requirement for SNAP benefits for adults 18-59. " +
  "Qualifying activities include employment, job training, education, community service, and Federal Work-Study. " +
  "Students with Federal Work-Study should know their hours count toward this requirement. " +
  "Rules: Keep responses concise (under 150 words). Never invent URLs or links. Never make up acronym definitions. " +
  "If unsure about a detail, say so. Be empathetic but factual.";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: SYSTEM_INSTRUCTION,
});

const FALLBACK_RESPONSES: Record<string, string> = {
  snap:
    "Under the 2026 federal budget changes, SNAP eligibility now requires 80 hours/month of work, education, or community service for adults 18–59. If you're a student with Federal Work-Study, those hours count toward that requirement. You can check your eligibility and apply at the DC SNAP portal or visit a local enrollment center.",
  medicaid:
    "Medicaid eligibility has tightened under the 2026 federal budget changes. Income thresholds have been adjusted, and documentation requirements are stricter. Many health centers in DC still offer sliding-scale fees and accept Medicaid — use the map to find walk-in clinics near you. If you've lost coverage, contact DC Health Link to explore your options.",
  work:
    "The 80-hour work rule under the 2026 federal budget changes requires adults aged 18–59 to complete 80 hours per month of qualifying activities to maintain SNAP benefits. Qualifying activities include: employment, job training, education, community service, and Federal Work-Study. Students with work-study: your hours count toward this requirement, so make sure to document them.",
  student:
    "Students have several resources available. Your Federal Work-Study hours count toward the 80-hour work requirement for SNAP eligibility. Many universities also offer emergency meal programs, textbook assistance, and campus health services. Check with your Financial Aid office for details on maximizing your benefits.",
  benefit:
    "The 2026 federal budget has introduced significant changes to benefit programs across D.C., including stricter SNAP work requirements (80 hrs/month), tightened Medicaid eligibility, and reduced funding for community health programs. EquityMap is here to help you navigate these changes and find available resources.",
  default:
    "I can help you understand the 2026 federal policy changes and find resources in DC. Try asking about:\n\n• The 80-hour work rule for SNAP\n• Medicaid eligibility changes\n• Student benefits & work-study\n• Finding food or healthcare resources near you\n\nWhat would you like to know?",
};

const getFallbackResponse = (input: string): string => {
  const lower = input.toLowerCase();
  if (lower.includes("80") || lower.includes("work rule") || lower.includes("work requirement"))
    return FALLBACK_RESPONSES.work;
  if (lower.includes("snap") || lower.includes("food") || lower.includes("ebt"))
    return FALLBACK_RESPONSES.snap;
  if (lower.includes("medicaid") || lower.includes("health") || lower.includes("doctor") || lower.includes("clinic"))
    return FALLBACK_RESPONSES.medicaid;
  if (lower.includes("student") || lower.includes("work-study") || lower.includes("work study") || lower.includes("college") || lower.includes("university"))
    return FALLBACK_RESPONSES.student;
  if (lower.includes("benefit") || lower.includes("budget") || lower.includes("cut"))
    return FALLBACK_RESPONSES.benefit;
  return FALLBACK_RESPONSES.default;
};

// --- Eligibility Screener Flow ---

interface ScreenerState {
  step: "age" | "activity" | "hours" | "workStudy" | "done";
  age?: string;
  activity?: string;
  hours?: string;
  workStudy?: string;
}

const SCREENER_QUESTIONS: Record<string, { text: string; replies: QuickReply[] }> = {
  age: {
    text: "Let's check your SNAP eligibility. First — how old are you?",
    replies: [
      { label: "Under 18", value: "under18" },
      { label: "18–59", value: "18to59" },
      { label: "60+", value: "60plus" },
    ],
  },
  activity: {
    text: "Got it. Are you currently engaged in any of these activities?",
    replies: [
      { label: "Employed", value: "employed" },
      { label: "Student", value: "student" },
      { label: "Job Training", value: "training" },
      { label: "Community Service", value: "service" },
      { label: "None of these", value: "none" },
    ],
  },
  hours: {
    text: "How many hours per month do you spend on that activity?",
    replies: [
      { label: "Less than 40", value: "lt40" },
      { label: "40–79", value: "40to79" },
      { label: "80+", value: "80plus" },
    ],
  },
  workStudy: {
    text: "Do you have Federal Work-Study through your university?",
    replies: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
      { label: "Not sure", value: "unsure" },
    ],
  },
};

const buildScreenerResult = (state: ScreenerState): string => {
  if (state.age === "under18") {
    return "Since you're under 18, the 80-hour work requirement does not apply to you. You may still be eligible for SNAP through your household. Check with a parent or guardian to see if your household qualifies.";
  }
  if (state.age === "60plus") {
    return "Since you're 60 or older, you are exempt from the 80-hour work requirement. You may qualify for SNAP based on income alone. Visit your local SNAP enrollment center or use the map to find one near you.";
  }

  const meetsHours = state.hours === "80plus";
  const hasWorkStudy = state.workStudy === "yes";
  const isStudent = state.activity === "student";
  const noActivity = state.activity === "none";

  if (noActivity) {
    return "Based on your responses, you may not currently meet the 80-hour work requirement for SNAP. However, you can qualify by starting any of these: employment, job training, education, community service, or volunteer work. Use the map to find enrollment centers and community organizations near you that can help.";
  }

  if (meetsHours) {
    return "Based on your responses, you likely meet the 80-hour work requirement for SNAP eligibility. Make sure to document your hours — pay stubs, school enrollment verification, or community service logs all count. Visit a SNAP enrollment center to complete your application.";
  }

  if (isStudent && hasWorkStudy) {
    return "As a student with Federal Work-Study, your work-study hours count toward the 80-hour requirement. Combined with your class hours, you likely meet the threshold. Make sure to get documentation from your Financial Aid office and keep your work-study pay stubs.";
  }

  if (isStudent && state.workStudy === "unsure") {
    return "If you're a student, check with your Financial Aid office about Federal Work-Study — those hours count toward the 80-hour requirement. Many students qualify without realizing it. Your academic enrollment may also count as a qualifying activity.";
  }

  return "Based on your responses, you're close but may need additional qualifying hours to meet the 80-hour monthly requirement. Consider supplementing with community service or volunteer work. Use the map to find organizations near you, and visit a SNAP enrollment center for a full eligibility review.";
};

// --- Component ---

const WELCOME: Message = {
  role: "assistant",
  content:
    "Hi! I'm EquityGuide, your AI-powered assistant for navigating food, medical, and community resources across D.C. How can I help?",
  quickReplies: [
    { label: "Check my SNAP eligibility", value: "__screener__" },
    { label: "What's the 80-hour rule?", value: "What is the 80-hour work rule?" },
    { label: "Find health resources", value: "Where can I find healthcare in DC?" },
  ],
};

const AIChatBot = ({ fabOffset = false }: { fabOffset?: boolean }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [screener, setScreener] = useState<ScreenerState | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<ReturnType<typeof model.startChat> | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const getOrCreateChat = () => {
    if (!chatRef.current) {
      const history = messages
        .filter((m) => m !== WELCOME)
        .map((m) => ({
          role: m.role === "user" ? ("user" as const) : ("model" as const),
          parts: [{ text: m.content }],
        }));

      const firstUserIdx = history.findIndex((m) => m.role === "user");
      const validHistory = firstUserIdx >= 0 ? history.slice(firstUserIdx) : [];

      chatRef.current = model.startChat({ history: validHistory });
    }
    return chatRef.current;
  };

  const sendToAI = async (text: string) => {
    setLoading(true);
    try {
      const chat = getOrCreateChat();
      const result = await chat.sendMessage(text);
      const response = result.response.text();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
    } catch (err) {
      chatRef.current = null;
      const raw = err instanceof Error ? err.message : "";
      const isQuota = raw.includes("429") || raw.toLowerCase().includes("quota");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: isQuota
            ? getFallbackResponse(text)
            : `Error: ${raw}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startScreener = () => {
    const q = SCREENER_QUESTIONS.age;
    setScreener({ step: "age" });
    setMessages((prev) => [
      ...prev,
      { role: "user", content: "Check my SNAP eligibility" },
      { role: "assistant", content: q.text, quickReplies: q.replies },
    ]);
  };

  const advanceScreener = (value: string, label: string) => {
    if (!screener) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: label },
    ]);

    const updated = { ...screener };

    if (screener.step === "age") {
      updated.age = value;
      if (value === "under18" || value === "60plus") {
        updated.step = "done";
        const result = buildScreenerResult(updated);
        setMessages((prev) => [...prev, { role: "assistant", content: result }]);
        setScreener(null);
        return;
      }
      updated.step = "activity";
    } else if (screener.step === "activity") {
      updated.activity = value;
      if (value === "none") {
        updated.step = "done";
        const result = buildScreenerResult(updated);
        setMessages((prev) => [...prev, { role: "assistant", content: result }]);
        setScreener(null);
        return;
      }
      updated.step = "hours";
    } else if (screener.step === "hours") {
      updated.hours = value;
      if (updated.activity === "student") {
        updated.step = "workStudy";
      } else {
        updated.step = "done";
        const result = buildScreenerResult(updated);
        setMessages((prev) => [...prev, { role: "assistant", content: result }]);
        setScreener(null);
        return;
      }
    } else if (screener.step === "workStudy") {
      updated.workStudy = value;
      updated.step = "done";
      const result = buildScreenerResult(updated);
      setMessages((prev) => [...prev, { role: "assistant", content: result }]);
      setScreener(null);
      return;
    }

    setScreener(updated);
    const nextQ = SCREENER_QUESTIONS[updated.step];
    if (nextQ) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: nextQ.text, quickReplies: nextQ.replies },
      ]);
    }
  };

  const handleQuickReply = (reply: QuickReply) => {
    if (reply.value === "__screener__") {
      startScreener();
      return;
    }

    if (screener) {
      advanceScreener(reply.value, reply.label);
      return;
    }

    setMessages((prev) => [
      ...prev,
      { role: "user", content: reply.value },
    ]);
    sendToAI(reply.value);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");

    if (screener) {
      setScreener(null);
    }

    await sendToAI(text);
  };

  const lastMsg = messages[messages.length - 1];
  const showQuickReplies = lastMsg?.role === "assistant" && lastMsg?.quickReplies && !loading;

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={`fixed right-4 z-40 w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-lg glow-primary flex items-center justify-center hover:scale-105 transition-all duration-300 ${fabOffset ? "bottom-[48%]" : "bottom-20 animate-float"}`}
          aria-label="Open AI chat"
        >
          <Bot className="w-7 h-7" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed inset-0 z-50 md:inset-auto md:bottom-4 md:right-4 md:w-96 md:h-[600px] md:rounded-2xl flex flex-col glass-strong md:shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-display font-semibold text-foreground">
                  EquityGuide
                </p>
                <p className="text-[10px] text-muted-foreground">
                  AI-powered &bull; EquityMap
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i}>
                <div
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    } rounded-2xl px-4 py-2.5 text-sm`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
                {/* Inline quick replies (for screener steps that aren't the last message) */}
                {msg.quickReplies && i < messages.length - 1 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
                    {msg.quickReplies.map((r) => (
                      <span
                        key={r.value}
                        className="text-[11px] px-3 py-1.5 rounded-full bg-secondary/60 text-muted-foreground border border-border/50"
                      >
                        {r.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-2xl px-4 py-3 flex gap-1">
                  <span
                    className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick reply buttons (active, for last message only) */}
          {showQuickReplies && (
            <div className="px-3 pb-1 flex flex-wrap gap-1.5">
              {lastMsg.quickReplies!.map((r) => (
                <button
                  key={r.value}
                  onClick={() => handleQuickReply(r)}
                  className="text-[11px] px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/25 font-medium hover:bg-primary/20 transition-colors"
                >
                  {r.value === "__screener__" && (
                    <ClipboardCheck className="w-3 h-3 inline mr-1 -mt-0.5" />
                  )}
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border/50">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask about SNAP, Medicaid, benefits..."
                className="flex-1 bg-secondary rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={loading}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatBot;
