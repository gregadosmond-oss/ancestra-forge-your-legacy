import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRecognition: any =
  typeof window !== "undefined"
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

const BG = "#0d0a07";
const BG_INPUT = "#161210";
const AMBER = "#d4a04a";
const CREAM_WARM = "#f0e8da";
const TEXT = "#d0c4b4";
const TEXT_DIM = "#8a7e6e";

const displayFont = { fontFamily: "'Libre Caslon Display', serif" };
const sansFont = { fontFamily: "'DM Sans', sans-serif" };

type Q = { question: string; type: "text" | "textarea"; key: string };

const QUESTIONS: Q[] = [
  { question: "What is your family surname?", type: "text", key: "surname" },
  { question: "What country or region did your family originally come from?", type: "text", key: "origin" },
  { question: "What is the earliest ancestor you know of by name?", type: "text", key: "earliestAncestor" },
  { question: "Roughly what year or era did they live in?", type: "text", key: "ancestorEra" },
  { question: "What did your ancestors do for work or trade?", type: "text", key: "ancestralWork" },
  { question: "What region or town did your family settle in?", type: "text", key: "settlement" },
  { question: "Did your family migrate or move countries? Where from and to?", type: "text", key: "migration" },
  { question: "What family stories or legends have been passed down to you?", type: "textarea", key: "stories" },
  { question: "Are there any notable achievements, struggles, or events in your family history?", type: "textarea", key: "events" },
  { question: "What values or traits seem to run through your family?", type: "text", key: "traits" },
  { question: "Do you know of any family mottos, sayings, or beliefs?", type: "text", key: "mottos" },
  { question: "Are there any family names that repeat across generations?", type: "text", key: "repeatingNames" },
  { question: "What do you most want to preserve about your family's story?", type: "textarea", key: "preserve" },
  { question: "Who in your family would most treasure this legacy?", type: "text", key: "recipient" },
  { question: "Is there anything else you want us to know about your family?", type: "textarea", key: "extra" },
];

const ctaButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #e8943a, #c47828)",
  color: "#1a1208",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  padding: "16px 40px",
  borderRadius: 60,
  border: "none",
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
  transition: "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease",
};

const labelStyle: React.CSSProperties = {
  ...sansFont,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 3,
  textTransform: "uppercase",
  color: AMBER,
};

const pickWarmVoice = (): SpeechSynthesisVoice | null => {
  if (!synth) return null;
  const voices = synth.getVoices();
  if (!voices.length) return null;
  return (
    voices.find(
      (v) =>
        v.name.includes("Samantha") ||
        v.name.includes("Karen") ||
        v.name.toLowerCase().includes("female")
    ) || voices.find((v) => v.lang.startsWith("en")) || voices[0]
  );
};

