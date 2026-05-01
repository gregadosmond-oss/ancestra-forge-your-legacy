import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import { usePurchase } from "@/hooks/usePurchase";
import { supabase } from "@/integrations/supabase/client";
import { stripMarkdown } from "@/lib/utils";
import ShareQRCode from "@/components/ShareQRCode";
import SocialShare from "@/components/SocialShare";
import { generateCertificate } from "@/lib/generateCertificate";
import { fetchLegacy } from "@/lib/legacyClient";
import FreeCrest from "@/components/FreeCrest";
import type { LegacyFacts, LegacyStory } from "@/types/legacy";
import { usePageMeta } from "@/hooks/usePageMeta";

// ─── Data hook ────────────────────────────────────────────────────────────────

type DeepLegacyResearch = {
  summary: string;
  sources: { title: string; url: string }[];
};

type DeepChapter = { chapter_num: number; title: string; body: string };

type LegacyData = {
  facts: LegacyFacts | null;
  story: LegacyStory | null;
  crestUrl: string | null;
  surname: string | null;
  deepLegacyResearch: DeepLegacyResearch | null;
  deepChapters: DeepChapter[];
  loading: boolean;
  generating: boolean;
  error: string | null;
};

function useLegacyData(userId: string | undefined): LegacyData {
  const [data, setData] = useState<LegacyData>({
    facts: null,
    story: null,
    crestUrl: null,
    surname: null,
    deepLegacyResearch: null,
    deepChapters: [],
    loading: true,
    generating: false,
    error: null,
  });

  useEffect(() => {
    if (!userId) {
      setData((d) => ({ ...d, loading: false }));
      return;
    }

    const load = async () => {
      try {
        // Step 1: get surname — profile first, then sessionStorage fallback
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("surname")
          .eq("id", userId)
          .maybeSingle();

        if (profileErr) throw new Error(profileErr.message);

        const sessionSurname = sessionStorage.getItem("ancestra_journey_surname");
        const rawSurname = sessionSurname ?? profile?.surname ?? null;

        if (!rawSurname) {
          setData({ facts: null, story: null, crestUrl: null, surname: null, deepLegacyResearch: null, deepChapters: [], loading: false, generating: false, error: null });
          return;
        }

        // Normalize for DB lookups — surname_crests/surname_facts are keyed on lowercase
        const surname = rawSurname.trim().toLowerCase();

        // Always keep profile in sync with the journey surname (store normalized)
        if (surname !== profile?.surname) {
          await supabase.from("profiles").upsert({ id: userId, surname }, { onConflict: "id" });
        }

        // Step 2: load facts + story + crest + deep legacy research + chapters in parallel
        const [factsRes, crestRes, deepRes, chaptersRes] = await Promise.all([
          supabase
            .from("surname_facts")
            .select("payload, story_payload")
            .eq("surname", surname)
            .maybeSingle(),
          supabase
            .from("surname_crests")
            .select("image_url")
            .eq("surname", surname)
            .maybeSingle(),
          supabase
            .from("deep_legacy_results")
            .select("research_summary, sources")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("deep_legacy_chapters")
            .select("chapter_num, title, body")
            .eq("user_id", userId)
            .order("chapter_num", { ascending: true }),
        ]);

        let facts = ((factsRes.data?.payload as any)?.facts as LegacyFacts) ?? (factsRes.data?.payload as LegacyFacts) ?? null;
        let story = ((factsRes.data?.payload as any)?.story as LegacyStory)
          ?? ((factsRes.data as any)?.story_payload as LegacyStory)
          ?? null;
        let crestUrl = crestRes.data?.image_url ?? null;
        const deepLegacyResearch: DeepLegacyResearch | null = deepRes.data?.research_summary
          ? {
              summary: deepRes.data.research_summary,
              sources: (deepRes.data.sources as { title: string; url: string }[] | null) ?? [],
            }
          : null;
        const deepChapters: DeepChapter[] = (chaptersRes.data as DeepChapter[] | null) ?? [];

        // Step 3: generate if no facts at all (e.g. user skipped the journey)
        if (!facts) {
          setData((d) => ({ ...d, surname, loading: false, generating: true }));
          try {
            const resp = await fetchLegacy(surname);
            if (resp.code !== "UNKNOWN_SURNAME" && resp.facts) {
              facts = resp.facts;
              story = resp.story ?? null;
              // Re-read from DB to pick up the freshly cached row
              const [factsRes2, crestRes2] = await Promise.all([
                supabase
                  .from("surname_facts")
                  .select("payload, story_payload")
                  .eq("surname", surname)
                  .maybeSingle(),
                supabase
                  .from("surname_crests")
                  .select("image_url")
                  .eq("surname", surname)
                  .maybeSingle(),
              ]);
              facts = ((factsRes2.data?.payload as any)?.facts as LegacyFacts) ?? (factsRes2.data?.payload as LegacyFacts) ?? facts;
              story = ((factsRes2.data?.payload as any)?.story as LegacyStory)
                ?? ((factsRes2.data as any)?.story_payload as LegacyStory)
                ?? story;
              crestUrl = crestRes2.data?.image_url ?? null;

              // Real crest is generated server-side after payment (payments-webhook → generate-crest).
            }
          } catch {
            // generation failure is non-fatal — show what we have
          }
          setData({ facts, story, crestUrl, surname, deepLegacyResearch, deepChapters, loading: false, generating: false, error: null });
          return;
        }

        setData({ facts, story, crestUrl, surname, deepLegacyResearch, deepChapters, loading: false, generating: false, error: null });
      } catch (err) {
        setData((d) => ({ ...d, loading: false, generating: false, error: (err as Error).message }));
      }
    };

    void load();
  }, [userId]);

  return data;
}

