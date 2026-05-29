import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { stripMarkdown } from "@/lib/utils";
import LegacyChart, { type TreePerson } from "@/components/journey/LegacyChart";

type TreeRow = {
  id: string;
  name: string;
  birth_date: string | null;
  birth_place: string | null;
  death_date: string | null;
  death_place: string | null;
  position: number | null;
};

type MemoryRow = {
  id: string;
  relative_name: string;
  relationship: string;
  answers: Record<string, unknown> | null;
  created_at: string;
};

type Fixture = {
  surname?: string;
  generatedAt?: string;
  facts?: any;
  story?: {
    chapterOneTitle?: string;
    chapterOneBody?: string;
    teaserChapters?: string[];
    chapterBodies?: string[];
  };
  chapters?: any;
};

type Phase = "loading" | "generating" | "generating-personal" | "ready" | "error";
type MemoryProsePhase = "idle" | "loading" | "ready" | "error";
type PersonalStoryPhase = "idle" | "loading" | "ready" | "error";

type PersonalChapter = { title: string; body: string };
type PersonalStory = {
  chapterOne: PersonalChapter;
  chapters: PersonalChapter[];
};

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];

const Ornament = () => (
  <div className="my-8 flex items-center gap-3">
    <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, #a07830)" }} />
    <span className="font-serif text-base text-amber-dim">✦ ❦ ✦</span>
    <div className="h-px flex-1" style={{ background: "linear-gradient(to left, transparent, #a07830)" }} />
  </div>
);

function extractChapterBodies(fx: Fixture): string[] {
  const ch = fx.chapters ?? {};
  if (Array.isArray(ch?.chapterBodies)) return ch.chapterBodies;
  if (Array.isArray(fx.story?.chapterBodies)) return fx.story!.chapterBodies!;
  if (Array.isArray(ch?.chapters)) return ch.chapters.map((c: any) => c?.body ?? "");
  if (Array.isArray(ch?.expandedChapters)) return ch.expandedChapters.map((c: any) => c?.body ?? "");
  if (Array.isArray(ch)) return ch.map((c: any) => c?.body ?? "");
  return [];
}

