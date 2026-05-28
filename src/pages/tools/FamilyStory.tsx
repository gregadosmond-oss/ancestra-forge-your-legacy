import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import SectionLabel from "@/components/journey/SectionLabel";
import ScrollChevron from "@/components/ScrollChevron";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useMarkToolComplete } from "@/hooks/useMarkToolComplete";
import { fetchLegacy } from "@/lib/legacyClient";
import { stripMarkdown } from "@/lib/utils";
import type { LegacyStory } from "@/types/legacy";

type Phase = "loading" | "expanding" | "ready" | "error";

const Ornament = () => (
  <div className="my-6 flex items-center gap-3">
    <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, #a07830)" }} />
    <span className="font-serif text-base text-amber-dim">✦</span>
    <div className="h-px flex-1" style={{ background: "linear-gradient(to left, transparent, #a07830)" }} />
  </div>
);

const FamilyStory = () => {
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [surname, setSurname] = useState<string>("");
  const [displaySurname, setDisplaySurname] = useState<string>("");
  const [story, setStory] = useState<LegacyStory | null>(null);
  const [finished, setFinished] = useState(false);
  const ranRef = useRef(false);

  usePageMeta({
    title: displaySurname ? `The ${displaySurname} Family Story — AncestorsQR` : "Get Your Family Story — AncestorsQR",
    description: "Read your full family story — AI-written chapters tracing your surname through history, migration, and legacy.",
  });

  useMarkToolComplete("story", finished);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError("Please sign in."); setPhase("error"); return; }

        const { data: profile } = await supabase
          .from("profiles")
          .select("surname")
          .eq("id", user.id)
          .maybeSingle();

        const sn = (profile?.surname ?? "").trim();
        if (!sn) { setError("Add a surname to your profile to read your story."); setPhase("error"); return; }
        setSurname(sn);
        setDisplaySurname(sn.charAt(0).toUpperCase() + sn.slice(1).toLowerCase());

        const legacy = await fetchLegacy(sn);
        if (legacy.code !== "OK" || !legacy.story) {
          setError("We couldn't read this surname's archive. Try again shortly.");
          setPhase("error");
          return;
        }
        if (legacy.facts?.displaySurname) setDisplaySurname(legacy.facts.displaySurname);
        setStory(legacy.story);

        const hasBodies = legacy.story.chapterBodies && legacy.story.chapterBodies.length >= legacy.story.teaserChapters.length;
        if (!hasBodies) {
          setPhase("expanding");
          const { data, error: fnErr } = await supabase.functions.invoke<{ code: string; chapterBodies?: string[] }>(
            "expand-chapters",
            { body: { surname: sn } },
          );
          if (fnErr) throw new Error(fnErr.message);
          if (data?.chapterBodies) {
            setStory((prev) => prev ? { ...prev, chapterBodies: data.chapterBodies } : prev);
          }
        }
        setPhase("ready");
      } catch (e) {
        console.error("FamilyStory error", e);
        setError("The quill paused. Try again shortly.");
        setPhase("error");
      }
    })();
  }, []);

  if (phase === "loading" || phase === "expanding") {
    return (
      <div className="min-h-screen bg-background px-6 py-24 text-center">
        <SectionLabel>YOUR STORY</SectionLabel>
        <h1 className="mt-6 font-display text-3xl text-cream-warm">
          {displaySurname ? `The ${displaySurname} Family Story` : "Your Family Story"}
        </h1>
        <p className="mt-6 font-serif italic text-amber-light">
          {phase === "expanding" ? "Writing the remaining chapters…" : "Opening the archive…"}
        </p>
      </div>
    );
  }

  if (phase === "error" || !story) {
    return (
      <div className="min-h-screen bg-background px-6 py-24 text-center">
        <h1 className="font-display text-3xl text-cream-warm">Your Family Story</h1>
        <p className="mt-4 font-serif italic text-amber-light">{error ?? "Unavailable."}</p>
      </div>
    );
  }

  const bodies = story.chapterBodies ?? [];
  const allChapters: { title: string; body: string }[] = [
    { title: story.chapterOneTitle, body: story.chapterOneBody },
    ...story.teaserChapters.map((title, i) => ({ title, body: bodies[i] ?? "" })),
  ];

  return (
    <div className="relative flex min-h-[72vh] flex-col items-center bg-background px-6 pt-16 pb-32">
      <SectionLabel>YOUR STORY</SectionLabel>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="mt-6 mb-12 text-center"
      >
        <p className="font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">The Story of</p>
        <h1 className="font-display text-4xl text-cream-warm sm:text-5xl">House of {displaySurname}</h1>
      </motion.div>

      <div className="w-full max-w-2xl">
        {allChapters.map((ch, idx) => (
          <section key={idx} className="mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="text-center font-display text-2xl text-cream-warm sm:text-3xl"
            >
              <span className="block font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">
                Chapter {idx + 1}
              </span>
              <span className="mt-2 block">{stripMarkdown(ch.title)}</span>
            </motion.h2>
            <Ornament />
            {ch.body ? (
              <p
                className="font-serif leading-[1.95] text-text-body whitespace-pre-line"
                style={{ fontSize: "1.0625rem", textAlign: "justify" }}
              >
                {idx === 0 && (
                  <span
                    className="float-left mr-2 font-display leading-none text-amber-light"
                    style={{ fontSize: "4.2rem", lineHeight: "0.82", marginTop: "6px" }}
                  >
                    {stripMarkdown(ch.body).charAt(0)}
                  </span>
                )}
                {idx === 0 ? stripMarkdown(ch.body).slice(1) : stripMarkdown(ch.body)}
              </p>
            ) : (
              <p className="text-center font-serif italic text-amber-dim">This chapter is still being written…</p>
            )}
            <Ornament />
          </section>
        ))}

        <div className="mt-8 text-center">
          <button
            onClick={() => setFinished(true)}
            disabled={finished}
            className="rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-70"
            style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
          >
            {finished ? "Story Complete ✦" : "Mark Story as Read"}
          </button>
          {finished && (
            <p className="mt-4 font-serif italic text-amber-light">
              The {displaySurname} story lives on through you.
            </p>
          )}
        </div>
      </div>
      <ScrollChevron />
    </div>
  );
};

export default FamilyStory;