// ─── Crest poller ─────────────────────────────────────────────────────────────
// Polls surname_crests every 5s for up to 60s when user has paid but crest isn't ready.

const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS = 60_000;

function useCrestPoller(surname: string | null, initialCrestUrl: string | null) {
  const [polledUrl, setPolledUrl] = useState<string | null>(null);

  useEffect(() => {
    // If we already have a crest, nothing to poll
    if (!surname || initialCrestUrl) return;

    let stopped = false;
    const deadline = Date.now() + POLL_TIMEOUT_MS;

    const tick = async () => {
      if (stopped || Date.now() > deadline) return;
      const { data } = await supabase
        .from("surname_crests")
        .select("image_url")
        .eq("surname", surname)
        .maybeSingle();
      if (stopped) return;
      if (data?.image_url) {
        setPolledUrl(data.image_url);
      } else if (Date.now() < deadline) {
        setTimeout(tick, POLL_INTERVAL_MS);
      }
    };

    setTimeout(tick, POLL_INTERVAL_MS);
    return () => { stopped = true; };
  }, [surname, initialCrestUrl]);

  return polledUrl ?? initialCrestUrl;
}

// ─── Lazy chapter expander ────────────────────────────────────────────────────

function useExpandChapters(surname: string | null, story: LegacyStory | null) {
  const [chapterBodies, setChapterBodies] = useState<string[] | null>(
    story?.chapterBodies ?? null
  );
  const [expanding, setExpanding] = useState(false);

  useEffect(() => {
    // Already have bodies, or nothing to expand
    if (!surname || !story?.teaserChapters?.length) return;
    if (story.chapterBodies && story.chapterBodies.length > 0) {
      setChapterBodies(story.chapterBodies);
      return;
    }
    // Trigger expansion
    let cancelled = false;
    setExpanding(true);
    supabase.functions
      .invoke<{ code: string; chapterBodies: string[] }>("expand-chapters", {
        body: { surname },
      })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data?.chapterBodies) {
          setChapterBodies(data.chapterBodies);
        }
        setExpanding(false);
      });
    return () => { cancelled = true; };
  }, [surname, story]);

  return { chapterBodies, expanding };
}

