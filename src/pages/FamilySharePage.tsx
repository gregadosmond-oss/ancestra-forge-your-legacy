import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { stripMarkdown } from "@/lib/utils";
import ShareQRCode from "@/components/ShareQRCode";
import SocialShare from "@/components/SocialShare";
import type { LegacyFacts, LegacyStory } from "@/types/legacy";

function OrnamentDivider() {
  return (
    <div className="my-8 flex items-center gap-3">
      <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, #a07830)" }} />
      <span className="font-serif text-base" style={{ color: "#a07830" }}>✦</span>
      <div className="h-px flex-1" style={{ background: "linear-gradient(to left, transparent, #a07830)" }} />
    </div>
  );
}

const FamilySharePage = () => {
  const { surname: rawSurname } = useParams<{ surname: string }>();
  const navigate = useNavigate();
  const surname = rawSurname?.toLowerCase().trim() ?? "";

  const [facts, setFacts] = useState<LegacyFacts | null>(null);
  const [story, setStory] = useState<LegacyStory | null>(null);
  const [crestUrl, setCrestUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!surname) { setNotFound(true); setLoading(false); return; }

    const load = async () => {
      const [factsRes, crestRes] = await Promise.all([
        supabase.from("surname_facts").select("payload, story_payload").eq("surname", surname).maybeSingle(),
        supabase.from("surname_crests").select("image_url").eq("surname", surname).maybeSingle(),
      ]);

      const f = factsRes.data?.payload as LegacyFacts | null;
      const s = (factsRes.data as any)?.story_payload as LegacyStory | null;
      const c = crestRes.data?.image_url ?? null;

      if (!f) { setNotFound(true); setLoading(false); return; }
      setFacts(f);
      setStory(s);
      setCrestUrl(c);
      setLoading(false);
    };

    void load();
  }, [surname]);

  const shareUrl = `${window.location.origin}/f/${surname}`;
  const displaySurname = facts?.displaySurname ?? (rawSurname ? rawSurname.charAt(0).toUpperCase() + rawSurname.slice(1) : "");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-serif text-sm italic" style={{ color: "#a07830" }}>Retrieving the legacy…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="font-sans text-[10px] uppercase tracking-[4px]" style={{ color: "#a07830" }}>Legacy Not Found</p>
        <h1 className="mt-4 font-display text-3xl" style={{ color: "#f0e8da" }}>
          This legacy hasn't been forged yet.
        </h1>
        <p className="mt-3 font-serif italic text-sm" style={{ color: "#8a7e6e" }}>
          Start the journey to discover and generate your family legacy.
        </p>
        <button
          onClick={() => navigate("/journey/1")}
          className="mt-8 rounded-pill px-10 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
        >
          Discover My Legacy
        </button>
      </div>
    );
  }

  // Preview body — first 380 chars then fade
  const fullBody = story ? stripMarkdown(story.chapterOneBody) : "";
  const previewBody = fullBody.slice(0, 380);
  const hasMore = fullBody.length > 380;

  return (
    <div className="min-h-screen px-6 pb-32 pt-12">
      <div className="mx-auto max-w-2xl">

        {/* ── Shared by badge ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8 text-center"
        >
          <span
            className="inline-block rounded-pill px-4 py-1.5 font-sans text-[9px] uppercase tracking-[3px]"
            style={{ background: "rgba(160,120,48,0.12)", border: "1px solid rgba(160,120,48,0.25)", color: "#a07830" }}
          >
            Shared Legacy
          </span>
        </motion.div>

        {/* ── House name + motto ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-center"
        >
          <h1 className="font-display text-4xl sm:text-5xl" style={{ color: "#f0e8da" }}>
            House {displaySurname}
          </h1>
          {facts?.mottoLatin && (
            <p className="mt-3 font-serif italic text-lg" style={{ color: "#e8b85c" }}>
              "{facts.mottoLatin}"
            </p>
          )}
          {facts?.mottoEnglish && (
            <p className="mt-1 font-sans text-[10px] uppercase tracking-[3px]" style={{ color: "#a07830" }}>
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
            className="mt-10 flex justify-center"
          >
            <div className="relative">
              <div
                className="pointer-events-none absolute inset-0 rounded-full blur-3xl"
                style={{ background: "radial-gradient(ellipse, rgba(232,184,92,0.18) 0%, transparent 70%)" }}
              />
              <img
                src={crestUrl}
                alt={`${displaySurname} coat of arms`}
                className="relative z-10 mx-auto"
                style={{ width: "220px", maxWidth: "100%" }}
              />
            </div>
          </motion.div>
        )}

        <OrnamentDivider />

        {/* ── Origin ── */}
        {facts?.meaning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center"
          >
            <p className="font-sans text-[9px] uppercase tracking-[3px]" style={{ color: "#a07830" }}>Origin</p>
            <p className="mt-1 font-serif text-sm" style={{ color: "#c4b8a6" }}>{facts.meaning.origin}</p>
            <p className="mt-2 font-serif italic text-sm" style={{ color: "#8a7e6e" }}>{facts.meaning.role}</p>
          </motion.div>
        )}

        <OrnamentDivider />

        {/* ── Chapter I preview ── */}
        {story && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <p className="mb-3 text-center font-sans text-[9px] uppercase tracking-[3px]" style={{ color: "#a07830" }}>
              Chapter I
            </p>
            <h2 className="mb-5 text-center font-display text-xl" style={{ color: "#f0e8da" }}>
              {stripMarkdown(story.chapterOneTitle).replace(/^Chapter I\s*[—–-]\s*/i, "")}
            </h2>

            <div className="relative">
              <p
                className="font-serif leading-[1.95]"
                style={{ fontSize: "1.0rem", textAlign: "justify", color: "#c4b8a6" }}
              >
                <span
                  className="float-left mr-2 font-display leading-none"
                  style={{ fontSize: "3.8rem", lineHeight: "0.82", marginTop: "6px", color: "#e8b85c" }}
                >
                  {previewBody.charAt(0)}
                </span>
                {previewBody.slice(1)}{hasMore ? "…" : ""}
              </p>

              {/* Fade mask */}
              {hasMore && (
                <div
                  className="pointer-events-none absolute bottom-0 left-0 right-0 h-20"
                  style={{ background: "linear-gradient(to bottom, transparent, rgba(13,10,7,0.95))" }}
                />
              )}
            </div>
          </motion.div>
        )}

        {/* ── Locked chapters teaser ── */}
        {story && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-6 rounded-[18px] border px-6 py-5 text-center"
            style={{ background: "rgba(26,18,8,0.7)", borderColor: "rgba(232,148,58,0.15)" }}
          >
            <p className="font-display text-lg" style={{ color: "#f0e8da" }}>8 more chapters await.</p>
            <p className="mt-1 font-serif italic text-sm" style={{ color: "#8a7e6e" }}>
              The full story, high-res crest, family tree &amp; legacy certificate.
            </p>
          </motion.div>
        )}

        <OrnamentDivider />

        {/* ── QR code ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="flex flex-col items-center"
        >
          <p className="mb-5 font-sans text-[9px] uppercase tracking-[3px]" style={{ color: "#a07830" }}>
            Share this legacy
          </p>
          <ShareQRCode url={shareUrl} surname={displaySurname} />

          <div className="mt-6 w-full">
            <SocialShare url={shareUrl} surname={displaySurname} />
          </div>
        </motion.div>

        <OrnamentDivider />

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="text-center"
        >
          <p className="font-serif italic text-sm" style={{ color: "#8a7e6e" }}>
            Every family has a story worth telling.
          </p>
          <button
            onClick={() => navigate("/journey/1")}
            className="mt-5 rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
          >
            Discover My Family Legacy
          </button>
          <p className="mt-3 font-sans text-[10px]" style={{ color: "#8a7e6e" }}>
            Free to start · No credit card needed
          </p>
        </motion.div>

      </div>
    </div>
  );
};

export default FamilySharePage;
