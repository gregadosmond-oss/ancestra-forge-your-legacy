import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import RetryInline from "@/components/journey/RetryInline";
import AuthGate from "@/components/AuthGate";
import { useJourney } from "@/contexts/JourneyContext";
import { usePurchase } from "@/hooks/usePurchase";
import { stripMarkdown } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const Stop5Story = () => {
  const navigate = useNavigate();
  const { unknownSurname, surname, story } = useJourney();
  const { user, hasPurchased, loading: purchaseLoading } = usePurchase();
  const [showAuth, setShowAuth] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  // OTP gate state
  const [gateEmail, setGateEmail] = useState("");
  const [gateCode, setGateCode] = useState("");
  const [gateStage, setGateStage] = useState<"email" | "code">("email");
  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);

  const unlockAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
  };

  const stopAudio = useCallback(() => {
    try { sourceRef.current?.stop(); } catch {}
    sourceRef.current = null;
    setSpeaking(false);
    setPaused(false);
  }, []);

  const speakStory = useCallback(async (text: string) => {
    unlockAudio();
    stopAudio();
    setSpeaking(true);
    setPaused(false);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("ancestor-tts", { body: { text } });
      if (fnErr) throw new Error(fnErr.message);
      if (!data?.audio) throw new Error("No audio data");
      const binary = atob(data.audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const ctx = audioCtxRef.current!;
      if (ctx.state === "suspended") await ctx.resume();
      const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      sourceRef.current = source;
      source.onended = () => { setSpeaking(false); setPaused(false); sourceRef.current = null; };
      source.start(0);
    } catch {
      setSpeaking(false);
    }
  }, [stopAudio]);

  const togglePause = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (ctx.state === "running") { ctx.suspend(); setPaused(true); }
    else { ctx.resume(); setPaused(false); }
  }, []);

  useEffect(() => () => { stopAudio(); }, [stopAudio]);

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

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = gateEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
      setGateError("Enter a valid email address.");
      return;
    }
    setGateLoading(true);
    setGateError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
    });
    setGateLoading(false);
    if (error) {
      setGateError(error.message);
      return;
    }
    setGateStage("code");
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = gateCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setGateError("Enter the 6-digit code from your email.");
      return;
    }
    setGateLoading(true);
    setGateError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: gateEmail.trim().toLowerCase(),
      token: code,
      type: "email",
    });
    setGateLoading(false);
    if (error) {
      setGateError(error.message);
      return;
    }
    // Success — usePurchase will pick up the session and re-render with story content
  };

  const showGate = !purchaseLoading && !user;


  if (showGate) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
        <SectionLabel>YOUR STORY</SectionLabel>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mt-6 text-center font-display text-cream-warm"
          style={{ fontSize: "clamp(28px, 4vw, 42px)", lineHeight: 1.15 }}
        >
          Your story is ready.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-4 font-serif italic"
          style={{ color: "#c4b8a6", fontSize: "17px" }}
        >
          Enter your email to read it.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="mt-10 w-full max-w-md"
        >
          {gateStage === "email" ? (
            <form onSubmit={handleSendCode} className="flex flex-col items-center gap-4">
              <input
                type="email"
                value={gateEmail}
                onChange={(e) => { setGateEmail(e.target.value); if (gateError) setGateError(null); }}
                placeholder="your@email.com"
                autoFocus
                disabled={gateLoading}
                maxLength={255}
                className="w-full rounded-pill px-8 py-4 text-center font-sans text-base text-cream-warm placeholder:text-text-dim focus:outline-none disabled:opacity-60"
                style={{
                  background: "#161210",
                  border: "1px solid rgba(212,160,74,0.15)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(212,160,74,0.4)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(212,160,74,0.15)")}
              />
              {gateError && (
                <p className="font-sans text-xs" style={{ color: "#c47070" }}>{gateError}</p>
              )}
              <button
                type="submit"
                disabled={gateLoading || gateEmail.trim().length === 0}
                className="mt-2 rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #e8943a, #c47828)",
                  color: "#1a1208",
                }}
              >
                {gateLoading ? "Sending…" : "Send My Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="flex flex-col items-center gap-4">
              <p className="font-serif text-sm italic text-text-dim text-center">
                We sent a 6-digit code to <span className="text-amber-light not-italic">{gateEmail}</span>
              </p>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={gateCode}
                onChange={(e) => { setGateCode(e.target.value.replace(/\D/g, "").slice(0, 6)); if (gateError) setGateError(null); }}
                placeholder="000000"
                autoFocus
                disabled={gateLoading}
                className="w-full rounded-pill px-8 py-4 text-center font-display text-2xl tracking-[0.5em] text-cream-warm placeholder:text-text-dim focus:outline-none disabled:opacity-60"
                style={{
                  background: "#161210",
                  border: "1px solid rgba(212,160,74,0.15)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(212,160,74,0.4)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(212,160,74,0.15)")}
              />
              {gateError && (
                <p className="font-sans text-xs" style={{ color: "#c47070" }}>{gateError}</p>
              )}
              <button
                type="submit"
                disabled={gateLoading || gateCode.length !== 6}
                className="mt-2 rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #e8943a, #c47828)",
                  color: "#1a1208",
                }}
              >
                {gateLoading ? "Verifying…" : "Verify & Continue"}
              </button>
              <button
                type="button"
                onClick={() => { setGateStage("email"); setGateCode(""); setGateError(null); }}
                className="font-sans text-xs text-text-dim hover:text-amber-dim transition-colors"
              >
                Use a different email
              </button>
            </form>
          )}
        </motion.div>
      </div>
    );
  }

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
            {stripMarkdown(story.data.chapterOneTitle)}
          </motion.h1>

          {/* Listen button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-5 flex items-center gap-3"
          >
            {!speaking ? (
              <button
                onClick={() => {
                  const title = stripMarkdown(story.data!.chapterOneTitle);
                  const body = stripMarkdown(story.data!.chapterOneBody);
                  speakStory(`${title}. ${body}`);
                }}
                className="flex items-center gap-2 rounded-full border px-5 py-2 font-sans text-xs font-semibold uppercase tracking-[1.5px] transition-all hover:opacity-80"
                style={{ borderColor: "rgba(212,160,74,0.35)", color: "#d4a04a", background: "rgba(212,160,74,0.06)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Listen
              </button>
            ) : (
              <>
                <button
                  onClick={togglePause}
                  className="flex items-center gap-2 rounded-full border px-5 py-2 font-sans text-xs font-semibold uppercase tracking-[1.5px] transition-all hover:opacity-80"
                  style={{ borderColor: "rgba(212,160,74,0.35)", color: "#d4a04a", background: "rgba(212,160,74,0.06)" }}
                >
                  {paused ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  )}
                  {paused ? "Resume" : "Pause"}
                </button>
                <button
                  onClick={stopAudio}
                  className="flex items-center gap-2 rounded-full border px-4 py-2 font-sans text-xs font-semibold uppercase tracking-[1.5px] transition-all hover:opacity-80"
                  style={{ borderColor: "rgba(138,126,110,0.3)", color: "#8a7e6e", background: "transparent" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>
                  Stop
                </button>
              </>
            )}
          </motion.div>

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
                {stripMarkdown(story.data.chapterOneBody).charAt(0)}
              </span>
              {stripMarkdown(story.data.chapterOneBody).slice(1)}
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
              <div className="mb-6 rounded-[18px] border border-amber-dim/25 bg-amber-dim/10 px-6 py-5">
                <p className="font-serif text-sm italic text-amber-light">
                  Your full Legacy Pack is being prepared.
                </p>
                <p className="mt-2 font-sans text-xs text-text-dim">
                  All 9 chapters of your family story, your high-res crest, family tree, and legacy certificate will be sent to your email after payment is confirmed.
                </p>
              </div>

              <p className="mb-4 font-sans text-[10px] uppercase tracking-[3px] text-amber-dim">
                Your 9 chapters
              </p>
              <ul className="space-y-3 text-left">
                {[story.data.chapterOneTitle, ...story.data.teaserChapters].map((title, i) => (
                  <motion.li
                    key={`${title}-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 2.2 + i * 0.1 }}
                    className="flex items-center gap-3 font-serif text-sm"
                    style={{ color: i === 0 ? "#e8b85c" : "#8a7e6e" }}
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: i === 0 ? "#e8b85c" : "#3d3020" }} />
                    {stripMarkdown(title)}
                  </motion.li>
                ))}
              </ul>

              <button
                onClick={handleUnlock}
                className="mt-10 rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
              >
                Unlock Legacy Pack — $29.99
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 2 }}
              className="mt-14 w-full max-w-xl rounded-[22px] border text-center"
              style={{ background: "rgba(26,18,8,0.85)", borderColor: "rgba(232,148,58,0.3)" }}
            >
              {/* Fade out teaser */}
              <div className="relative overflow-hidden rounded-t-[22px] px-8 pt-8">
                <ul className="space-y-2 font-serif text-sm italic text-text-dim">
                  {story.data.teaserChapters.slice(0, 4).map((t, i) => (
                    <li key={`${t}-${i}`} style={{ opacity: 1 - i * 0.2 }}>{stripMarkdown(t)}</li>
                  ))}
                </ul>
                {/* Fade mask */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16"
                  style={{ background: "linear-gradient(to bottom, transparent, rgba(26,18,8,0.95))" }} />
              </div>

              {/* CTA */}
              <div className="px-8 pb-8 pt-4">
                <p className="font-display text-xl text-cream-warm">
                  8 more chapters await.
                </p>
                <p className="mt-2 font-serif text-sm italic text-text-dim">
                  Your full crest, family story, bloodline tree &amp; legacy certificate — delivered to your inbox.
                </p>

                <ul className="mt-4 space-y-1.5">
                  {["Custom high-res coat of arms (PNG & SVG)", "AI-written family story — all 9 chapters", "Visual bloodline tree", "Legacy certificate (frameable PDF)", "Ancestor chat — full access"].map(item => (
                    <li key={item} className="flex items-center gap-2 font-sans text-[12px]" style={{ color: "#c4b8a6" }}>
                      <span style={{ color: "#d4a04a", fontSize: 8 }}>✦</span>
                      {item}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleUnlock}
                  className="mt-6 w-full rounded-pill py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(135deg, #e8943a, #c47828)",
                    color: "#1a1208",
                  }}
                >
                  Unlock My Full Legacy — $29.99
                </button>
                <p className="mt-3 font-sans text-[10px] text-text-dim">
                  One-time payment · Instant delivery · No subscription
                </p>
              </div>
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