export default function DeepLegacyInterview() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  const [focused, setFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [voiceMode, setVoiceMode] = useState(true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const baseValueRef = useRef<string>("");
  const speechSupported = !!SpeechRecognition;
  const ttsSupported = true; // ElevenLabs via edge function (with browser fallback)

  const q = QUESTIONS[currentQuestion];
  const value = answers[currentQuestion] || "";
  const isLast = currentQuestion === QUESTIONS.length - 1;
  const canAdvance = value.trim().length > 0;

  const updateValue = (v: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion]: v }));
  };

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const cancelSpeaking = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    } catch {
      // ignore
    }
    try {
      synth?.cancel();
    } catch {
      // ignore
    }
    setIsSpeaking(false);
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognition) return;
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      baseValueRef.current = (answers[currentQuestion] || "").trim();

      recognition.onresult = (event: {
        resultIndex: number;
        results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean; length: number }>;
      }) => {
        let finalText = "";
        let interim = "";
        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalText += res[0].transcript;
          } else {
            interim += res[0].transcript;
          }
        }

        const base = baseValueRef.current;
        const combinedFinal = finalText
          ? (base ? `${base} ${finalText}`.trim() : finalText.trim())
          : base;

        setAnswers((prev) => ({ ...prev, [currentQuestion]: combinedFinal }));
        setInterimTranscript(interim.trim());
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript("");
      };
      recognition.onerror = () => {
        setIsListening(false);
        setInterimTranscript("");
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
      setInterimTranscript("");
    }
  }, [answers, currentQuestion]);

  const speakWithBrowser = useCallback(
    (text: string, autoListen: boolean) => {
      if (!synth) {
        if (autoListen) startListening();
        return;
      }
      try {
        synth.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 0.9;
        utter.pitch = 1.0;
        utter.lang = "en-US";
        const voice = pickWarmVoice();
        if (voice) utter.voice = voice;
        utter.onstart = () => setIsSpeaking(true);
        utter.onend = () => {
          setIsSpeaking(false);
          if (autoListen) startListening();
        };
        utter.onerror = () => {
          setIsSpeaking(false);
          if (autoListen) startListening();
        };
        synth.speak(utter);
      } catch {
        setIsSpeaking(false);
        if (autoListen) startListening();
      }
    },
    [startListening]
  );

  const speakQuestion = useCallback(
    async (text: string, autoListen: boolean) => {
      // Cancel any prior playback first
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
          audioRef.current = null;
        }
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
      } catch {
        // ignore
      }
      try {
        synth?.cancel();
      } catch {
        // ignore
      }

      setIsSpeaking(true);

      try {
        const { data, error } = await supabase.functions.invoke("ancestor-tts", {
          body: { text },
        });

        if (error || !data?.audio) {
          throw new Error(error?.message || "No audio returned");
        }

        // Decode base64 → Blob (audio/mpeg)
        const binary = atob(data.audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
          }
          audioRef.current = null;
          if (autoListen) startListening();
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
          }
          audioRef.current = null;
          // Fallback to browser TTS on playback error
          speakWithBrowser(text, autoListen);
        };

        await audio.play();
      } catch (err) {
        // Fallback: browser speechSynthesis
        console.warn("ElevenLabs TTS failed, falling back to browser TTS:", err);
        setIsSpeaking(false);
        speakWithBrowser(text, autoListen);
      }
    },
    [startListening, speakWithBrowser]
  );

  // Pre-fill surname from localStorage
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("userSurname") : null;
    if (stored) {
      setAnswers((prev) => ({ ...prev, 0: stored }));
    }
  }, []);

  // Warm up voice list (Chrome loads asynchronously)
  useEffect(() => {
    if (!synth) return;
    const handler = () => {
      // triggers voices load
      synth.getVoices();
    };
    synth.addEventListener?.("voiceschanged", handler);
    return () => synth.removeEventListener?.("voiceschanged", handler);
  }, []);

  // Auto-speak each question, then auto-listen — only when voiceMode is ON
  useEffect(() => {
    cancelSpeaking();
    stopListening();

    if (!voiceMode) return;

    const t = setTimeout(() => {
      speakQuestion(q.question, speechSupported);
    }, 300);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, voiceMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelSpeaking();
      stopListening();
    };
  }, [cancelSpeaking, stopListening]);

  const goNext = () => {
    if (!canAdvance) return;
    cancelSpeaking();
    stopListening();

    if (isLast) {
      setIsSubmitting(true);
      const payload: Record<string, string> = {};
      QUESTIONS.forEach((qq, i) => {
        payload[qq.key] = (answers[i] || "").trim();
      });
      localStorage.setItem("deepLegacyAnswers", JSON.stringify(payload));
      if (payload.surname) localStorage.setItem("userSurname", payload.surname);
      setTimeout(() => navigate("/deep-legacy/processing"), 300);
      return;
    }
    setCurrentQuestion((n) => n + 1);
    setFadeKey((k) => k + 1);
    setFocused(false);
  };

  const goBack = () => {
    if (currentQuestion === 0) return;
    cancelSpeaking();
    stopListening();
    setCurrentQuestion((n) => n - 1);
    setFadeKey((k) => k + 1);
    setFocused(false);
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
      return;
    }
    if (voiceMode) {
      // Re-speak then listen
      speakQuestion(q.question, true);
    } else {
      startListening();
    }
  };

  const toggleVoiceMode = () => {
    if (voiceMode) {
      cancelSpeaking();
      stopListening();
    }
    setVoiceMode((v) => !v);
  };

  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  const inputBaseStyle: React.CSSProperties = {
    ...sansFont,
    width: "100%",
    background: BG_INPUT,
    border: `1px solid ${focused ? AMBER : "rgba(212,160,74,0.2)"}`,
    color: TEXT,
    fontSize: 17,
    padding: "16px 20px",
    borderRadius: 14,
    outline: "none",
    transition: "border-color 0.2s ease",
    resize: q.type === "textarea" ? ("vertical" as const) : ("none" as const),
  };

  const showVoiceUI = speechSupported || ttsSupported;

  return (
    <div
      style={{
        background: BG,
        minHeight: "100vh",
        color: TEXT,
        padding: "80px 24px 120px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 640 }}>
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={labelStyle}>Deep Legacy Interview</div>

          {showVoiceUI && (
            <button
              type="button"
              onClick={toggleVoiceMode}
              style={{
                ...sansFont,
                background: "transparent",
                border: `1px solid rgba(212,160,74,0.2)`,
                color: TEXT_DIM,
                fontSize: 12,
                letterSpacing: 0.5,
                padding: "8px 16px",
                borderRadius: 60,
                cursor: "pointer",
                transition: "color 0.2s ease, border-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = AMBER;
                e.currentTarget.style.borderColor = "rgba(212,160,74,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = TEXT_DIM;
                e.currentTarget.style.borderColor = "rgba(212,160,74,0.2)";
              }}
            >
              {voiceMode ? "🔊 Voice Mode ON" : "🔇 Voice Mode OFF"}
            </button>
          )}
        </div>

        {/* Progress */}
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              width: "100%",
              height: 6,
              background: "rgba(212,160,74,0.1)",
              borderRadius: 60,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${AMBER}, #e8943a)`,
                transition: "width 0.4s ease",
                borderRadius: 60,
              }}
            />
          </div>
          <p style={{ ...sansFont, color: TEXT_DIM, fontSize: 13, marginTop: 12, letterSpacing: 1 }}>
            Question {currentQuestion + 1} of {QUESTIONS.length}
          </p>
        </div>

        {/* Question */}
        <div
          key={fadeKey}
          style={{
            marginTop: 56,
            animation: "fadeIn 0.4s ease",
          }}
        >
          <h2
            style={{
              ...displayFont,
              color: CREAM_WARM,
              fontSize: "clamp(26px, 3.4vw, 36px)",
              lineHeight: 1.25,
              marginBottom: 32,
            }}
          >
            {q.question}
          </h2>

          {/* Speaking indicator */}
          {isSpeaking && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 18 }}>
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 3,
                      background: AMBER,
                      borderRadius: 2,
                      animation: `wave 1s ease-in-out ${i * 0.12}s infinite`,
                    }}
                  />
                ))}
              </div>
              <p
                style={{
                  ...sansFont,
                  fontStyle: "italic",
                  color: TEXT_DIM,
                  fontSize: 13,
                  margin: 0,
                }}
              >
                Asking your question...
              </p>
            </div>
          )}

          <div style={{ position: "relative" }}>
            {q.type === "text" ? (
              <input
                type="text"
                autoFocus
                value={value}
                onChange={(e) => updateValue(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") goNext();
                }}
                style={inputBaseStyle}
                placeholder="Type or speak your answer..."
              />
            ) : (
              <textarea
                autoFocus
                value={value}
                onChange={(e) => updateValue(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{ ...inputBaseStyle, minHeight: 120 }}
                placeholder="Share what you remember..."
              />
            )}
          </div>

          {/* Interim transcript (live partial) */}
          {isListening && interimTranscript && (
            <p
              style={{
                ...sansFont,
                color: TEXT_DIM,
                fontStyle: "italic",
                fontSize: 15,
                marginTop: 10,
                opacity: 0.7,
              }}
            >
              {interimTranscript}
            </p>
          )}

          {/* Listening indicator */}
          {isListening && (
            <p
              style={{
                ...sansFont,
                fontStyle: "italic",
                color: TEXT_DIM,
                fontSize: 13,
                marginTop: 12,
                animation: "listenFade 1.6s ease-in-out infinite",
              }}
            >
              Listening... speak your answer
            </p>
          )}

          {/* Mic toggle button below input */}
          {speechSupported && (
            <div style={{ marginTop: 20 }}>
              <button
                type="button"
                onClick={handleMicToggle}
                disabled={isSpeaking}
                aria-label={isListening ? "Stop listening" : "Speak answer"}
                style={{
                  ...sansFont,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  background: isListening ? "rgba(212,160,74,0.12)" : "transparent",
                  border: `1px solid ${isListening ? AMBER : "rgba(212,160,74,0.25)"}`,
                  color: isListening ? AMBER : TEXT,
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: 1,
                  padding: "10px 22px",
                  borderRadius: 60,
                  cursor: isSpeaking ? "default" : "pointer",
                  opacity: isSpeaking ? 0.5 : 1,
                  transition: "all 0.2s ease",
                  animation: isListening ? "micPulse 1.4s ease-out infinite" : "none",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill={isListening ? AMBER : "none"}
                  stroke={isListening ? AMBER : TEXT}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="2" width="6" height="12" rx="3" />
                  <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
                {isListening ? "Stop" : "Speak answer"}
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div
          style={{
            marginTop: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={goBack}
            disabled={currentQuestion === 0 || isSubmitting}
            style={{
              ...sansFont,
              background: "transparent",
              border: "none",
              color: currentQuestion === 0 ? TEXT_DIM : AMBER,
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: 1,
              cursor: currentQuestion === 0 ? "default" : "pointer",
              padding: "8px 4px",
              opacity: currentQuestion === 0 ? 0.4 : 1,
            }}
          >
            ← Back
          </button>

          <button
            onClick={goNext}
            disabled={!canAdvance || isSubmitting}
            style={{
              ...ctaButtonStyle,
              opacity: canAdvance && !isSubmitting ? 1 : 0.5,
              cursor: canAdvance && !isSubmitting ? "pointer" : "default",
            }}
            onMouseEnter={(e) => {
              if (canAdvance && !isSubmitting) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 40px rgba(232,148,58,0.2)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {isSubmitting ? "Saving..." : isLast ? "Complete Interview →" : "Next →"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes micPulse {
          0% { box-shadow: 0 0 0 0 rgba(212,160,74,0.45); }
          70% { box-shadow: 0 0 0 14px rgba(212,160,74,0); }
          100% { box-shadow: 0 0 0 0 rgba(212,160,74,0); }
        }
        @keyframes listenFade {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes wave {
          0%, 100% { height: 4px; }
          50% { height: 18px; }
        }
      `}</style>
    </div>
  );
}