// ─── Ornamental divider ────────────────────────────────────────────────────────

function OrnamentDivider() {
  return (
    <div className="my-10 flex items-center gap-3">
      <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, #a07830)" }} />
      <span className="font-serif text-base text-amber-dim">✦</span>
      <div className="h-px flex-1" style={{ background: "linear-gradient(to left, transparent, #a07830)" }} />
    </div>
  );
}

// ─── TTS hook ─────────────────────────────────────────────────────────────────

function useChapterTTS() {
  const [speaking, setSpeaking] = useState<string | null>(null); // chapter key e.g. "ch1", "ch2"
  const [paused, setPaused] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const stop = useCallback(() => {
    try { sourceRef.current?.stop(); } catch {}
    sourceRef.current = null;
    setSpeaking(null);
    setPaused(false);
  }, []);

  useEffect(() => () => { stop(); }, [stop]);

  const speak = useCallback(async (chapterKey: string, text: string) => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    stop();
    setSpeaking(chapterKey);
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
      source.onended = () => { setSpeaking(null); setPaused(false); sourceRef.current = null; };
      source.start(0);
    } catch { setSpeaking(null); }
  }, [stop]);

  const togglePause = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (ctx.state === "running") { ctx.suspend(); setPaused(true); }
    else { ctx.resume(); setPaused(false); }
  }, []);

  return { speaking, paused, speak, stop, togglePause };
}

// ─── Listen button ─────────────────────────────────────────────────────────────