const Novel = () => {
  const [phase, setPhase] = useState<Phase>("loading");
  const [fixture, setFixture] = useState<Fixture | null>(null);
  const [surname, setSurname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [treeMembers, setTreeMembers] = useState<TreeRow[]>([]);
  const [memories, setMemories] = useState<MemoryRow[]>([]);
  const [memoriesProse, setMemoriesProse] = useState<string | null>(null);
  const [memoriesProsePhase, setMemoriesProsePhase] = useState<MemoryProsePhase>("idle");
  const [personalStory, setPersonalStory] = useState<PersonalStory | null>(null);
  const [personalStoryPhase, setPersonalStoryPhase] = useState<PersonalStoryPhase>("idle");
  const ranRef = useRef(false);


  const displaySurname =
    fixture?.facts?.displaySurname ||
    fixture?.facts?.surname ||
    surname ||
    "";

  usePageMeta({
    title: displaySurname
      ? `The ${displaySurname} Novel — AncestorsQR`
      : "Your Digital Novel — AncestorsQR",
    description:
      "Read your family's full story as a beautifully written digital novel. Every chapter of your bloodline, brought to life.",
  });

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Please sign in.");
          setPhase("error");
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("surname")
          .eq("id", user.id)
          .maybeSingle();
        const sn = (profile?.surname ?? "").trim();
        if (!sn) {
          setError("Add a surname to your profile to open your novel.");
          setPhase("error");
          return;
        }
        setSurname(sn);

        // Try to fetch existing fixture
        let { data: getRes, error: getErr } = await supabase.functions.invoke<{
          fixture?: Fixture;
          error?: string;
        }>("get-legacy-fixture", { body: { surname: sn } });

        if (getErr || !getRes?.fixture) {
          // Build it on demand
          setPhase("generating");
          const { error: genErr } = await supabase.functions.invoke(
            "generate-legacy-fixture",
            { body: { surname: sn } },
          );
          if (genErr) throw new Error(genErr.message);
          const second = await supabase.functions.invoke<{ fixture?: Fixture }>(
            "get-legacy-fixture",
            { body: { surname: sn } },
          );
          if (second.error || !second.data?.fixture) {
            throw new Error(second.error?.message ?? "Fixture missing after generate");
          }
          getRes = second.data;
        }

        setFixture(getRes!.fixture!);

        // Personal sections: tree + memories (RLS scopes to this user)
        const [treeRes, memRes] = await Promise.all([
          supabase
            .from("family_tree_members")
            .select("id,name,birth_date,birth_place,death_date,death_place,position")
            .eq("user_id", user.id)
            .order("position", { ascending: true }),
          supabase
            .from("family_memories")
            .select("id,relative_name,relationship,answers,created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true }),
        ]);
        if (treeRes.data) setTreeMembers(treeRes.data as TreeRow[]);
        const mems = (memRes.data ?? []) as MemoryRow[];
        if (memRes.data) setMemories(mems);

        // Lazily refresh / fetch AI-woven memories chapter (only regenerates when memories changed)
        if (mems.length > 0) {
          setMemoriesProsePhase("loading");
          supabase.functions
            .invoke<{ prose?: string | null }>("weave-memories-chapter", {
              body: { user_id: user.id },
            })
            .then(({ data, error }) => {
              if (error) throw error;
              const prose = typeof data?.prose === "string" ? data.prose.trim() : "";
              if (prose.length > 0) {
                setMemoriesProse(prose);
                setMemoriesProsePhase("ready");
              } else {
                setMemoriesProsePhase("error");
              }
            })
            .catch((e) => {
              console.warn("weave-memories-chapter failed", e);
              setMemoriesProsePhase("error");
            });
        } else {
          setMemoriesProsePhase("idle");
        }

        // Lazily fetch the personal woven 9-chapter story (cached per-user by signature)
        setPersonalStoryPhase("loading");
        supabase.functions
          .invoke<{ chapters?: PersonalStory }>("generate-personal-story", {
            body: { user_id: user.id },
          })
          .then(({ data, error }) => {
            if (error) throw error;
            const ch = data?.chapters;
            if (
              ch &&
              ch.chapterOne?.body &&
              Array.isArray(ch.chapters) &&
              ch.chapters.length === 8
            ) {
              setPersonalStory(ch);
              setPersonalStoryPhase("ready");
            } else {
              setPersonalStoryPhase("error");
            }
          })
          .catch((e) => {
            console.warn("generate-personal-story failed; falling back to shared story", e);
            setPersonalStoryPhase("error");
          });

        setPhase("ready");


      } catch (e) {
        console.error("Novel load error", e);
        setError("The archive could not be opened. Try again shortly.");
        setPhase("error");
      }
    })();
  }, []);

  // Reading progress bar
  useEffect(() => {
    if (phase !== "ready") return;
    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      setProgress(total > 0 ? Math.min(100, Math.max(0, (h.scrollTop / total) * 100)) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [phase]);

  if (phase === "loading" || phase === "generating") {
    return (
      <div className="min-h-screen bg-background px-6 py-24 text-center">
        <h1 className="font-display text-3xl text-cream-warm">
          {displaySurname ? `The ${displaySurname} Novel` : "Your Novel"}
        </h1>
        <p className="mt-6 font-serif italic text-amber-light">
          {phase === "generating"
            ? "Forging your novel from the archive… this can take up to a minute."
            : "Opening the archive…"}
        </p>
      </div>
    );
  }

  if (phase === "error" || !fixture) {
    return (
      <div className="min-h-screen bg-background px-6 py-24 text-center">
        <h1 className="font-display text-3xl text-cream-warm">Your Novel</h1>
        <p className="mt-4 font-serif italic text-amber-light">{error ?? "Unavailable."}</p>
      </div>
    );
  }

  const facts = fixture.facts ?? {};
  const story = fixture.story ?? {};
  const mottoLatin: string = facts.mottoLatin || "";
  const mottoEnglish: string = facts.mottoEnglish || "";
  const generatedDate = fixture.generatedAt
    ? new Date(fixture.generatedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  const crestImageUrl: string =
    facts.crestImageUrl || facts.crestUrl || (fixture as any).crestImageUrl || "";
  const migrationYear =
    facts?.migration?.year ||
    facts?.migration?.waypoints?.[0]?.century ||
    facts?.migration?.waypoints?.[0]?.year ||
    "antiquity";

  // Prefer personalized 9-chapter story when available; otherwise fall back to shared surname story.
  const allChapters: { num: string; title: string; body: string }[] = personalStory
    ? [
        {
          num: "I",
          title: personalStory.chapterOne.title || "Chapter I",
          body: stripMarkdown(personalStory.chapterOne.body || ""),
        },
        ...personalStory.chapters.slice(0, 8).map((c, i) => ({
          num: ROMAN[i + 1],
          title: c.title,
          body: stripMarkdown(c.body || ""),
        })),
      ]
    : (() => {
        const chapterOneTitle: string = story.chapterOneTitle || "Chapter I";
        const chapterOneBody: string = stripMarkdown(story.chapterOneBody || "");
        const teaserChapters: string[] = Array.isArray(story.teaserChapters)
          ? story.teaserChapters.slice(0, 8)
          : [];
        const chapterBodies = extractChapterBodies(fixture);
        return [
          { num: "I", title: chapterOneTitle, body: chapterOneBody },
          ...teaserChapters.map((title, i) => ({
            num: ROMAN[i + 1],
            title,
            body: stripMarkdown(chapterBodies[i] ?? ""),
          })),
        ];
      })();


  const certNumber = `${displaySurname.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)}-${Date.now().toString().slice(-6)}`;

  // Build generations for the Family Tree section (sorted oldest → youngest)
  const treeGenerations: TreePerson[][] = (() => {
    if (treeMembers.length === 0) return [];
    const sorted = [...treeMembers].sort((a, b) => {
      const ay = parseInt(String(a.birth_date ?? "").slice(0, 4), 10);
      const by = parseInt(String(b.birth_date ?? "").slice(0, 4), 10);
      const aNum = Number.isNaN(ay) ? 9999 : ay;
      const bNum = Number.isNaN(by) ? 9999 : by;
      if (aNum !== bNum) return aNum - bNum;
      return (a.position ?? 0) - (b.position ?? 0);
    });
    return sorted.map((m) => [
      {
        name: m.name,
        birthYear: m.birth_date ?? null,
        birthPlace: m.birth_place ?? null,
        deathYear: m.death_date ?? null,
        deathPlace: m.death_place ?? null,
      } as TreePerson,
    ]);
  })();
  const treeOriginPlace =
    treeMembers.map((m) => m.birth_place).find((p) => !!p) ?? null;

  return (
    <div className="relative min-h-screen bg-background">
      {/* Reading progress */}
      <div className="fixed left-0 right-0 top-0 z-50 h-[3px] bg-transparent">
        <div
          className="h-full transition-[width] duration-150"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #e8943a, #d4a04a)",
          }}
        />
      </div>

      <div className="mx-auto max-w-2xl px-6 pt-20 pb-32">
        {/* Title page */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex min-h-[80vh] flex-col items-center justify-center text-center"
        >
          <p className="font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">
            A Family Legacy
          </p>
          <h1 className="mt-6 font-display text-4xl text-cream-warm sm:text-5xl">
            The House of
          </h1>
          <div className="mt-3 font-display text-5xl italic text-amber-light sm:text-6xl">
            {displaySurname}
          </div>
          <div className="mt-8 text-base tracking-[0.4em] text-amber-dim">✦ ❦ ✦</div>
          {mottoLatin && (
            <p className="mt-8 font-serif text-xl italic text-cream-soft">
              "{mottoLatin}"
            </p>
          )}
          {mottoEnglish && (
            <p className="mt-2 font-serif italic text-amber-dim">{mottoEnglish}</p>
          )}
          {generatedDate && (
            <p className="mt-10 font-sans text-[10px] uppercase tracking-[3px] text-text-dim">
              Forged {generatedDate}
            </p>
          )}
        </motion.section>

        {/* Dedication */}
        <section className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <p className="font-serif text-xl italic leading-relaxed text-cream-soft">
            For the House of {displaySurname} —<br />
            past, present, and future.
          </p>
        </section>

        {/* Table of contents */}
        <section className="py-20">
          <h2 className="text-center font-display text-3xl text-cream-warm">Contents</h2>
          <Ornament />
          <ul className="mx-auto max-w-md space-y-3">
            {allChapters.map((ch) => (
              <li key={ch.num} className="flex items-baseline gap-3 font-serif text-text">
                <a
                  href={`#chapter-${ch.num}`}
                  className="flex w-full items-baseline gap-3 hover:text-amber-light"
                >
                  <span className="font-display text-amber-light">{ch.num}.</span>
                  <span className="flex-1 italic">{stripMarkdown(ch.title)}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* Chapters */}
        {allChapters.map((ch, idx) => (
          <section
            key={ch.num}
            id={`chapter-${ch.num}`}
            className="mb-20 scroll-mt-24"
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="flex min-h-[55vh] flex-col items-center justify-center text-center"
            >
              <p className="font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">
                Chapter
              </p>
              <div className="mt-6 font-display text-7xl italic text-amber-light">
                {ch.num}
              </div>
              <h3 className="mt-8 max-w-md font-serif text-2xl italic text-cream-warm">
                {stripMarkdown(ch.title)}
              </h3>
              <div className="mt-10 text-sm tracking-[0.4em] text-amber-dim">✦ ❦ ✦</div>
            </motion.div>

            <Ornament />

            {ch.body ? (
              <p
                className="whitespace-pre-line font-serif leading-[1.95] text-text-body"
                style={{ fontSize: "1.0625rem", textAlign: "justify" }}
              >
                <span
                  className="float-left mr-2 font-display leading-none text-amber-light"
                  style={{ fontSize: "4.2rem", lineHeight: "0.82", marginTop: "6px" }}
                >
                  {ch.body.charAt(0)}
                </span>
                {ch.body.slice(1)}
              </p>
            ) : (
              <p className="text-center font-serif italic text-amber-dim">
                This chapter is still being written…
              </p>
            )}
            <Ornament />
          </section>
        ))}

        {/* Afterword */}
        <section className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
          <h2 className="font-display text-3xl italic text-amber-light">Afterword</h2>
          <p className="mt-10 max-w-lg font-serif text-lg leading-[1.9] text-text-body">
            Every family leaves a trail. Some trails are carved in stone, others written
            in ledgers, and some — like the House of {displaySurname} — are preserved in
            the cadence of stories passed from one breath to the next. This volume is
            one such breath. May you carry it forward.
          </p>
          {mottoLatin && (
            <p className="mt-10 font-serif text-lg italic text-cream-soft">
              "{mottoLatin}"
            </p>
          )}
          {mottoEnglish && (
            <p className="mt-2 font-serif italic text-amber-dim">— {mottoEnglish}</p>
          )}
        </section>

        {/* Family Tree */}
        {treeMembers.length > 0 && (
          <>
            <section className="flex min-h-[40vh] flex-col items-center justify-center py-16 text-center">
              <p className="font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">
                Part Two
              </p>
              <h2 className="mt-6 font-display text-4xl italic text-amber-light">
                Your Family Tree
              </h2>
              <div className="mt-6 text-sm tracking-[0.4em] text-amber-dim">✦ ❦ ✦</div>
            </section>
            <section className="py-8">
              <LegacyChart
                surname={displaySurname || "Family"}
                generations={treeGenerations}
                originPlace={treeOriginPlace}
                currentPlace={null}
              />
            </section>
          </>
        )}

        {/* In Their Words — Family Memories */}
        {memories.length > 0 && (
          <>
            <section className="flex min-h-[40vh] flex-col items-center justify-center py-16 text-center">
              <p className="font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">
                Part Three
              </p>
              <h2 className="mt-6 font-display text-4xl italic text-amber-light">
                In Their Words
              </h2>
              <p className="mt-4 font-serif italic text-cream-soft">
                Family Memories
              </p>
              <div className="mt-6 text-sm tracking-[0.4em] text-amber-dim">✦ ❦ ✦</div>
            </section>
            <section className="py-8">

              {memoriesProse && memoriesProse.trim().length > 0 ? (
                <div className="mx-auto max-w-xl">
                  {memoriesProse
                    .split(/\n\s*\n/)
                    .map((b) => b.trim())
                    .filter(Boolean)
                    .map((block, i) => {
                      if (block.startsWith("## ")) {
                        return (
                          <h3
                            key={i}
                            className="mt-12 text-center font-display text-2xl text-cream-warm first:mt-0"
                          >
                            {block.slice(3).trim()}
                          </h3>
                        );
                      }
                      if (block.startsWith("_") && block.endsWith("_")) {
                        return (
                          <p
                            key={i}
                            className="text-center font-serif italic text-amber-dim"
                          >
                            {block.slice(1, -1).trim()}
                          </p>
                        );
                      }
                      return (
                        <p
                          key={i}
                          className="mt-5 whitespace-pre-line font-serif leading-[1.85] text-text-body"
                          style={{ fontSize: "1.0625rem", textAlign: "justify" }}
                        >
                          {block}
                        </p>
                      );
                    })}
                </div>
              ) : memoriesProsePhase === "loading" ? (
                <div className="mx-auto max-w-xl text-center">
                  <p className="font-serif italic leading-[1.85] text-amber-dim">
                    Weaving these memories into the House chronicle…
                  </p>
                </div>
              ) : (
                memories.map((m) => {
                  const entries = m.answers && typeof m.answers === "object"
                    ? Object.entries(m.answers as Record<string, unknown>).filter(
                        ([, v]) => v != null && String(v).trim().length > 0,
                      )
                    : [];
                  return (
                    <div key={m.id} className="mb-16">
                      <h3 className="text-center font-display text-2xl text-cream-warm">
                        {m.relative_name}
                      </h3>
                      <p className="text-center font-serif italic text-amber-dim">
                        {m.relationship}
                      </p>
                      <Ornament />
                      <div className="mx-auto max-w-xl space-y-6">
                        {entries.length === 0 ? (
                          <p className="text-center font-serif italic text-text-dim">
                            (No memories recorded yet.)
                          </p>
                        ) : (
                          entries.map(([q, a]) => (
                            <div key={q}>
                              <p className="font-sans text-[10px] uppercase tracking-[3px] text-amber-dim">
                                {q}
                              </p>
                              <p
                                className="mt-2 whitespace-pre-line font-serif leading-[1.85] text-text-body"
                                style={{ fontSize: "1.0625rem" }}
                              >
                                {String(a)}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </section>


          </>
        )}

        {/* Legacy Certificate */}
        <section className="py-16">
          <div
            className="mx-auto max-w-xl rounded-[22px] border p-10 text-center"
            style={{ borderColor: "#3d3020", background: "#13100b" }}
          >
            <div className="font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">
              Legacy Certificate
            </div>
            <div className="mt-4 text-amber-dim">❦</div>
            {crestImageUrl && (
              <img
                src={crestImageUrl}
                alt={`${displaySurname} family crest`}
                className="mx-auto my-6 h-40 w-40 object-contain"
              />
            )}
            <h3 className="font-display text-2xl text-cream-warm">
              House of {displaySurname}
            </h3>
            <div className="my-5 h-px" style={{ background: "#3d3020" }} />
            <p className="font-serif text-text-body">
              This certifies that the House of {displaySurname} bears the arms since{" "}
              {String(migrationYear)}.
            </p>
            {mottoLatin && (
              <p className="mt-5 font-serif italic text-cream-soft">"{mottoLatin}"</p>
            )}
            {mottoEnglish && (
              <p className="font-serif italic text-amber-dim">— {mottoEnglish}</p>
            )}
            <div className="my-5 h-px" style={{ background: "#3d3020" }} />
            <div className="font-sans text-[10px] uppercase tracking-[3px] text-text-dim">
              Issued by AncestorsQR · Certificate № {certNumber}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-12 text-center">
          <p className="font-serif italic text-amber-light">
            Hold the House of {displaySurname} in your hands.
          </p>
          <Link
            to="/legacy-book"
            className="mt-6 inline-block rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #e8943a, #c47828)",
              color: "#1a1208",
            }}
          >
            Order the Printed Book — $99
          </Link>
          <p className="mt-4 font-sans text-[11px] uppercase tracking-[2px] text-text-dim">
            Hardcover · Printed by Gelato · Identical to this novel
          </p>
        </section>
      </div>
    </div>
  );
};

export default Novel;
