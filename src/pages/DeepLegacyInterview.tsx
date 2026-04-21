import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRecognition: any =
  typeof window !== "undefined"
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

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

export default function DeepLegacyInterview() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  const [focused, setFocused] = useState(false);

  // Pre-fill surname from localStorage
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("userSurname") : null;
    if (stored) {
      setAnswers((prev) => ({ ...prev, 0: stored }));
    }
  }, []);

  const q = QUESTIONS[currentQuestion];
  const value = answers[currentQuestion] || "";
  const isLast = currentQuestion === QUESTIONS.length - 1;
  const canAdvance = value.trim().length > 0;

  const updateValue = (v: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion]: v }));
  };

  const goNext = () => {
    if (!canAdvance) return;
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
    setCurrentQuestion((n) => n - 1);
    setFadeKey((k) => k + 1);
    setFocused(false);
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
        {/* Header */}
        <div style={labelStyle}>Deep Legacy Interview</div>

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
              placeholder="Type your answer..."
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
      `}</style>
    </div>
  );
}
