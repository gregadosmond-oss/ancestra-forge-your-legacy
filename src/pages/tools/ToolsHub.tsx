import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Calendar, Shield, ScrollText, User, Compass, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import FreeToolsEmailCTA from "@/components/FreeToolsEmailCTA";
import ScrollChevron from "@/components/ScrollChevron";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useRememberedSurname } from "@/hooks/useRememberedSurname";

// ───────────────────────── shared types ─────────────────────────
type SurnameResult = {
  surname: string;
  meaning: string;
  origin: string;
  dateFirstRecorded: string;
  ancestralRole: string;
  motto?: string;
  famousBearers?: string;
  migration?: string;
  coatOfArmsHint?: string;
};

type AncestorResult = {
  name: string;
  birthYear: string;
  occupation: string;
  location: string;
  personality: string;
  dailyLife: string;
  skills: string[];
  quote: string;
};

type Life1700s = {
  name: string;
  occupation: string;
  location: string;
  homeDescription: string;
  dailyRoutine: string;
  diet: string;
  dangers: string;
  lifeExpectancy: string;
  legacyLine: string;
};

type MottoResult = {
  mottoLatin: string;
  mottoEnglish: string;
  breakdown: { latin: string; english: string }[];
  legacySentence: string;
};

type QuizResult = {
  archetype: string;
  description: string;
  traits: string[];
  historicalExample: string;
  motto: string;
};

type ChatMessage = { role: "user" | "ancestor"; text: string };

// ───────────────────────── icons ─────────────────────────
const ICONS = {
  surname: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4a04a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  ancestor: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4a04a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  clock: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4a04a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  chat: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4a04a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  motto: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4a04a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  quiz: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4a04a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

// ───────────────────────── reusable card shell ─────────────────────────
function ToolCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-[22px] p-7 sm:p-9"
      style={{
        background: "#1a1510",
        border: "1px solid rgba(212,160,74,0.32)",
      }}
    >
      <div className="mb-5 flex items-center gap-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "rgba(232,148,58,0.08)", border: "1px solid rgba(212,160,74,0.25)" }}
        >
          {icon}
        </div>
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[3px]" style={{ color: "#a07830" }}>
            Free
          </p>
          <h3 className="font-display text-2xl text-cream-warm">{title}</h3>
        </div>
      </div>
      {children}
    </section>
  );
}

const inputClass =
  "rounded-pill border border-gold-line bg-input px-6 py-4 font-sans text-foreground placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-ring";

const primaryBtnStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #e8943a, #c47828)",
  color: "#1a1208",
};
const primaryBtnClass =
  "self-start rounded-pill px-10 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-[400ms] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0";

// ───────────────────────── Section 1: Surname Meaning ─────────────────────────
const baseCards = [
  { key: "meaning" as const, label: "Meaning", icon: Search },
  { key: "origin" as const, label: "Origin", icon: MapPin },
  { key: "dateFirstRecorded" as const, label: "Era", icon: Calendar },
  { key: "ancestralRole" as const, label: "Ancestral Role", icon: Shield },
];
const extraCards = [
  { key: "motto" as const, label: "House Motto", icon: ScrollText },
  { key: "famousBearers" as const, label: "Famous Bearers", icon: User },
  { key: "migration" as const, label: "Migration", icon: Compass },
  { key: "coatOfArmsHint" as const, label: "Coat of Arms", icon: Crown },
];