function ListenButton({ chapterKey, text, tts }: {
  chapterKey: string;
  text: string;
  tts: ReturnType<typeof useChapterTTS>;
}) {
  const active = tts.speaking === chapterKey;
  if (!active) {
    return (
      <button
        onClick={() => tts.speak(chapterKey, text)}
        className="mt-3 flex items-center gap-2 rounded-full border px-4 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[1.5px] transition-all hover:opacity-80"
        style={{ borderColor: "rgba(212,160,74,0.3)", color: "#a07830", background: "rgba(212,160,74,0.05)" }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        Listen
      </button>
    );
  }
  return (
    <div className="mt-3 flex items-center gap-2">
      <button
        onClick={tts.togglePause}
        className="flex items-center gap-2 rounded-full border px-4 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[1.5px] transition-all hover:opacity-80"
        style={{ borderColor: "rgba(212,160,74,0.3)", color: "#a07830", background: "rgba(212,160,74,0.05)" }}
      >
        {tts.paused
          ? <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          : <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>}
        {tts.paused ? "Resume" : "Pause"}
      </button>
      <button
        onClick={tts.stop}
        className="flex items-center gap-2 rounded-full border px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[1.5px] transition-all hover:opacity-80"
        style={{ borderColor: "rgba(138,126,110,0.25)", color: "#8a7e6e", background: "transparent" }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>
        Stop
      </button>
    </div>
  );
}

// ─── Roman numerals ───────────────────────────────────────────────────────────

function toRoman(num: number): string {
  const map: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let n = num;
  let out = "";
  for (const [val, sym] of map) {
    while (n >= val) { out += sym; n -= val; }
  }
  return out;
}

// ─── Deep Book chapter card ───────────────────────────────────────────────────

function DeepBookChapterCard({ chapter, tts }: { chapter: DeepChapter; tts: ReturnType<typeof useChapterTTS> }) {
  const [expanded, setExpanded] = useState(false);
  const paragraphs = chapter.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chapterKey = `book-${chapter.chapter_num}`;
  const ttsText = `${chapter.title}. ${chapter.body}`;

  return (
    <div
      className="rounded-[22px] border p-6 sm:p-8"
      style={{ background: "rgba(26,18,8,0.7)", borderColor: "rgba(160,120,48,0.15)" }}
    >
      <p
        className="font-sans uppercase"
        style={{ fontSize: "10px", letterSpacing: "2px", color: "#a07830" }}
      >
        Chapter {toRoman(chapter.chapter_num)}
      </p>
      <h3 className="mt-2 font-display text-cream-warm" style={{ fontSize: "22px", lineHeight: 1.25 }}>
        {chapter.title}
      </h3>

      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="mt-5 rounded-full border px-5 py-2 font-sans text-[10px] font-semibold uppercase tracking-[1.5px] transition-all hover:opacity-80"
          style={{ borderColor: "rgba(212,160,74,0.3)", color: "#d4a04a", background: "rgba(232,148,58,0.06)" }}
        >
          Read Chapter
        </button>
      ) : (
        <>
          <div className="mt-6 space-y-5">
            {paragraphs.map((para, i) => (
              <p
                key={i}
                className="font-serif text-text-body text-justify"
                style={{ lineHeight: 1.95, fontSize: "1.0625rem" }}
              >
                {i === 0 ? (
                  <>
                    <span
                      style={{
                        float: "left",
                        fontFamily: "'Libre Caslon Display', serif",
                        fontSize: "4.2rem",
                        lineHeight: 0.9,
                        color: "#e8b85c",
                        paddingRight: "0.5rem",
                        paddingTop: "0.35rem",
                      }}
                    >
                      {para.charAt(0)}
                    </span>
                    {para.slice(1)}
                  </>
                ) : (
                  para
                )}
              </p>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ListenButton chapterKey={chapterKey} text={ttsText} tts={tts} />
            <button
              onClick={() => setExpanded(false)}
              className="rounded-full border px-4 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[1.5px] transition-all hover:opacity-80"
              style={{ borderColor: "rgba(138,126,110,0.25)", color: "#8a7e6e", background: "transparent" }}
            >
              Collapse
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

const MyLegacy = () => {
  usePageMeta({ title: "My Legacy | AncestorsQR" });
  const navigate = useNavigate();
  const { user, hasPurchased, loading: purchaseLoading } = usePurchase();
  const { facts, story, crestUrl: initialCrestUrl, surname, deepLegacyResearch, deepChapters, loading, generating, error } = useLegacyData(
    !purchaseLoading && hasPurchased ? user?.id : undefined
  );
  const crestUrl = useCrestPoller(surname, initialCrestUrl);
  const { chapterBodies, expanding: expandingChapters } = useExpandChapters(surname, story);
  const tts = useChapterTTS();

  useEffect(() => {
    if (!purchaseLoading && !user) navigate("/journey/1", { replace: true });
  }, [purchaseLoading, user, navigate]);

  if (purchaseLoading || (hasPurchased && loading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-serif text-sm italic text-amber-dim">Loading your legacy…</p>
      </div>
    );
  }

  if (hasPurchased && generating) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="text-5xl"
        >
          🛡
        </motion.div>
        <p className="font-display text-2xl text-cream-warm">Forging your legacy…</p>
        <p className="font-serif text-sm italic text-text-dim">
          This takes about 30 seconds. Discovering your family's history.
        </p>
      </div>
    );
  }

  // Not purchased
  if (!hasPurchased) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24 bg-background">
        <SectionLabel>YOUR LEGACY</SectionLabel>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-8 max-w-lg text-center"
        >
          <h1 className="font-display text-3xl text-cream-warm">No Legacy Pack yet.</h1>
          <p className="mt-4 font-serif italic text-text-body">
            Start your journey to discover your family legacy.
          </p>
          <button
            onClick={() => navigate("/journey/1")}
            className="mt-10 rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
          >
            Begin Your Journey
          </button>
        </motion.div>
      </div>
    );
  }

  // Purchased but no surname saved yet (edge case)
  if (!surname && !loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24 bg-background">
        <SectionLabel>YOUR LEGACY</SectionLabel>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-8 max-w-lg text-center"
        >
          <h1 className="font-display text-3xl text-cream-warm">Your Legacy Pack is unlocked.</h1>
          <p className="mt-4 font-serif italic text-text-body">
            Your full family story, high-res crest, and legacy documents are being prepared — you'll receive them by email shortly.
          </p>
          <p className="mt-3 font-serif italic text-text-dim text-sm">
            To view your legacy here, complete the journey with your surname.
          </p>
          <button
            onClick={() => navigate("/journey/1")}
            className="mt-10 rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
          >
            Open My Journey
          </button>
        </motion.div>
      </div>
    );
  }

  // Error loading data
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
        <p className="font-serif italic text-text-dim">Trouble loading your legacy. Please refresh.</p>
      </div>
    );
  }

  const displaySurname = facts?.displaySurname ?? (surname ? surname.replace(/\b\w/g, (c) => c.toUpperCase()) : "");

  return (
    <div className="relative min-h-screen px-6 pb-32 pt-16">
      <img src="/hero.jpg" alt="" className="pointer-events-none fixed inset-0 h-full w-full object-cover" style={{ objectPosition: "center 30%", opacity: 0.38, filter: "saturate(0.7) brightness(0.95)" }} />
      <div className="relative z-10 mx-auto max-w-2xl">

        {user?.email && (
          <div
            className="mx-auto mb-8 max-w-xl rounded-full border px-5 py-2.5 text-center font-sans text-xs uppercase tracking-[2px]"
            style={{
              borderColor: "hsl(var(--amber-dim) / 0.4)",
              backgroundColor: "hsl(var(--amber) / 0.06)",
              color: "hsl(var(--amber-light))",
            }}
          >
            ✦ Legacy Pack delivered to {user.email}
          </div>
        )}

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <SectionLabel>YOUR LEGACY</SectionLabel>
          <h1
            className="mt-4 font-display text-4xl sm:text-5xl"
            style={{ color: "#f0e8da" }}
          >
            House of {displaySurname}
          </h1>
          {facts?.mottoLatin && (
            <p className="mt-3 font-serif italic text-amber-light text-lg">
              "{facts.mottoLatin}"
            </p>
          )}
          {facts?.mottoEnglish && (
            <p className="mt-1 font-sans text-[10px] uppercase tracking-[3px] text-amber-dim">
              {facts.mottoEnglish}
            </p>
          )}
        </motion.div>

        {/* ── Crest ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="mt-12 flex flex-col items-center"
        >
          {crestUrl ? (
            <div className="relative">
              <div
                className="pointer-events-none absolute inset-0 rounded-full blur-3xl"
                style={{ background: "radial-gradient(ellipse, rgba(232,184,92,0.18) 0%, transparent 70%)" }}
              />
              <img
                src={crestUrl}
                alt={`${displaySurname} coat of arms`}
                className="relative z-10 mx-auto"
                style={{ width: "260px", maxWidth: "100%" }}
              />
            </div>
          ) : (
            <>
              <div style={{ filter: "drop-shadow(0 0 40px rgba(212,160,74,0.25))" }}>
                <FreeCrest
                  surname={surname ?? ""}
                  legacyUrl={`${window.location.origin}/f/${(surname ?? "").toLowerCase()}`}
                />
              </div>
              <p
                className="mt-4 font-serif text-sm italic"
                style={{ color: "#a07830" }}
              >
                Your personalised crest is being forged…
              </p>
            </>
          )}
        </motion.div>

        <OrnamentDivider />

        {/* ── Chapter One ── */}
        {story?.chapterOneTitle && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <p className="mb-4 font-sans text-[10px] uppercase tracking-[3px] text-amber-dim text-center">
              Chapter I
            </p>
            <h2
              className="font-display text-2xl text-center sm:text-3xl"
              style={{ color: "#f0e8da" }}
            >
              {stripMarkdown(story.chapterOneTitle).replace(/^Chapter I\s*[—–-]\s*/i, "")}
            </h2>

            {story.chapterOneBody && (
              <>
                <ListenButton
                  chapterKey="ch1"
                  text={`${stripMarkdown(story.chapterOneTitle)}. ${stripMarkdown(story.chapterOneBody)}`}
                  tts={tts}
                />
                <p
                  className="mt-6 font-serif leading-[1.95] text-text-body"
                  style={{ fontSize: "1.0625rem", textAlign: "justify" }}
                >
                  <span
                    className="float-left mr-2 font-display leading-none text-amber-light"
                    style={{ fontSize: "4.2rem", lineHeight: "0.82", marginTop: "6px" }}
                  >
                    {stripMarkdown(story.chapterOneBody).charAt(0)}
                  </span>
                  {stripMarkdown(story.chapterOneBody).slice(1)}
                </p>
              </>
            )}
          </motion.section>
        )}

        {/* ── Chapters 2–9 ── */}
        {story?.teaserChapters && story.teaserChapters.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-14"
          >
            <OrnamentDivider />
            <p className="mb-8 font-sans text-[10px] uppercase tracking-[3px] text-amber-dim text-center">
              The Full Story — All 9 Chapters
            </p>

            {expandingChapters && !chapterBodies && (
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="py-8 text-center"
              >
                <p className="font-serif text-sm italic text-text-dim">
                  Writing your full story…
                </p>
              </motion.div>
            )}

            <div className="space-y-8">
              {story.teaserChapters.map((title, i) => {
                const body = chapterBodies?.[i] ?? null;
                const cleanTitle = stripMarkdown(title).replace(/^Chapter\s+[IVX]+\s*[—–-]\s*/i, "");
                return (
                  <motion.div
                    key={`ch${i + 2}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.9 + i * 0.07 }}
                  >
                    <p className="mb-1 font-sans text-[9px] uppercase tracking-[2px] text-amber-dim">
                      Chapter {["II","III","IV","V","VI","VII","VIII","IX"][i]}
                    </p>
                    <h3 className="font-display text-lg text-cream-warm">{cleanTitle}</h3>
                    {body ? (
                      <>
                        <ListenButton
                          chapterKey={`ch${i + 2}`}
                          text={`${cleanTitle}. ${stripMarkdown(body)}`}
                          tts={tts}
                        />
                        <p
                          className="mt-3 font-serif leading-[1.9] text-text-body"
                          style={{ fontSize: "0.9375rem", textAlign: "justify" }}
                        >
                          {stripMarkdown(body)}
                        </p>
                      </>
                    ) : expandingChapters ? (
                      <div className="mt-2 h-3 w-3/4 rounded-full bg-amber-dim/20 animate-pulse" />
                    ) : null}
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* ── Migration Timeline ── */}
        {facts?.migration?.waypoints && facts.migration.waypoints.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="mt-14"
          >
            <OrnamentDivider />
            <p className="mb-6 font-sans text-[10px] uppercase tracking-[3px] text-amber-dim text-center">
              The Bloodline's Journey
            </p>
            <div className="relative pl-6">
              {/* Vertical line */}
              <div
                className="absolute left-2 top-2 bottom-2 w-px"
                style={{ background: "linear-gradient(to bottom, #a07830, transparent)" }}
              />
              <div className="space-y-8">
                {facts.migration.waypoints.map((wp, i) => (
                  <motion.div
                    key={`${wp.region}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.1 + i * 0.1 }}
                    className="relative"
                  >
                    {/* Dot */}
                    <div
                      className="absolute -left-[18px] top-1.5 h-2.5 w-2.5 rounded-full border-2"
                      style={{ borderColor: "#a07830", background: "#0d0a07" }}
                    />
                    <p className="font-sans text-[10px] uppercase tracking-[2px] text-amber-dim">
                      {wp.century}
                    </p>
                    <p className="mt-0.5 font-display text-base text-cream-warm">
                      {wp.region}
                    </p>
                    <p className="mt-0.5 font-serif text-sm italic text-text-body">
                      {wp.role}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
            {facts.migration.closingLine && (
              <p className="mt-8 font-serif text-sm italic text-text-dim text-center">
                {facts.migration.closingLine}
              </p>
            )}
          </motion.section>
        )}

        {/* ── Symbolism ── */}
        {facts?.symbolism && facts.symbolism.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="mt-14"
          >
            <OrnamentDivider />
            <p className="mb-6 font-sans text-[10px] uppercase tracking-[3px] text-amber-dim text-center">
              Heraldic Symbolism
            </p>
            <div className="grid grid-cols-2 gap-4">
              {facts.symbolism.map((sym, i) => (
                <motion.div
                  key={`${sym.element}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 1.3 + i * 0.08 }}
                  className="rounded-[14px] border p-4"
                  style={{
                    background: "rgba(26,18,8,0.7)",
                    borderColor: "rgba(160,120,48,0.2)",
                  }}
                >
                  <p className="font-display text-sm text-amber-light">{sym.element}</p>
                  <p className="mt-1 font-serif text-xs italic text-text-dim">{sym.meaning}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Name Origin ── */}
        {facts?.meaning && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.3 }}
            className="mt-14"
          >
            <OrnamentDivider />
            <p className="mb-4 font-sans text-[10px] uppercase tracking-[3px] text-amber-dim text-center">
              The Name's Origin
            </p>
            <div
              className="rounded-[18px] border p-6"
              style={{ background: "rgba(26,18,8,0.7)", borderColor: "rgba(160,120,48,0.15)" }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="font-sans text-[9px] uppercase tracking-[2px] text-amber-dim">Origin</p>
                  <p className="mt-1 font-serif text-sm text-text-body">{facts.meaning.origin}</p>
                </div>
                <div>
                  <p className="font-sans text-[9px] uppercase tracking-[2px] text-amber-dim">Ancestral Role</p>
                  <p className="mt-1 font-serif text-sm text-text-body">{facts.meaning.role}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="font-sans text-[9px] uppercase tracking-[2px] text-amber-dim">Etymology</p>
                  <p className="mt-1 font-serif text-sm italic text-text-body">{facts.meaning.etymology}</p>
                </div>
                {facts.meaning.historicalContext && (
                  <div className="sm:col-span-2">
                    <p className="font-sans text-[9px] uppercase tracking-[2px] text-amber-dim">Historical Context</p>
                    <p className="mt-1 font-serif text-sm italic text-text-dim">{facts.meaning.historicalContext}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {/* ── Deep Legacy Research ── */}
        {deepLegacyResearch?.summary && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="mt-14"
          >
            <OrnamentDivider />
            <p className="mb-6 text-center font-sans uppercase" style={{ fontSize: "10px", letterSpacing: "3px", color: "#a07830" }}>
              Deep Legacy Research
            </p>
            <div
              className="rounded-[18px] border p-6 sm:p-8"
              style={{ background: "rgba(26,18,8,0.7)", borderColor: "rgba(160,120,48,0.15)" }}
            >
              <div className="space-y-5">
                {deepLegacyResearch.summary
                  .split(/\n\s*\n/)
                  .map((chunk) => chunk.trim())
                  .filter(Boolean)
                  .map((chunk, i) => (
                    <p
                      key={i}
                      className="font-serif text-text-body text-justify"
                      style={{ lineHeight: 1.95 }}
                    >
                      {chunk}
                    </p>
                  ))}
              </div>

              {deepLegacyResearch.sources.length > 0 && (
                <div className="mt-8">
                  <p
                    className="mb-3 font-sans uppercase"
                    style={{ fontSize: "9px", letterSpacing: "3px", color: "#a07830" }}
                  >
                    Sources
                  </p>
                  <ul className="space-y-2">
                    {deepLegacyResearch.sources.map((src, i) => (
                      <li key={i}>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-sans transition-colors"
                          style={{ fontSize: "12px", color: "#8a7e6e" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#d4a04a")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#8a7e6e")}
                        >
                          → {src.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* ── Deep Legacy Book (12 chapters) ── */}
        {deepChapters.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.45 }}
            className="mt-14"
          >
            <OrnamentDivider />
            <p
              className="mb-2 text-center font-sans uppercase"
              style={{ fontSize: "10px", letterSpacing: "3px", color: "#a07830" }}
            >
              Your Deep Legacy Book
            </p>
            <p
              className="mb-8 text-center font-serif italic"
              style={{ fontSize: "14px", color: "#c4b8a6" }}
            >
              A 12-chapter family novella
            </p>
            <div className="space-y-6">
              {deepChapters.map((ch) => (
                <DeepBookChapterCard key={ch.chapter_num} chapter={ch} tts={tts} />
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Deep Legacy Book pending state ── */}
        {deepLegacyResearch?.summary && deepChapters.length === 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.45 }}
            className="mt-10"
          >
            <div
              className="rounded-[22px] border p-6 sm:p-8 text-center"
              style={{ background: "rgba(26,18,8,0.5)", borderColor: "rgba(160,120,48,0.15)" }}
            >
              <p className="font-serif italic text-amber-dim" style={{ fontSize: "16px" }}>
                Your 12-chapter book is being written…
              </p>
              <p className="mt-2 font-sans text-text-dim" style={{ fontSize: "11px" }}>
                This takes about 2 minutes. Refresh the page when you're ready.
              </p>
            </div>
          </motion.section>
        )}

        {/* ── Actions ── */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
          className="mt-16"
        >
          <OrnamentDivider />

          {/* QR Code */}
          <div className="flex flex-col items-center">
            <p className="mb-5 font-sans text-[10px] uppercase tracking-[3px] text-amber-dim">
              Your shareable legacy link
            </p>
            <ShareQRCode
              url={`${window.location.origin}/f/${surname}`}
              surname={displaySurname}
            />
            <p className="mt-4 max-w-xs text-center font-serif text-xs italic text-text-dim">
              Share this QR with family and friends — or print it on any of our heirloom products.
            </p>
            <div className="mt-6 w-full">
              <SocialShare
                url={`${window.location.origin}/f/${surname}`}
                surname={displaySurname}
              />
            </div>
          </div>

          <OrnamentDivider />

          <div className="text-center">
            {/* Certificate download — hero CTA */}
            {facts && (
              <div
                className="mb-8 rounded-[18px] border p-6"
                style={{ background: "rgba(201,168,76,0.06)", borderColor: "rgba(201,168,76,0.25)" }}
              >
                <p className="font-sans text-[9px] uppercase tracking-[3px] text-amber-dim">Included in your Legacy Pack</p>
                <h3 className="mt-2 font-display text-xl text-cream-warm">Your Legacy Certificate</h3>
                <p className="mt-1 font-serif text-sm italic text-text-dim">
                  A formal, frameable certificate documenting your family lineage, crest, motto &amp; bloodline journey.
                </p>
                <button
                  onClick={() => generateCertificate({ facts, story, crestUrl, surname })}
                  className="mt-5 inline-flex items-center gap-2 rounded-pill px-10 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download Certificate
                </button>
                <p className="mt-2 font-sans text-[9px] text-text-dim">Opens as PDF · Print or frame it</p>
              </div>
            )}

            <p className="font-sans text-[10px] uppercase tracking-[3px] text-amber-dim">
              What would you like to do next?
            </p>

            <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <button
                onClick={() => navigate("/journey/6")}
                className="w-full rounded-pill px-10 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5 sm:w-auto"
                style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
              >
                Pass It On
              </button>

              <button
                onClick={() => navigate("/heirloom-order")}
                className="w-full rounded-pill px-10 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5 sm:w-auto"
                style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
              >
                Order Heirloom Mug →
              </button>
            </div>

            {crestUrl && (
              <div className="mt-8">
                <a
                  href={crestUrl}
                  download={`${displaySurname}-crest.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-sans text-[11px] uppercase tracking-[2px] text-amber-dim transition-colors hover:text-amber-light"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download Your Crest
                </a>
              </div>
            )}
          </div>
        </motion.section>

      </div>
    </div>
  );
};

export default MyLegacy;
