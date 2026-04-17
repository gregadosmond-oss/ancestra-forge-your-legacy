import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import { usePurchase } from "@/hooks/usePurchase";
import { supabase } from "@/integrations/supabase/client";
import { stripMarkdown } from "@/lib/utils";
import type { LegacyFacts, LegacyStory } from "@/types/legacy";

// ─── Data hook ────────────────────────────────────────────────────────────────

type LegacyData = {
  facts: LegacyFacts | null;
  story: LegacyStory | null;
  crestUrl: string | null;
  surname: string | null;
  loading: boolean;
  error: string | null;
};

function useLegacyData(userId: string | undefined): LegacyData {
  const [data, setData] = useState<LegacyData>({
    facts: null,
    story: null,
    crestUrl: null,
    surname: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!userId) {
      setData((d) => ({ ...d, loading: false }));
      return;
    }

    const load = async () => {
      try {
        // Step 1: get surname from profile
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("surname")
          .eq("id", userId)
          .maybeSingle();

        if (profileErr) throw new Error(profileErr.message);

        const surname = profile?.surname ?? null;
        if (!surname) {
          setData({ facts: null, story: null, crestUrl: null, surname: null, loading: false, error: null });
          return;
        }

        // Step 2: load facts + story + crest in parallel
        const [factsRes, crestRes] = await Promise.all([
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

        const facts = (factsRes.data?.payload as LegacyFacts) ?? null;
        const story = (factsRes.data as any)?.story_payload as LegacyStory ?? null;
        const crestUrl = crestRes.data?.image_url ?? null;

        setData({ facts, story, crestUrl, surname, loading: false, error: null });
      } catch (err) {
        setData((d) => ({ ...d, loading: false, error: (err as Error).message }));
      }
    };

    void load();
  }, [userId]);

  return data;
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

// ─── Main component ────────────────────────────────────────────────────────────

const MyLegacy = () => {
  const navigate = useNavigate();
  const { user, hasPurchased, loading: purchaseLoading } = usePurchase();
  const { facts, story, crestUrl, surname, loading, error } = useLegacyData(
    !purchaseLoading && hasPurchased ? user?.id : undefined
  );

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
  const allChapters = story
    ? [story.chapterOneTitle, ...story.teaserChapters]
    : [];

  return (
    <div className="min-h-screen px-6 pb-32 pt-16">
      <div className="mx-auto max-w-2xl">

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
            House {displaySurname}
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
        {crestUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="mt-12 flex justify-center"
          >
            <div className="relative">
              {/* Glow */}
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
          </motion.div>
        )}

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
            )}
          </motion.section>
        )}

        {/* ── All 9 Chapters ── */}
        {allChapters.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-14"
          >
            <OrnamentDivider />
            <p className="mb-5 font-sans text-[10px] uppercase tracking-[3px] text-amber-dim text-center">
              Your 9 Chapters
            </p>
            <ul className="space-y-3">
              {allChapters.map((title, i) => (
                <motion.li
                  key={`${title}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.9 + i * 0.06 }}
                  className="flex items-center gap-3 font-serif text-sm"
                  style={{ color: i === 0 ? "#e8b85c" : "#8a7e6e" }}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: i === 0 ? "#e8b85c" : "#3d3020" }}
                  />
                  {stripMarkdown(title)}
                </motion.li>
              ))}
            </ul>
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

        {/* ── Actions ── */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
          className="mt-16"
        >
          <OrnamentDivider />

          <div className="text-center">
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
                onClick={() => navigate("/shop")}
                className="w-full rounded-pill border px-10 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5 sm:w-auto"
                style={{
                  borderColor: "rgba(232,148,58,0.3)",
                  background: "rgba(232,148,58,0.06)",
                  color: "#d4a04a",
                }}
              >
                Browse Products
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
