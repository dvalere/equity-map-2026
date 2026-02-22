import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, ExternalLink, Clock, MapPin } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  actionCards?: ActionCard[];
}

interface ActionCard {
  title: string;
  detail: string;
  icon: "clock" | "map" | "link";
  action?: string;
}

const WELCOME: Message = {
  role: "assistant",
  content: "Hi! I'm your AI Policy Navigator, powered by Gemini. I can help you understand the 2026 OBBBA changes and check your eligibility for SNAP, Medicaid, and other benefits. How can I help?",
};

const MOCK_RESPONSES: Record<string, Message> = {
  snap: {
    role: "assistant",
    content: "Under the 2026 OBBBA, SNAP eligibility now requires **80 hours/month** of work, education, or community service for adults 18-59. Here are resources to help:",
    actionCards: [
      { title: "SNAP Work Requirement Calculator", detail: "Check if your activities qualify toward the 80-hour requirement", icon: "clock" },
      { title: "Ward 8 Food Pantry", detail: "Immediate food assistance while you apply — no ID required", icon: "map", action: "Navigate" },
      { title: "DC SNAP Application Portal", detail: "Apply or renew your benefits online", icon: "link" },
    ],
  },
  medicaid: {
    role: "assistant",
    content: "Medicaid eligibility has tightened under OBBBA. Here's what you need to know for D.C. residents:",
    actionCards: [
      { title: "Medicaid Eligibility Check", detail: "See if you qualify under the updated income thresholds", icon: "clock" },
      { title: "Unity Health Clinic", detail: "Walk-in care available, accepts Medicaid — Ward 7", icon: "map", action: "Navigate" },
      { title: "Emergency Coverage Info", detail: "What's still covered even without full Medicaid", icon: "link" },
    ],
  },
  default: {
    role: "assistant",
    content: "I can help you with **SNAP benefits**, **Medicaid eligibility**, and finding **local resources** in Wards 7 & 8. Try asking me about the new work requirements or where to find food assistance.",
  },
};

const getResponse = (input: string): Message => {
  const lower = input.toLowerCase();
  if (lower.includes("snap") || lower.includes("food") || lower.includes("ebt")) return MOCK_RESPONSES.snap;
  if (lower.includes("medicaid") || lower.includes("health") || lower.includes("doctor")) return MOCK_RESPONSES.medicaid;
  return MOCK_RESPONSES.default;
};

const iconMap = {
  clock: Clock,
  map: MapPin,
  link: ExternalLink,
};

const AIChatBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, getResponse(input)]);
      setTyping(false);
    }, 1200);
  };

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 z-40 w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-lg glow-primary flex items-center justify-center hover:scale-105 transition-transform animate-float"
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
                <p className="text-sm font-display font-semibold text-foreground">Policy Navigator</p>
                <p className="text-[10px] text-muted-foreground">Gemini-powered • EquityMap</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-secondary transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"} rounded-2xl px-4 py-2.5 text-sm`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.actionCards && (
                    <div className="mt-3 space-y-2">
                      {msg.actionCards.map((card, j) => {
                        const Icon = iconMap[card.icon];
                        return (
                          <div key={j} className="bg-background/40 rounded-xl p-3 border border-border/50">
                            <div className="flex items-start gap-2">
                              <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Icon className="w-3 h-3 text-accent" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-foreground">{card.title}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{card.detail}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-2xl px-4 py-3 flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border/50">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                placeholder="Ask about SNAP, Medicaid, benefits..."
                className="flex-1 bg-secondary rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={send}
                disabled={!input.trim()}
                className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatBot;