function SurnameMeaningSection({ surname }: { surname: string }) {
  const [result, setResult] = useState<SurnameResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetched = useRef<string>("");

  useEffect(() => {
    const s = surname.trim();
    if (!s) {
      setResult(null);
      setError(null);
      lastFetched.current = "";
      return;
    }
    if (s.toLowerCase() === lastFetched.current) return;
    lastFetched.current = s.toLowerCase();

    let cancelled = false;
    setLoading(true);
    setError(null);
    setResult(null);
    (async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("surname-lookup", {
          body: { surname: s },
        });
        if (cancelled) return;
        if (fnError) throw new Error(fnError.message);
        if (!data || data.meaning === "UNKNOWN") {
          setError("We couldn't find information for that surname. Try another.");
          return;
        }
        setResult(data as SurnameResult);
      } catch {
        if (!cancelled) setError("Something went wrong. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [surname]);

  return (
    <ToolCard icon={ICONS.surname} title="Surname Meaning">
      {!surname.trim() && (
        <p className="font-serif italic text-text-dim">
          Enter your surname above to reveal its meaning, origin, and ancestral role.
        </p>
      )}
      {loading && <p className="font-serif italic text-text-body">Searching the archives…</p>}
      {error && <p className="font-sans text-sm text-rose">{error}</p>}
      {result && (
        <div className="grid gap-4 sm:grid-cols-2">
          {baseCards.map(({ key, label, icon: Icon }) => (
            <div key={key} className="rounded-xl border border-gold-line bg-card p-5">
              <div className="mb-2 flex items-center gap-2">
                <Icon className="h-4 w-4 text-amber" />
                <span className="font-sans text-[10px] uppercase tracking-[3px] text-amber-dim">{label}</span>
              </div>
              <p className="font-sans text-sm leading-relaxed text-text-body">{result[key]}</p>
            </div>
          ))}
          {extraCards.map(({ key, label, icon: Icon }) => {
            const value = result[key];
            if (!value || value === "UNKNOWN") return null;
            return (
              <div key={key} className="rounded-xl border border-gold-line bg-card p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-amber" />
                  <span className="font-sans text-[10px] uppercase tracking-[3px] text-amber-dim">{label}</span>
                </div>
                <p className="whitespace-pre-line font-sans text-sm leading-relaxed text-text-body">{value}</p>
              </div>
            );
          })}
        </div>
      )}
    </ToolCard>
  );
}

// ───────────────────────── Section 2: Meet Your Ancestor ─────────────────────────
function MeetAncestorSection({ initialSurname }: { initialSurname: string }) {
  const [surname, setSurname] = useState(initialSurname);
  const [country, setCountry] = useState("");
  const [result, setResult] = useState<AncestorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSurname(initialSurname);
  }, [initialSurname]);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surname.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("meet-ancestor", {
        body: { surname: surname.trim(), country: country.trim() },
      });
      if (fnError) throw new Error(fnError.message);
      if (!data || data.error) {
        setError(data?.error || "Something went wrong. Please try again.");
        return;
      }
      setResult(data as AncestorResult);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolCard icon={ICONS.ancestor} title="Meet Your Ancestor">
      <form onSubmit={run} className="flex flex-col gap-4">
        <input
          type="text"
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
          placeholder="Surname"
          maxLength={60}
          className={inputClass}
        />
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="Country of origin (optional)"
          maxLength={60}
          className={inputClass}
        />
        <button type="submit" disabled={loading || !surname.trim()} className={primaryBtnClass} style={primaryBtnStyle}>
          {loading ? "Travelling back in time…" : "Generate Ancestor"}
        </button>
      </form>
      {error && <p className="mt-4 font-sans text-sm text-rose">{error}</p>}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-6"
          >
            <div
              className="rounded-[18px] p-6 text-center"
              style={{ background: "rgba(26,21,14,0.95)", border: "1px solid rgba(232,148,58,0.2)" }}
            >
              <p className="mb-2 font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">Your Ancestor</p>
              <h4 className="font-display text-2xl leading-tight text-cream-warm">{result.name}</h4>
              <p className="mt-1 font-sans text-[13px]" style={{ color: "#a07830" }}>
                {result.birthYear} · {result.location}
              </p>
              <p className="mt-4 font-serif italic leading-relaxed text-cream-soft">"{result.quote}"</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { label: "Occupation", value: result.occupation },
                { label: "Personality", value: result.personality },
                { label: "Daily Life", value: result.dailyLife },
                { label: "Skills", value: result.skills.join(", ") },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-gold-line bg-card p-5">
                  <p className="mb-2 font-sans text-[10px] uppercase tracking-[3px] text-amber-dim">{label}</p>
                  <p className="font-sans text-sm leading-relaxed text-text-body">{value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ToolCard>
  );
}

// ───────────────────────── Section 3: The 1700s You ─────────────────────────
const DETAIL_1700S = [
  { key: "occupation" as const, label: "Your Occupation" },
  { key: "location" as const, label: "Where You Lived" },
  { key: "homeDescription" as const, label: "Your Home" },
  { key: "dailyRoutine" as const, label: "Your Daily Routine" },
  { key: "diet" as const, label: "What You Ate" },
  { key: "dangers" as const, label: "Dangers You Faced" },
];

function The1700sSection({ initialSurname }: { initialSurname: string }) {
  const [surname, setSurname] = useState(initialSurname);
  const [country, setCountry] = useState("");
  const [result, setResult] = useState<Life1700s | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSurname(initialSurname);
  }, [initialSurname]);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surname.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("the-1700s-you", {
        body: { surname: surname.trim(), country: country.trim() },
      });
      if (fnError) throw new Error(fnError.message);
      if (!data || data.error) {
        setError(data?.error || "Something went wrong. Please try again.");
        return;
      }
      setResult(data as Life1700s);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolCard icon={ICONS.clock} title="The 1700s You">
      <form onSubmit={run} className="flex flex-col gap-4">
        <input
          type="text"
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
          placeholder="Surname"
          maxLength={60}
          className={inputClass}
        />
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="Country of origin (optional)"
          maxLength={60}
          className={inputClass}
        />
        <button type="submit" disabled={loading || !surname.trim()} className={primaryBtnClass} style={primaryBtnStyle}>
          {loading ? "Stepping back in time…" : "See Your 1700s Self"}
        </button>
      </form>
      {error && <p className="mt-4 font-sans text-sm text-rose">{error}</p>}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mt-6">
            <div
              className="rounded-[18px] p-6 text-center"
              style={{ background: "rgba(26,21,14,0.95)", border: "1px solid rgba(232,148,58,0.2)" }}
            >
              <p className="mb-2 font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">Your Life · circa 1720</p>
              <h4 className="font-display text-2xl leading-tight text-cream-warm">{result.name}</h4>
              <p className="mt-1 font-sans text-[13px]" style={{ color: "#a07830" }}>
                {result.occupation} · {result.location}
              </p>
              <p className="mt-4 font-sans text-[13px]" style={{ color: "#8a7e6e" }}>
                Life expectancy: <span style={{ color: "#c4b8a6" }}>{result.lifeExpectancy}</span>
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {DETAIL_1700S.map(({ key, label }) => (
                <div key={key} className="rounded-xl border border-gold-line bg-card p-5">
                  <p className="mb-2 font-sans text-[10px] uppercase tracking-[3px] text-amber-dim">{label}</p>
                  <p className="font-sans text-sm leading-relaxed text-text-body">{result[key]}</p>
                </div>
              ))}
            </div>
            <div
              className="mt-4 rounded-xl border border-gold-line bg-card p-6"
              style={{ borderLeft: "3px solid rgba(232,148,58,0.3)" }}
            >
              <p className="font-serif italic leading-relaxed text-cream-soft">{result.legacyLine}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ToolCard>
  );
}

