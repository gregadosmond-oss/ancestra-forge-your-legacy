import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SectionLabel from "@/components/journey/SectionLabel";
import { usePurchase } from "@/hooks/usePurchase";
import { supabase } from "@/integrations/supabase/client";
import { stripMarkdown } from "@/lib/utils";
import ShareQRCode from "@/components/ShareQRCode";
import SocialShare from "@/components/SocialShare";
import { generateCertificate } from "@/lib/generateCertificate";
import { fetchLegacy, fetchCrest } from "@/lib/legacyClient";
import type { LegacyFacts, LegacyStory } from "@/types/legacy";

// ─── Data hook ────────────────────────────────────────────────────────────────

type LegacyData = {
  facts: LegacyFacts | null;
  story: LegacyStory | null;
  crestUrl: string | null;
  surname: string | null;
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

        const surname = profile?.surname
          ?? sessionStorage.getItem("ancestra_journey_surname")
          ?? null;

        if (!surname) {
          setData({ facts: null, story: null, crestUrl: null, surname: null, loading: false, generating: false, error: null });
          return;
        }

        // Save to profile for next time if it was missing
        if (!profile?.surname) {
          await supabase.from("profiles").upsert({ id: userId, surname }, { onConflict: "id" });
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

        let facts = (factsRes.data?.payload as LegacyFacts) ?? null;
        let story = (factsRes.data as any)?.story_payload as LegacyStory ?? null;
        let crestUrl = crestRes.data?.image_url ?? null;

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
              facts = (factsRes2.data?.payload as LegacyFacts) ?? facts;
              story = ((factsRes2.data as any)?.story_payload as LegacyStory) ?? story;
              crestUrl = crestRes2.data?.image_url ?? null;

              // If crest still missing, generate it too
              if (!crestUrl && facts) {
                try {
                  const crest = await fetchCrest(surname, facts);
                  crestUrl = crest.imageUrl;
                } catch {
                  // crest generation failure is non-fatal
                }
              }
            }
          } catch {
            // generation failure is non-fatal — show what we have
          }
          setData({ facts, story, crestUrl, surname, loading: false, generating: false, error: null });
          return;
        }

        setData({ facts, story, crestUrl, surname, loading: false, generating: false, error: null });
      } catch (err) {
        setData((d) => ({ ...d, loading: false, generating: false, error: (err as Error).message }));
      }
    };

    void load();
  }, [userId]);

  return data;
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

// ─── Main component ────────────────────────────────────────────────────────────

const MyLegacy = () => {
  const navigate = useNavigate();
  const { user, hasPurchased, loading: purchaseLoading } = usePurchase();
  const { facts, story, crestUrl, surname, loading, generating, error } = useLegacyData(
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
  const { chapterBodies, expanding: expandingChapters } = useExpandChapters(surname, story);

  return (
    <div className="relative min-h-screen px-6 pb-32 pt-16">
      <img src="/hero.jpg" alt="" className="pointer-events-none fixed inset-0 h-full w-full object-cover" style={{ objectPosition: "center 30%", opacity: 0.38, filter: "saturate(0.7) brightness(0.95)" }} />
      <div className="relative z-10 mx-auto max-w-2xl">

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
                      <p
                        className="mt-3 font-serif leading-[1.9] text-text-body"
                        style={{ fontSize: "0.9375rem", textAlign: "justify" }}
                      >
                        {stripMarkdown(body)}
                      </p>
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
                  onClick={() => generateCertificate({ facts, story, crestUrl })}
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
