import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import RetryInline from "@/components/journey/RetryInline";
import AuthGate from "@/components/AuthGate";
import { useJourney } from "@/contexts/JourneyContext";
import { usePurchase } from "@/hooks/usePurchase";

const Stop5Story = () => {
  const navigate = useNavigate();
  const { unknownSurname, surname, story } = useJourney();
  const { user, hasPurchased, loading: purchaseLoading } = usePurchase();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (unknownSurname) navigate("/journey/1", { replace: true });
    else if (!surname) navigate("/journey/1", { replace: true });
  }, [unknownSurname, surname, navigate]);

  if (!surname) return null;

  const handleUnlock = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    navigate("/checkout");
  };

  const handleAuthenticated = () => {
    setShowAuth(false);
    navigate("/checkout");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <SectionLabel>YOUR STORY</SectionLabel>

      {story.status === "loading" && (
        <p className="mt-10 font-serif text-sm italic text-amber-dim">
          The quill is still writing…
        </p>
      )}

      {story.status === "error" && (
        <div className="mt-10">
          <RetryInline onRetry={story.retry} />
        </div>
      )}

      {story.status === "ready" && story.data && (
        <>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-6 max-w-3xl text-center font-display text-3xl text-cream-warm sm:text-4xl"
          >
            {story.data.chapterOneTitle}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.6, delay: 0.4 }}
            className="mt-10 w-full max-w-2xl"
          >
            {/* Ornamental rule */}
            <div className="mb-6 flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, #a07830)" }} />
              <span className="font-serif text-base text-amber-dim">✦</span>
              <div className="h-px flex-1" style={{ background: "linear-gradient(to left, transparent, #a07830)" }} />
            </div>

            {/* Manuscript body */}
            <p
              className="font-serif leading-[1.95] text-text-body"
              style={{
                fontSize: "1.0625rem",
                textAlign: "justify",
                textIndent: "0",
              }}
            >
              {/* Drop cap */}
              <span
                className="float-left mr-2 font-display leading-none text-amber-light"
                style={{ fontSize: "4.2rem", lineHeight: "0.82", marginTop: "6px" }}
              >
                {story.data.chapterOneBody.charAt(0)}
              </span>
              {story.data.chapterOneBody.slice(1)}
            </p>

            {/* Closing ornament */}
            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, #a07830)" }} />
              <span className="font-serif text-base text-amber-dim">✦</span>
              <div className="h-px flex-1" style={{ background: "linear-gradient(to left, transparent, #a07830)" }} />
            </div>
          </motion.div>

          {!purchaseLoading && hasPurchased ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 2 }}
              className="mt-14 w-full max-w-xl text-center"
            >
              <div className="mb-8 rounded-pill border border-amber-dim/25 bg-amber-dim/10 px-6 py-3">
                <p className="font-serif text-sm italic text-amber-light">
                  Your story is unlocked
                </p>
              </div>

              <ul className="space-y-3 text-left">
                {story.data.teaserChapters.map((title, i) => (
                  <motion.li
                    key={`${title}-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 2.2 + i * 0.1 }}
                    className="flex items-center gap-3 font-serif text-sm text-text-body"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-amber-dim" />
                    {title}
                  </motion.li>
                ))}
              </ul>

              <button
                onClick={() => navigate("/journey/6")}
                className="mt-10 rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #e8943a, #c47828)",
                  color: "#1a1208",
                }}
              >
                Pass It On
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 2 }}
              className="mt-14 w-full max-w-xl rounded-[22px] border border-amber-dim/25 bg-card/60 p-8 text-center"
            >
              <p className="font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">
                EIGHT CHAPTERS REMAIN
              </p>
              <ul className="mt-5 space-y-2 font-serif text-sm italic text-text-dim">
                {story.data.teaserChapters.map((t, i) => (
                  <li key={`${t}-${i}`}>{t}</li>
                ))}
              </ul>

              <button
                onClick={handleUnlock}
                className="mt-8 inline-block rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #e8943a, #c47828)",
                  transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                  color: "#1a1208",
                }}
              >
                Unlock Your Legacy Pack — $29.99
              </button>
            </motion.div>
          )}
        </>
      )}

      {showAuth && (
        <AuthGate
          onAuthenticated={handleAuthenticated}
          onClose={() => setShowAuth(false)}
        />
      )}
    </div>
  );
};

export default Stop5Story;
