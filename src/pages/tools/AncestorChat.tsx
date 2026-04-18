import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, VolumeX, Pause, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Message = {
  role: "user" | "ancestor";
  text: string;
};

const reveal = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

const SUGGESTED_QUESTIONS = [
  "What was your daily life like?",
  "What hardships did you face?",
  "What are you most proud of?",
  "What do you want me to remember?",
];

// Browser speech recognition API types
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default function AncestorChat() {
  const [surname, setSurname] = useState("");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ancestorName, setAncestorName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const hasSpeechRecognition = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioBlobRef.current) {
      URL.revokeObjectURL(audioBlobRef.current);
      audioBlobRef.current = null;
    }
    setSpeaking(false);
    setPaused(false);
  }, []);

  const speakAncestor = useCallback(async (text: string) => {
    if (!voiceEnabled) return;
    stopAudio();
    setSpeaking(true);
    setPaused(false);

    try {
      const { data, error } = await supabase.functions.invoke("ancestor-tts", {
        body: { text },
      });
      if (error || !data) throw new Error("TTS failed");

      // data is an ArrayBuffer from the edge function
      const blob = new Blob([data], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      audioBlobRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setSpeaking(false); setPaused(false); URL.revokeObjectURL(url); audioBlobRef.current = null; };
      audio.onerror = () => { setSpeaking(false); setPaused(false); };
      audio.play();
    } catch {
      setSpeaking(false);
    }
  }, [voiceEnabled, stopAudio]);

  const togglePause = () => {
    if (!audioRef.current) return;
    if (paused) {
      audioRef.current.play();
      setPaused(false);
    } else {
      audioRef.current.pause();
      setPaused(true);
    }
  };

  // Stop audio when voice is toggled off
  useEffect(() => {
    if (!voiceEnabled) stopAudio();
  }, [voiceEnabled, stopAudio]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surname.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "ancestor-chat",
        { body: { surname: surname.trim(), messages: [] } },
      );
      if (fnError) throw new Error(fnError.message);
      if (!data || data.error) {
        setError(data?.error || "Something went wrong. Please try again.");
        return;
      }
      setAncestorName(data.ancestorName || `Ancestor ${surname}`);
      setMessages([{ role: "ancestor", text: data.reply }]);
      setStarted(true);
      speakAncestor(data.reply);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", text: msg }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "ancestor-chat",
        {
          body: {
            surname: surname.trim(),
            messages: newMessages.map((m) => ({ role: m.role, content: m.text })),
          },
        },
      );
      if (fnError) throw new Error(fnError.message);
      const reply = data.reply || "…";
      setMessages((prev) => [...prev, { role: "ancestor", text: reply }]);
      speakAncestor(reply);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ancestor", text: "I'm lost in the mists of time… try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Video background */}
            <img src="/hero.jpg" alt="" className="pointer-events-none fixed inset-0 h-full w-full object-cover" style={{ objectPosition: "center 30%", opacity: 0.38, filter: "saturate(0.7) brightness(0.95)" }} />
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: "rgba(13,10,7,0.45)" }}
      />

      {!started ? (
        /* ── START SCREEN ── */
        <section className="relative z-10 flex flex-col items-center px-4 pb-16 pt-24 text-center">
          <motion.p
            {...reveal}
            className="mb-3 font-sans text-[10px] uppercase tracking-[4px] text-amber-dim"
          >
            Free Tool
          </motion.p>
          <motion.h1
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.1 }}
            className="font-display text-[clamp(28px,5vw,48px)] leading-tight text-cream-warm"
          >
            Chat With Your Ancestor
          </motion.h1>
          <motion.p
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.2 }}
            className="mt-4 max-w-md font-serif italic text-text-body"
            style={{ fontSize: "17px" }}
          >
            An AI character based on your family history — their words, their world,
            their wisdom. Ask them anything.
          </motion.p>

          <motion.form
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.3 }}
            onSubmit={handleStart}
            className="mt-10 flex w-full max-w-md flex-col gap-4 sm:flex-row"
          >
            <input
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              placeholder="Enter your surname"
              maxLength={60}
              className="flex-1 rounded-pill border border-gold-line bg-input px-6 py-4 font-sans text-foreground placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={loading || !surname.trim()}
              className="rounded-pill px-10 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-[400ms] hover:-translate-y-0.5 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
            >
              {loading ? "Summoning…" : "Begin"}
            </button>
          </motion.form>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 font-sans text-sm text-rose"
            >
              {error}
            </motion.p>
          )}

          {/* Suggested questions preview */}
          <motion.div
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.5 }}
            className="mt-14 max-w-md"
          >
            <p className="mb-4 font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">
              You might ask…
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <span
                  key={q}
                  className="rounded-pill font-sans text-[12px]"
                  style={{
                    padding: "7px 16px",
                    border: "1px solid rgba(61,48,32,1)",
                    background: "rgba(26,21,14,0.8)",
                    color: "#8a7e6e",
                  }}
                >
                  {q}
                </span>
              ))}
            </div>
          </motion.div>
        </section>
      ) : (
        /* ── CHAT SCREEN ── */
        <div className="relative z-10 flex min-h-screen flex-col">
          {/* Chat header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid rgba(61,48,32,0.8)", background: "rgba(13,10,7,0.6)" }}
          >
            <div>
              <p className="font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">
                Speaking with
              </p>
              <p className="font-display text-lg text-cream-warm">{ancestorName}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Persistent mute/unmute — always visible */}
              <button
                onClick={() => setVoiceEnabled((v) => !v)}
                title={voiceEnabled ? "Mute ancestor" : "Unmute ancestor"}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200"
                style={{
                  border: "1px solid rgba(61,48,32,1)",
                  background: voiceEnabled ? "rgba(232,148,58,0.1)" : "transparent",
                  color: voiceEnabled ? "#d4a04a" : "#8a7e6e",
                  cursor: "pointer",
                }}
              >
                {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
              <button
                onClick={() => { stopAudio(); setStarted(false); setMessages([]); }}
                className="rounded-pill px-4 py-2 font-sans text-[10px] uppercase tracking-[1.5px] transition-all duration-200"
                style={{
                  border: "1px solid rgba(61,48,32,1)",
                  background: "transparent",
                  color: "#8a7e6e",
                  cursor: "pointer",
                }}
              >
                New Ancestor
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-4 py-6"
            style={{ maxHeight: "calc(100vh - 200px)" }}
          >
            <div className="mx-auto max-w-2xl space-y-5">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className="max-w-[80%] rounded-[18px] px-5 py-4"
                      style={
                        msg.role === "ancestor"
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
                      {msg.role === "ancestor" && (
                        <p
                          className="mb-2 font-sans not-italic"
                          style={{ fontSize: "9px", letterSpacing: "2.5px", color: "#a07830", textTransform: "uppercase" }}
                        >
                          {ancestorName}
                        </p>
                      )}
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div
                    className="rounded-[4px_18px_18px_18px] px-5 py-4"
                    style={{
                      background: "rgba(26,21,14,0.95)",
                      border: "1px solid rgba(212,160,74,0.12)",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        gap: 5,
                        alignItems: "center",
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: "#a07830",
                            animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                          }}
                        />
                      ))}
                    </span>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Suggested questions (first message only) */}
          {messages.length === 1 && !loading && (
            <div className="px-4 pb-2">
              <div className="mx-auto flex max-w-2xl flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="rounded-pill font-sans text-[11px] transition-all duration-200 hover:opacity-80"
                    style={{
                      padding: "6px 14px",
                      border: "1px solid rgba(61,48,32,1)",
                      background: "rgba(26,21,14,0.8)",
                      color: "#8a7e6e",
                      cursor: "pointer",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input bar */}
          <div
            className="px-4 py-4"
            style={{ borderTop: "1px solid rgba(61,48,32,0.8)", background: "rgba(13,10,7,0.7)" }}
          >
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="mx-auto flex max-w-2xl gap-3"
            >
              {hasSpeechRecognition && (
                <button
                  type="button"
                  onClick={toggleMic}
                  title={listening ? "Stop listening" : "Speak your question"}
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200"
                  style={{
                    border: listening ? "1px solid rgba(232,148,58,0.5)" : "1px solid rgba(61,48,32,1)",
                    background: listening ? "rgba(232,148,58,0.15)" : "rgba(26,21,14,0.8)",
                    color: listening ? "#e8943a" : "#8a7e6e",
                    animation: listening ? "micPulse 1.2s ease-in-out infinite" : "none",
                  }}
                >
                  {listening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              )}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={listening ? "Listening…" : "Ask your ancestor something…"}
                className="flex-1 rounded-pill border border-gold-line bg-input px-5 py-3 font-sans text-sm text-foreground placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-pill px-6 py-3 font-sans text-[12px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
              >
                Send
              </button>
            </form>
          </div>

          {/* Speaking indicator with controls */}
          {speaking && (
            <div
              className="fixed bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-pill px-5 py-3"
              style={{
                background: "rgba(26,21,14,0.97)",
                border: "1px solid rgba(232,148,58,0.25)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                zIndex: 50,
              }}
            >
              {/* Pause/resume */}
              <button
                onClick={togglePause}
                title={paused ? "Resume" : "Pause"}
                className="flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200"
                style={{
                  border: "1px solid rgba(232,148,58,0.35)",
                  background: "rgba(232,148,58,0.1)",
                  color: "#d4a04a",
                  cursor: "pointer",
                }}
              >
                {paused ? <Play size={12} /> : <Pause size={12} />}
              </button>

              {/* Waveform dots */}
              {!paused && [0, 1, 2, 3].map((i) => (
                <span key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "#a07830", animation: `dotPulse 1.2s ease-in-out ${i * 0.15}s infinite`, display: "inline-block" }} />
              ))}
              <span style={{ fontSize: "10px", letterSpacing: "2px", color: "#a07830", textTransform: "uppercase", fontFamily: "DM Sans, sans-serif" }}>
                {paused ? "Paused" : "Speaking…"}
              </span>

            </div>
          )}

          <style>{`
            @keyframes dotPulse {
              0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
              30% { opacity: 1; transform: scale(1.2); }
            }
            @keyframes micPulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(232,148,58,0.3); }
              50% { box-shadow: 0 0 0 6px rgba(232,148,58,0); }
            }
          `}</style>
        </div>
      )}

      {/* Journey CTA — only on start screen */}
      {!started && (
        <section className="relative z-10 py-16 text-center">
          <p className="mb-4 font-sans text-sm text-text-dim">
            Want the full story — crest, bloodline, and your family's legacy?
          </p>
          <Link
            to="/journey"
            className="inline-block rounded-pill px-10 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-[400ms] hover:-translate-y-0.5"
            style={{
              background: "rgba(232,148,58,0.06)",
              border: "1px solid rgba(232,148,58,0.18)",
              color: "#d4a04a",
            }}
          >
            Begin Your Journey
          </Link>
        </section>
      )}
    </div>
  );
}