// ───────────────────────── Section 4: Ancestor Chat ─────────────────────────
function AncestorChatSection({ initialSurname }: { initialSurname: string }) {
  const [surname, setSurname] = useState(initialSurname);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ancestorName, setAncestorName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSurname(initialSurname);
  }, [initialSurname]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const unlockAudio = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
  };

  const stopAudio = useCallback(() => {
    try { sourceRef.current?.stop(); } catch { /* */ }
    sourceRef.current = null;
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!voiceEnabled) return;
    stopAudio();
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("ancestor-tts", { body: { text } });
      if (fnErr || !data?.audio) return;
      const binary = atob(data.audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const ctx = audioCtxRef.current!;
      if (ctx.state === "suspended") await ctx.resume();
      const buf = await ctx.decodeAudioData(bytes.buffer);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      sourceRef.current = src;
      src.start(0);
    } catch { /* ignore */ }
  }, [voiceEnabled, stopAudio]);

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surname.trim() || loading) return;
    unlockAudio();
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("ancestor-chat", {
        body: { surname: surname.trim(), messages: [] },
      });
      if (fnError) throw new Error(fnError.message);
      if (!data || data.error) {
        setError(data?.error || "Something went wrong. Please try again.");
        return;
      }
      setAncestorName(data.ancestorName || `Ancestor ${surname}`);
      setMessages([{ role: "ancestor", text: data.reply }]);
      setStarted(true);
      speak(data.reply);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || loading) return;
    unlockAudio();
    const next: ChatMessage[] = [...messages, { role: "user", text: msg }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("ancestor-chat", {
        body: {
          surname: surname.trim(),
          messages: next.map((m) => ({ role: m.role, content: m.text })),
        },
      });
      if (fnError) throw new Error(fnError.message);
      const reply = data.reply || "…";
      setMessages((prev) => [...prev, { role: "ancestor", text: reply }]);
      speak(reply);
    } catch {
      setMessages((prev) => [...prev, { role: "ancestor", text: "I'm lost in the mists of time… try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolCard icon={ICONS.chat} title="Chat With Your Ancestor">
      {!started ? (
        <>
          <form onSubmit={start} className="flex flex-col gap-4 sm:flex-row">
            <input
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              placeholder="Surname"
              maxLength={60}
              className={`flex-1 ${inputClass}`}
            />
            <button type="submit" disabled={loading || !surname.trim()} className={primaryBtnClass} style={primaryBtnStyle}>
              {loading ? "Summoning…" : "Start Conversation"}
            </button>
          </form>
          {error && <p className="mt-4 font-sans text-sm text-rose">{error}</p>}
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">Speaking with</p>
              <p className="font-display text-lg text-cream-warm">{ancestorName}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setVoiceEnabled((v) => !v)}
                className="rounded-pill px-4 py-2 font-sans text-[10px] uppercase tracking-[1.5px]"
                style={{
                  border: "1px solid rgba(61,48,32,1)",
                  background: voiceEnabled ? "rgba(232,148,58,0.1)" : "transparent",
                  color: voiceEnabled ? "#d4a04a" : "#8a7e6e",
                }}
              >
                {voiceEnabled ? "Voice On" : "Voice Off"}
              </button>
              <button
                onClick={() => { stopAudio(); setStarted(false); setMessages([]); }}
                className="rounded-pill px-4 py-2 font-sans text-[10px] uppercase tracking-[1.5px]"
                style={{ border: "1px solid rgba(61,48,32,1)", color: "#8a7e6e" }}
              >
                New
              </button>
            </div>
          </div>

          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[85%] px-4 py-3"
                  style={
                    m.role === "ancestor"
                      ? {
                          background: "rgba(26,21,14,0.95)",
                          border: "1px solid rgba(212,160,74,0.12)",
                          color: "#c4b8a6",
                          fontFamily: "var(--font-serif, Libre Caslon Text, serif)",
                          fontStyle: "italic",
                          fontSize: "15px",
                          lineHeight: 1.7,
                          borderRadius: "4px 18px 18px 18px",
                        }
                      : {
                          background: "rgba(232,148,58,0.1)",
                          border: "1px solid rgba(232,148,58,0.2)",
                          color: "#e8ddd0",
                          fontFamily: "var(--font-sans, DM Sans, sans-serif)",
                          fontSize: "14px",
                          lineHeight: 1.6,
                          borderRadius: "18px 4px 18px 18px",
                        }
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <p className="font-serif italic text-text-dim">…</p>}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={send} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your ancestor something…"
              className={`flex-1 ${inputClass}`}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-pill px-6 py-3 font-sans text-[12px] font-semibold uppercase tracking-[1.5px] disabled:opacity-40"
              style={primaryBtnStyle}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </ToolCard>
  );
}

// ───────────────────────── Section 5: Motto Generator ─────────────────────────
const MOTTO_PLACEHOLDERS = ["Courage", "Family", "Loyalty"];
const MOTTO_LABELS = ["First Value", "Second Value", "Third Value"];

function MottoSection() {
  const [values, setValues] = useState(["", "", ""]);
  const [result, setResult] = useState<MottoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = values.every((v) => v.trim().length > 0) && !loading;

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("motto-generator", {
        body: { values: values.map((v) => v.trim()) },
      });
      if (fnError) throw new Error(fnError.message);
      if (!data || data.error) {
        setError(data?.error || "Something went wrong. Please try again.");
        return;
      }
      setResult(data as MottoResult);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolCard icon={ICONS.motto} title="Family Motto">
      <form onSubmit={run} className="flex flex-col gap-4">
        {values.map((v, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <label className="font-sans text-[10px] uppercase tracking-[3px] text-amber-dim">{MOTTO_LABELS[i]}</label>
            <input
              type="text"
              value={v}
              onChange={(e) => setValues((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))}
              placeholder={MOTTO_PLACEHOLDERS[i]}
              maxLength={60}
              className={inputClass}
            />
          </div>
        ))}
        <button type="submit" disabled={!canSubmit} className={primaryBtnClass} style={primaryBtnStyle}>
          {loading ? "Forging…" : "Generate Motto"}
        </button>
      </form>
      {error && <p className="mt-4 font-sans text-sm text-rose">{error}</p>}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mt-6">
            <div className="text-center">
              <h4 className="font-display text-amber-light" style={{ fontSize: "clamp(24px,4vw,36px)" }}>
                "{result.mottoLatin}"
              </h4>
              <p className="mt-2 font-serif italic text-cream-soft">{result.mottoEnglish}</p>
            </div>
            <div className="mt-5 rounded-xl border border-gold-line bg-card p-5">
              <p className="mb-3 font-sans text-[10px] uppercase tracking-[3px] text-amber-dim">Word-by-Word</p>
              <div className="flex flex-col gap-2">
                {result.breakdown.map((w, i) => (
                  <div key={i} className="flex items-baseline gap-3">
                    <span className="font-display text-amber">{w.latin}</span>
                    <span className="font-sans text-xs text-text-dim">—</span>
                    <span className="font-sans text-sm text-text-body">{w.english}</span>
                  </div>
                ))}
              </div>
            </div>
            <div
              className="mt-4 rounded-xl border border-gold-line bg-card p-5"
              style={{ borderLeft: "3px solid rgba(232,148,58,0.3)" }}
            >
              <p className="font-serif italic leading-relaxed text-cream-soft">{result.legacySentence}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ToolCard>
  );
}

// ───────────────────────── Section 6: Bloodline Quiz ─────────────────────────
const QUIZ_QUESTIONS = [
  {
    q: "When faced with a challenge, you...",
    options: [
      { letter: "A", text: "Fight through it head-on" },
      { letter: "B", text: "Build a plan and execute" },
      { letter: "C", text: "Explore every angle first" },
      { letter: "D", text: "Support those around you" },
    ],
  },
  {
    q: "Your family remembers you as...",
    options: [
      { letter: "A", text: "The protector" },
      { letter: "B", text: "The one who built things" },
      { letter: "C", text: "The adventurer" },
      { letter: "D", text: "The one who held everyone together" },
    ],
  },
  {
    q: "In a crisis, your instinct is to...",
    options: [
      { letter: "A", text: "Lead from the front" },
      { letter: "B", text: "Organise and solve" },
      { letter: "C", text: "Find a new path" },
      { letter: "D", text: "Keep people calm" },
    ],
  },
  {
    q: "Your greatest strength is...",
    options: [
      { letter: "A", text: "Courage" },
      { letter: "B", text: "Discipline" },
      { letter: "C", text: "Curiosity" },
      { letter: "D", text: "Empathy" },
    ],
  },
  {
    q: "The legacy you want to leave is...",
    options: [
      { letter: "A", text: "A name people respected" },
      { letter: "B", text: "Something that outlasts you" },
      { letter: "C", text: "Stories of where you went" },
      { letter: "D", text: "A family that stayed together" },
    ],
  },
];

function QuizSection() {
  const [step, setStep] = useState(0); // 0 = intro, 1-5 = q, 6 = result
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answer = async (letter: string) => {
    const next = [...answers, letter];
    setAnswers(next);
    if (next.length < 5) {
      setStep(step + 1);
      return;
    }
    setStep(6);
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("bloodline-quiz", {
        body: { answers: next },
      });
      if (fnError) throw new Error(fnError.message);
      if (!data || data.error) {
        setError(data?.error || "Something went wrong. Please try again.");
        return;
      }
      setResult(data as QuizResult);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const restart = () => {
    setStep(0);
    setAnswers([]);
    setResult(null);
    setError(null);
  };

  return (
    <ToolCard icon={ICONS.quiz} title="Bloodline Quiz">
      {step === 0 && (
        <div>
          <p className="mb-5 font-serif italic text-text-body">
            5 questions. Centuries of instinct. Discover your ancestral archetype.
          </p>
          <button onClick={() => setStep(1)} className={primaryBtnClass} style={primaryBtnStyle}>
            Take the Quiz
          </button>
        </div>
      )}

      {step >= 1 && step <= 5 && (
        <div>
          <p className="mb-3 font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">
            Question {step} of 5
          </p>
          <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-gold-line">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(135deg, #e8943a, #c47828)" }}
              initial={{ width: `${((step - 1) / 5) * 100}%` }}
              animate={{ width: `${(step / 5) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <h4 className="font-display text-xl leading-snug text-cream">{QUIZ_QUESTIONS[step - 1].q}</h4>
          <div className="mt-5 flex flex-col gap-3">
            {QUIZ_QUESTIONS[step - 1].options.map((opt) => (
              <button
                key={opt.letter}
                onClick={() => answer(opt.letter)}
                className="rounded-pill px-6 py-3 text-left font-sans text-sm transition-all hover:-translate-y-0.5"
                style={{
                  background: "rgba(232,148,58,0.04)",
                  border: "1px solid rgba(232,148,58,0.12)",
                  color: "#d0c4b4",
                }}
              >
                <span className="mr-3 font-semibold text-amber-dim">{opt.letter})</span>
                {opt.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 6 && (
        <div>
          {loading && <p className="font-serif italic text-text-body">Reading your bloodline…</p>}
          {error && (
            <div className="flex flex-col gap-3">
              <p className="font-sans text-sm text-rose">{error}</p>
              <button onClick={restart} className={primaryBtnClass} style={primaryBtnStyle}>
                Try Again
              </button>
            </div>
          )}
          {result && (
            <div>
              <p className="mb-2 font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">
                Your Bloodline Archetype
              </p>
              <h4 className="font-display text-amber-light" style={{ fontSize: "clamp(28px,5vw,44px)" }}>
                The {result.archetype}
              </h4>
              <p className="mt-4 font-sans text-base leading-relaxed text-text-body">{result.description}</p>
              {result.traits?.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {result.traits.map((t, i) => (
                    <span
                      key={i}
                      className="rounded-pill px-4 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-[2px]"
                      style={{
                        background: "rgba(212,160,74,0.08)",
                        border: "1px solid rgba(212,160,74,0.2)",
                        color: "#d4a04a",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <div
                className="mt-5 rounded-xl border border-gold-line bg-card p-5"
                style={{ borderLeft: "3px solid rgba(232,148,58,0.3)" }}
              >
                <p className="mb-2 font-sans text-[10px] uppercase tracking-[3px] text-amber-dim">Historical Example</p>
                <p className="font-serif italic leading-relaxed text-cream-soft">{result.historicalExample}</p>
              </div>
              <p className="mt-5 font-display text-xl text-cream-warm">"{result.motto}"</p>
              <button
                onClick={restart}
                className="mt-6 rounded-pill px-6 py-2 font-sans text-[11px] uppercase tracking-[1.5px] text-text-dim"
              >
                Retake Quiz
              </button>
            </div>
          )}
        </div>
      )}
    </ToolCard>
  );
}

// ───────────────────────── Page ─────────────────────────
export default function ToolsHub() {
  usePageMeta({
    title: "Free Ancestry Tools — Surname Lookup, Family Motto, AI Ancestor",
    description:
      "6 free ancestry tools on one page: surname meaning, Latin motto, bloodline quiz, AI ancestor chat, and more. Enter your surname once — everything unlocks.",
  });

  const { surname: rememberedSurname, setSurname: rememberSurname } = useRememberedSurname();
  const [draft, setDraft] = useState(rememberedSurname ?? "");
  const [activeSurname, setActiveSurname] = useState(rememberedSurname ?? "");

  useEffect(() => {
    if (rememberedSurname && rememberedSurname !== activeSurname) {
      setDraft(rememberedSurname);
      setActiveSurname(rememberedSurname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rememberedSurname]);

  const handleSurnameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = draft.trim();
    if (!v) return;
    rememberSurname(v);
    setActiveSurname(v);
  };

  return (
    <div className="relative min-h-screen bg-background">
      <img
        src="/hero.jpg"
        alt=""
        className="pointer-events-none fixed inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center 30%", opacity: 0.38, filter: "saturate(0.7) brightness(0.95)" }}
      />
      <div className="pointer-events-none fixed inset-0" style={{ background: "rgba(13,10,7,0.45)" }} />

      <FreeToolsEmailCTA />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-screen">
        <div className="pointer-events-none relative h-full">
          <ScrollChevron />
        </div>
      </div>

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col px-4 pb-24 pt-16">
        {/* Hero */}
        <div className="flex flex-col items-center text-center">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-sans text-[10px] uppercase tracking-[4px] text-amber-dim"
          >
            Free Tools
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-3 font-display text-cream-warm"
            style={{ fontSize: "clamp(28px, 5vw, 48px)" }}
          >
            What's hiding in your name?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 max-w-md font-serif italic text-text-body"
            style={{ fontSize: "17px" }}
          >
            Six tools, one page. Enter your surname once — everything unlocks.
          </motion.p>
        </div>

        {/* Persistent surname banner */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          onSubmit={handleSurnameSubmit}
          className="mx-auto mt-10 w-full max-w-xl rounded-[22px] p-6"
          style={{
            background: "rgba(26,21,14,0.85)",
            border: "1px solid rgba(212,160,74,0.3)",
          }}
        >
          <label className="mb-3 block text-center font-sans text-[10px] uppercase tracking-[3px] text-amber-dim">
            Your Surname
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type your surname"
              maxLength={60}
              className={`flex-1 ${inputClass} text-center font-display text-lg`}
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="rounded-pill px-8 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all hover:-translate-y-0.5 disabled:opacity-50"
              style={primaryBtnStyle}
            >
              Discover
            </button>
          </div>
        </motion.form>

        {/* Tool sections */}
        <div className="mt-12 flex flex-col gap-8">
          <SurnameMeaningSection surname={activeSurname} />
          <MeetAncestorSection initialSurname={activeSurname} />
          <The1700sSection initialSurname={activeSurname} />
          <AncestorChatSection initialSurname={activeSurname} />
          <MottoSection />
          <QuizSection />
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="font-sans text-sm text-text-dim">Ready to discover your full legacy?</p>
          <Link
            to="/journey/1"
            className="mt-4 inline-block rounded-pill px-10 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-[400ms] hover:-translate-y-0.5"
            style={primaryBtnStyle}
          >
            Begin Your Journey
          </Link>
        </div>
      </div>
    </div>
  );
}
