import { useEffect, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import SectionLabel from "@/components/journey/SectionLabel";
import MigrationPath from "@/components/journey/MigrationPath";
import RetryInline from "@/components/journey/RetryInline";
import ScrollChevron from "@/components/ScrollChevron";
import { useJourney } from "@/contexts/JourneyContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { initiateFamilySearchOAuth } from "@/lib/familySearchAuth";
import { usePageMeta } from "@/hooks/usePageMeta";

type Phase =
  | "idle"
  | "searching"
  | "matches"
  | "tree-loading"
  | "tree-ready"
  | "error"
  | "no-fs-session";

type Match = {
  id: string | null;
  name: string | null;
  given_name?: string | null;
  surname?: string | null;
  birth_date?: string | null;
  birth_place?: string | null;
  death_date?: string | null;
  death_place?: string | null;
  score?: number | null;
};

type TreePerson = {
  id: string;
  name?: string | null;
  given_name?: string | null;
  surname?: string | null;
  birth_date?: string | null;
  birth_place?: string | null;
  death_date?: string | null;
  generation?: number;
  parent_ids?: string[];
};

type TreeResult = {
  root_id: string;
  persons: TreePerson[];
};

const cardBase =
  "rounded-[14px] border border-amber-dim/20 bg-card/60 p-5 backdrop-blur-sm transition-all duration-300 hover:border-amber/50 hover:bg-card/80";

const Stop3Bloodline = () => {
  usePageMeta({ title: "Your Bloodline | AncestorsQR", description: "The names, places, and journeys that shaped your family." });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { unknownSurname, surname, facts } = useJourney();
  const { user, loading: authLoading } = useAuth();

  const [phase, setPhase] = useState<Phase>("idle");
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [tree, setTree] = useState<TreeResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [connecting, setConnecting] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [fatherFirst, setFatherFirst] = useState("");
  const [motherFirst, setMotherFirst] = useState("");
  const [motherMaiden, setMotherMaiden] = useState("");

  useEffect(() => {
    if (unknownSurname) navigate("/journey/1", { replace: true });
    else if (!surname) navigate("/journey/1", { replace: true });
  }, [unknownSurname, surname, navigate]);

  // Handle OAuth return: ?fs_connected=true → auto-pull tree
  useEffect(() => {
    if (searchParams.get("fs_connected") === "true" && user) {
      navigate("/journey/3", { replace: true });
      void pullTree(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user]);

  if (!surname) return null;

  const waypoints = facts.data?.migration.waypoints ?? [];
  const closingLine = facts.data?.migration.closingLine;
  const totalReveal = waypoints.length * 0.18 + 0.5;

  // FamilySearch integration is built but gated as "Coming Soon" until
  // FamilySearch confirms our redirect URI registration. The original
  // handlers are preserved below (handleSearchSubmit, pullTree, etc.) so
  // we can flip the gate off in one place once approved.
  const FS_COMING_SOON = true;

  function notifyComingSoon() {
    toast("Coming soon", {
      description: "We'll email you when FamilySearch is live.",
    });
  }

  async function handleConnectFS() {
    if (FS_COMING_SOON) {
      notifyComingSoon();
      return;
    }
    try {
      setConnecting(true);
      await initiateFamilySearchOAuth();
    } catch (err) {
      setConnecting(false);
      toast.error("Couldn't reach FamilySearch", {
        description: (err as Error).message,
      });
    }
  }

  async function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    if (FS_COMING_SOON) {
      notifyComingSoon();
      return;
    }
    if (!firstName.trim()) {
      toast.error("First name is required");
      return;
    }
    setPhase("searching");
    setErrorMessage("");
    try {
      const { data, error } = await supabase.functions.invoke(
        "familysearch-search-records",
        {
          body: {
            surname,
            first_name: firstName.trim(),
            birth_year_approx: birthYear ? Number(birthYear) : undefined,
            birth_place: birthPlace.trim() || undefined,
            father_first_name: fatherFirst.trim() || undefined,
            mother_first_name: motherFirst.trim() || undefined,
            mother_maiden_name: motherMaiden.trim() || undefined,
          },
        },
      );

      // Edge function returned non-2xx — supabase-js surfaces as error
      if (error) {
        // Try to extract status code from FunctionsHttpError context
        const ctx = (error as unknown as { context?: Response }).context;
        if (ctx && ctx.status === 412) {
          setPhase("no-fs-session");
          return;
        }
        const msg = (data as { error?: string } | null)?.error ?? error.message;
        throw new Error(msg);
      }

      const resp = data as {
        success: boolean;
        matches?: Match[];
        error?: string;
      };
      if (!resp?.success) {
        if (resp?.error?.toLowerCase().includes("connect")) {
          setPhase("no-fs-session");
          return;
        }
        throw new Error(resp?.error ?? "Search failed");
      }

      setMatches(resp.matches ?? []);
      setPhase("matches");
    } catch (err) {
      const msg = (err as Error).message;
      setErrorMessage(msg);
      setPhase("error");
      toast.error("Search failed", { description: msg });
    }
  }

  async function handleMatchPick(personId: string) {
    setSelectedPersonId(personId);
    await pullTree(personId);
  }

  async function pullTree(personId: string | null) {
    setPhase("tree-loading");
    setErrorMessage("");
    try {
      const { data, error } = await supabase.functions.invoke(
        "familysearch-pull-tree",
        {
          body: { person_id: personId ?? undefined, generations: 4 },
        },
      );
      if (error) {
        const ctx = (error as unknown as { context?: Response }).context;
        if (ctx && ctx.status === 412) {
          setPhase("no-fs-session");
          return;
        }
        const msg = (data as { error?: string } | null)?.error ?? error.message;
        throw new Error(msg);
      }
      const resp = data as {
        success: boolean;
        root_id?: string;
        persons?: TreePerson[];
        error?: string;
      };
      if (!resp?.success || !resp.persons) {
        throw new Error(resp?.error ?? "Tree pull failed");
      }
      setTree({ root_id: resp.root_id ?? "", persons: resp.persons });
      setPhase("tree-ready");
    } catch (err) {
      const msg = (err as Error).message;
      setErrorMessage(msg);
      setPhase("error");
      toast.error("Couldn't load tree", { description: msg });
    }
  }

  function resetFlow() {
    setPhase("idle");
    setMatches([]);
    setSelectedPersonId(null);
    setTree(null);
    setErrorMessage("");
  }

  // Group tree persons by generation
  const treeByGeneration = tree
    ? tree.persons.reduce<Record<number, TreePerson[]>>((acc, p) => {
        const gen = p.generation ?? 1;
        (acc[gen] ||= []).push(p);
        return acc;
      }, {})
    : {};
  const generationKeys = Object.keys(treeByGeneration)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="relative flex min-h-[72vh] flex-col items-center justify-start px-6 pt-16 pb-32">
      <div className="mb-10 text-center">
        <SectionLabel>WHERE YOUR NAME TRAVELED</SectionLabel>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 font-display text-4xl tracking-tight text-cream-warm sm:text-5xl"
        >
          From hill to harbour.
        </motion.h1>
      </div>

      {/* === FAMILYSEARCH UPGRADE SECTION === */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="mb-14 w-full max-w-3xl"
      >
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <span
              className="inline-flex items-center rounded-pill border border-amber/50 bg-bg-warm px-4 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[2px] text-amber"
            >
              ✦ Coming Soon
            </span>
          </div>
          <h2 className="font-display text-2xl text-cream-warm sm:text-3xl">
            Want to see your real ancestors?
          </h2>
          <p className="mt-2 font-serif text-base italic text-amber-light">
            Pull your real bloodline from FamilySearch — for free.
          </p>
          <p className="mx-auto mt-4 max-w-xl font-sans text-sm leading-relaxed text-text-dim">
            We're partnering with FamilySearch to bring you real ancestor
            records. Awaiting their final confirmation — expected within a few
            weeks. For now, enjoy our AI-imagined heritage below.
          </p>
        </div>

        {/* Auth gate */}
        {!authLoading && !user && (
          <div className="rounded-[14px] border border-amber-dim/30 bg-card/40 p-6 text-center">
            <p className="font-sans text-sm text-text">
              Check your email for the magic link to continue. Once signed in,
              you can connect with FamilySearch.
            </p>
          </div>
        )}

        {/* Authenticated flows */}
        {user && (
          <AnimatePresence mode="wait">
            {phase === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="grid gap-4 md:grid-cols-2"
              >
                {/* Option A — OAuth */}
                <div className={cardBase}>
                  <h3 className="font-display text-lg text-cream-warm">
                    I have a FamilySearch account
                  </h3>
                  <p className="mt-2 font-sans text-sm text-text-dim">
                    Already have a tree built? Connect in one click and we'll
                    pull it for you.
                  </p>
                  <button
                    type="button"
                    onClick={handleConnectFS}
                    disabled={FS_COMING_SOON || connecting}
                    aria-disabled={FS_COMING_SOON || connecting}
                    title={FS_COMING_SOON ? "Coming soon" : undefined}
                    className="mt-5 inline-block rounded-pill px-8 py-3 font-sans text-[12px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #e8943a, #c47828)",
                    }}
                  >
                    {connecting ? "Redirecting…" : "Connect with FamilySearch"}
                  </button>
                </div>

                {/* Option B — Form */}
                <div className={cardBase}>
                  <h3 className="font-display text-lg text-cream-warm">
                    Don't have FamilySearch? Tell us about your ancestor
                  </h3>
                  <p className="mt-2 font-sans text-sm text-text-dim">
                    Provide a few details and we'll search billions of
                    historical records.
                  </p>
                  <form
                    onSubmit={handleSearchSubmit}
                    className="mt-4 flex flex-col gap-3"
                  >
                    <FsInput
                      value={firstName}
                      onChange={setFirstName}
                      placeholder="Ancestor's first name *"
                      required
                      disabled={FS_COMING_SOON}
                    />
                    <FsInput
                      value={birthYear}
                      onChange={setBirthYear}
                      placeholder="Approx birth year"
                      type="number"
                      disabled={FS_COMING_SOON}
                    />
                    <FsInput
                      value={birthPlace}
                      onChange={setBirthPlace}
                      placeholder="Birth city/region (e.g., Dorset, England)"
                      disabled={FS_COMING_SOON}
                    />
                    <FsInput
                      value={fatherFirst}
                      onChange={setFatherFirst}
                      placeholder="Father's first name (optional)"
                      disabled={FS_COMING_SOON}
                    />
                    <FsInput
                      value={motherFirst}
                      onChange={setMotherFirst}
                      placeholder="Mother's first name (optional)"
                      disabled={FS_COMING_SOON}
                    />
                    <FsInput
                      value={motherMaiden}
                      onChange={setMotherMaiden}
                      placeholder="Mother's maiden name (optional)"
                      disabled={FS_COMING_SOON}
                    />
                    <button
                      type="submit"
                      disabled={FS_COMING_SOON}
                      aria-disabled={FS_COMING_SOON}
                      title={FS_COMING_SOON ? "Coming soon" : undefined}
                      onClick={(e) => {
                        if (FS_COMING_SOON) {
                          e.preventDefault();
                          notifyComingSoon();
                        }
                      }}
                      className="mt-2 rounded-pill px-8 py-3 font-sans text-[12px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{
                        background: "linear-gradient(135deg, #e8943a, #c47828)",
                      }}
                    >
                      Search records
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {phase === "searching" && (
              <motion.div
                key="searching"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-10"
              >
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber/30 border-t-amber" />
                <p className="font-serif text-sm italic text-amber-dim">
                  Searching FamilySearch records…
                </p>
              </motion.div>
            )}

            {phase === "matches" && (
              <motion.div
                key="matches"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-3"
              >
                {matches.length === 0 ? (
                  <div className="rounded-[14px] border border-amber-dim/20 bg-card/60 p-6 text-center">
                    <p className="font-sans text-sm text-text">
                      No exact matches — try refining your search.
                    </p>
                    <button
                      type="button"
                      onClick={resetFlow}
                      className="mt-4 rounded-pill border border-amber-dim/30 bg-amber/[0.06] px-6 py-2 font-sans text-[12px] uppercase tracking-[1.5px] text-amber"
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="mb-2 text-center font-sans text-xs uppercase tracking-[2px] text-amber-dim">
                      {matches.length} possible match
                      {matches.length === 1 ? "" : "es"}
                    </p>
                    {matches.map((m, i) => (
                      <div key={m.id ?? i} className={cardBase}>
                        <h4 className="font-serif text-lg italic text-cream-warm">
                          {m.name ?? "Unknown name"}
                        </h4>
                        <p className="mt-1 font-sans text-xs text-text-dim">
                          {m.birth_date ? `Born ${m.birth_date}` : "Birth date unknown"}
                          {m.birth_place ? ` · ${m.birth_place}` : ""}
                        </p>
                        <button
                          type="button"
                          disabled={!m.id}
                          onClick={() => m.id && handleMatchPick(m.id)}
                          className="mt-3 rounded-pill border border-amber-dim/30 bg-amber/[0.06] px-5 py-2 font-sans text-[11px] uppercase tracking-[1.5px] text-amber transition-all hover:bg-amber/[0.12] disabled:opacity-40"
                        >
                          This is my ancestor →
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={resetFlow}
                      className="mt-2 self-center font-sans text-xs uppercase tracking-[1.5px] text-text-dim hover:text-amber"
                    >
                      Refine search
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {phase === "tree-loading" && (
              <motion.div
                key="tree-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-10"
              >
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber/30 border-t-amber" />
                <p className="font-serif text-sm italic text-amber-dim">
                  Pulling your bloodline from FamilySearch…
                </p>
              </motion.div>
            )}

            {phase === "tree-ready" && tree && (
              <motion.div
                key="tree-ready"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                <h3 className="text-center font-display text-xl text-cream-warm sm:text-2xl">
                  Your Bloodline — {generationKeys.length} Generations Back
                </h3>
                {generationKeys.map((gen) => (
                  <div key={gen}>
                    <p className="mb-2 text-center font-sans text-[10px] uppercase tracking-[3px] text-amber-dim">
                      Generation {gen}
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {treeByGeneration[gen].map((p) => (
                        <div
                          key={p.id}
                          className={`${cardBase} min-w-[180px] max-w-[220px] text-center`}
                        >
                          <p className="font-serif text-sm italic text-cream-warm">
                            {p.name ||
                              [p.given_name, p.surname].filter(Boolean).join(" ") ||
                              "Unknown"}
                          </p>
                          <p className="mt-1 font-sans text-[11px] text-text-dim">
                            {p.birth_date ?? "?"}
                            {p.death_date ? ` – ${p.death_date}` : ""}
                          </p>
                          {p.birth_place && (
                            <p className="mt-1 font-sans text-[11px] text-text-dim">
                              {p.birth_place}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    className="font-sans text-[11px] uppercase tracking-[1.5px] text-text-dim hover:text-amber"
                    onClick={() => toast("Disconnect coming soon")}
                  >
                    Disconnect FamilySearch
                  </button>
                </div>
              </motion.div>
            )}

            {phase === "no-fs-session" && (
              <motion.div
                key="no-fs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-[14px] border border-amber-dim/30 bg-card/60 p-6 text-center"
              >
                <p className="font-sans text-sm text-text">
                  Connect with FamilySearch first to pull your bloodline.
                </p>
                <button
                  type="button"
                  onClick={handleConnectFS}
                  disabled={connecting}
                  className="mt-4 rounded-pill px-8 py-3 font-sans text-[12px] font-semibold uppercase tracking-[1.5px] text-primary-foreground disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #e8943a, #c47828)",
                  }}
                >
                  {connecting ? "Redirecting…" : "Connect with FamilySearch"}
                </button>
              </motion.div>
            )}

            {phase === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-[14px] border border-[#c47828]/50 bg-card/60 p-6 text-center"
              >
                <p className="font-sans text-sm text-text">
                  {errorMessage || "Something went wrong."}
                </p>
                <button
                  type="button"
                  onClick={resetFlow}
                  className="mt-4 rounded-pill border border-amber-dim/30 bg-amber/[0.06] px-6 py-2 font-sans text-[12px] uppercase tracking-[1.5px] text-amber"
                >
                  Try again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.section>

      {/* === EXISTING AI PLACEHOLDER (default view) === */}
      {phase === "idle" && (
        <>
          {facts.status === "loading" && (
            <p className="font-serif text-sm italic text-amber-dim">
              Tracing the path of your name…
            </p>
          )}

          {facts.status === "error" && <RetryInline onRetry={facts.retry} />}

          {facts.status === "ready" && facts.data && (
            <>
              <MigrationPath waypoints={waypoints} />

              {closingLine && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: totalReveal }}
                  className="mt-10 max-w-xl text-center"
                >
                  <p className="font-serif text-base italic text-amber-light">
                    {closingLine}
                  </p>
                </motion.div>
              )}
            </>
          )}
        </>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: totalReveal + 0.3 }}
        className="mt-12"
      >
        <Link
          to={facts.status === "ready" ? "/journey/4" : "#"}
          onClick={facts.status !== "ready" ? (e) => e.preventDefault() : undefined}
          className="inline-block rounded-pill px-12 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, #e8943a, #c47828)",
            opacity: facts.status === "ready" ? 1 : 0.4,
            cursor: facts.status === "ready" ? "pointer" : "not-allowed",
          }}
        >
          Forge Your Crest
        </Link>
      </motion.div>
      <ScrollChevron />
    </div>
  );
};

// Small input wrapper using AncestorsQR design tokens
function FsInput({
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className="rounded-[10px] border border-amber-dim/20 bg-bg-input/80 px-4 py-2.5 font-sans text-sm text-cream-soft placeholder:text-text-dim focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber/40 disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}

export default Stop3Bloodline;
