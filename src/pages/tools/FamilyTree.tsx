import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMarkToolComplete } from "@/hooks/useMarkToolComplete";
import { usePageMeta } from "@/hooks/usePageMeta";
import BloodlineTree from "@/components/journey/BloodlineTree";

type WikitreeResult = {
  id: string;
  source: "wikitree";
  name: string;
  birthDate: string | null;
  birthPlace: string | null;
  deathDate: string | null;
  deathPlace: string | null;
  fatherName: string | null;
  motherName: string | null;
  profileUrl: string | null;
};

type ClaudeResult = {
  id: string;
  source: "claude-web";
  name: string;
  birthDate: string | null;
  birthPlace: string | null;
  deathDate: string | null;
  deathPlace: string | null;
  fatherName: string | null;
  motherName: string | null;
  summary: string | null;
  profileUrl: string | null;
  confidence: "high" | "medium" | "low";
};

type AnyResult =
  | (WikitreeResult & { confidence?: undefined; summary?: undefined })
  | ClaudeResult;

type SearchPhase = "idle" | "wikitree-loading" | "claude-loading" | "done";

const FamilyTree = () => {
  usePageMeta({
    title: "Create Your Family Tree — AncestorsQR",
    description:
      "Build your visual bloodline tree. See your ancestors across generations, names, dates, and places.",
  });

  const { user } = useAuth();

  // Form state
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [fatherFirst, setFatherFirst] = useState("");
  const [motherFirst, setMotherFirst] = useState("");
  const [motherMaiden, setMotherMaiden] = useState("");

  const [profileLoaded, setProfileLoaded] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPhase, setSearchPhase] = useState<SearchPhase>("idle");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [wikitreeResults, setWikitreeResults] = useState<WikitreeResult[] | null>(null);
  const [claudeResults, setClaudeResults] = useState<ClaudeResult[] | null>(null);
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());
  const resultsRef = useRef<HTMLDivElement | null>(null);

  // Prefill from profile
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name, surname, country_of_origin, birth_year")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setFirstName((prev) => prev || data.first_name || "");
        setSurname((prev) => prev || data.surname || "");
        setBirthPlace((prev) => prev || data.country_of_origin || "");
        setBirthYear((prev) =>
          prev || (data.birth_year ? String(data.birth_year) : ""),
        );
      }
      setProfileLoaded(true);
    })();
  }, [user]);

  const allResults: AnyResult[] = useMemo(
    () => [...(wikitreeResults ?? []), ...(claudeResults ?? [])],
    [wikitreeResults, claudeResults],
  );

  const pickedResults = allResults.filter((r) => pickedIds.has(r.id));

  // Mark complete once at least one ancestor has been added to the tree
  useMarkToolComplete("tree", pickedResults.length > 0);

  // Auto-pick the first wikitree result on initial reveal (lower friction);
  // user can deselect or add others
  useEffect(() => {
    if (searchPhase === "done" && pickedIds.size === 0 && allResults.length > 0) {
      setPickedIds(new Set([allResults[0].id]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchPhase]);

  useEffect(() => {
    if (searchPhase === "done" || searchPhase === "claude-loading") {
      const t = setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [searchPhase]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) {
      toast.error("First name is required");
      return;
    }
    if (!surname.trim()) {
      toast.error("Surname is required");
      return;
    }
    const body = {
      surname: surname.trim(),
      givenName: firstName.trim(),
      birthYear: birthYear || undefined,
      birthPlace: birthPlace.trim() || undefined,
      fatherName: fatherFirst.trim() || undefined,
      motherName: motherFirst.trim() || undefined,
      motherMaidenName: motherMaiden.trim() || undefined,
    };

    setIsSearching(true);
    setSearchError(null);
    setWikitreeResults(null);
    setClaudeResults(null);
    setPickedIds(new Set());
    setSearchPhase("wikitree-loading");

    try {
      const wikitreeResponse = await supabase.functions.invoke("wikitree-search", { body });
      const { data, error } = wikitreeResponse;
      if (error) {
        const msg = (data as { error?: string } | null)?.error ?? error.message;
        throw new Error(msg);
      }
      const resp = data as { success: boolean; results?: WikitreeResult[]; error?: string };
      if (!resp?.success) throw new Error(resp?.error ?? "Search failed");

      const wt = resp.results ?? [];
      setWikitreeResults(wt);

      if (wt.length === 0) {
        setSearchPhase("claude-loading");
        try {
          const claudeResponse = await supabase.functions.invoke("claude-ancestor-search", { body });
          const { data: cData, error: cError } = claudeResponse;
          if (cError) {
            setClaudeResults([]);
          } else {
            const cResp = cData as { success: boolean; results?: ClaudeResult[]; error?: string };
            setClaudeResults(cResp?.success ? cResp.results ?? [] : []);
          }
        } catch {
          setClaudeResults([]);
        }
      }
      setSearchPhase("done");
    } catch (err) {
      const msg = (err as Error).message;
      setSearchError(msg);
      setSearchPhase("done");
      toast.error("Search failed", { description: msg });
    } finally {
      setIsSearching(false);
    }
  }

  function togglePick(id: string) {
    setPickedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Build tree generations: you + picked ancestors (oldest to youngest visually)
  const treeGenerations = useMemo(() => {
    const ancestors = pickedResults
      .map((r) => ({
        name: r.name,
        years: r.birthDate
          ? `${r.birthDate}${r.deathDate ? ` – ${r.deathDate}` : ""}`
          : "Year unknown",
        location: r.birthPlace ?? r.deathPlace ?? "Place unknown",
        role: "source" in r && r.source === "claude-web" ? "AI-assisted" : "WikiTree",
      }))
      .sort((a, b) => {
        const ay = parseInt(a.years.slice(0, 4), 10) || 9999;
        const by = parseInt(b.years.slice(0, 4), 10) || 9999;
        return ay - by;
      });
    const you = {
      name: `${firstName || "You"} ${surname}`.trim() || "You",
      years: birthYear || "today",
      location: birthPlace || "—",
      isYou: true,
    };
    return [...ancestors, you];
  }, [pickedResults, firstName, surname, birthYear, birthPlace]);

  return (
    <div className="min-h-screen bg-background px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="font-sans text-[11px] uppercase tracking-[3px] text-amber-dim">
            Your Bloodline Tree
          </p>
          <h1 className="mt-3 font-display text-4xl tracking-tight text-cream-warm sm:text-5xl">
            Create your family tree
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-serif italic text-amber-light">
            Tell us about yourself or an ancestor and we'll search WikiTree's
            32M+ verified records and AI-assisted historical archives.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-10 grid max-w-xl gap-3 rounded-[14px] border border-amber-dim/20 bg-card/50 p-6 backdrop-blur-sm"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <FsInput value={firstName} onChange={setFirstName} placeholder="First name *" required />
            <FsInput value={surname} onChange={setSurname} placeholder="Surname *" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FsInput value={birthYear} onChange={setBirthYear} placeholder="Approx birth year" type="number" />
            <FsInput value={birthPlace} onChange={setBirthPlace} placeholder="Birth city or country" />
          </div>
          <FsInput value={fatherFirst} onChange={setFatherFirst} placeholder="Father's first name (optional)" />
          <FsInput value={motherFirst} onChange={setMotherFirst} placeholder="Mother's first name (optional)" />
          <FsInput value={motherMaiden} onChange={setMotherMaiden} placeholder="Mother's maiden name (optional)" />

          {searchError && (
            <p className="rounded-[8px] border border-amber-dim/30 bg-card/40 px-3 py-2 font-sans text-sm text-cream-soft">
              {searchError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSearching || !profileLoaded}
            className="mt-2 rounded-pill px-8 py-3 font-sans text-[12px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #e8943a, #c47828)" }}
          >
            {isSearching ? "Searching…" : "Search records"}
          </button>
        </form>

        {searchPhase === "claude-loading" && (
          <div className="mx-auto mt-6 max-w-xl rounded-[10px] border border-amber-dim/30 bg-card/40 px-4 py-5 text-center animate-pulse">
            <p className="font-serif text-sm italic text-amber-light">Searching deeper with AI…</p>
            <p className="mt-1 font-sans text-[11px] uppercase tracking-[1.5px] text-text-dim">
              Scanning historical records · usually 5–10 seconds
            </p>
          </div>
        )}

        {searchPhase === "done" && wikitreeResults !== null && (
          <div ref={resultsRef} className="mx-auto mt-10 max-w-xl">
            <p className="text-center font-sans text-[11px] uppercase tracking-[2px] text-amber-dim">
              Tap matches to add to your tree
            </p>
            {allResults.length === 0 ? (
              <p className="mt-4 rounded-[10px] border border-amber-dim/30 bg-card/40 px-4 py-4 text-center font-sans text-sm text-cream-soft">
                No matches found. Try fewer details or a different spelling.
              </p>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {allResults.map((r) => {
                  const picked = pickedIds.has(r.id);
                  const isClaude = "confidence" in r && !!r.confidence;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => togglePick(r.id)}
                      className={`relative rounded-[14px] border p-4 text-left transition-all ${
                        picked
                          ? "border-amber/60 bg-amber/[0.08]"
                          : "border-amber-dim/20 bg-card/60 hover:border-amber/40"
                      }`}
                    >
                      <span
                        className={`absolute right-3 top-3 rounded-pill border px-2 py-[3px] font-sans text-[10px] uppercase tracking-[1px] ${
                          isClaude
                            ? "border-amber-dim/40 bg-amber-dim/[0.10] text-amber-light"
                            : "border-amber/40 bg-amber/[0.10] text-amber"
                        }`}
                      >
                        {isClaude ? "AI-assisted" : "WikiTree"}
                      </span>
                      <div className="pr-28 font-display text-base text-cream-warm">{r.name}</div>
                      {(r.birthDate || r.birthPlace) && (
                        <div className="mt-1 font-sans text-xs text-text-dim">
                          Born {r.birthDate ?? "—"}
                          {r.birthPlace ? ` · ${r.birthPlace}` : ""}
                        </div>
                      )}
                      {(r.deathDate || r.deathPlace) && (
                        <div className="font-sans text-xs text-text-dim">
                          Died {r.deathDate ?? "—"}
                          {r.deathPlace ? ` · ${r.deathPlace}` : ""}
                        </div>
                      )}
                      {"summary" in r && r.summary && (
                        <p className="mt-2 font-serif text-sm italic text-cream-soft">{r.summary}</p>
                      )}
                      <span className="mt-3 inline-block font-sans text-[11px] uppercase tracking-[1.5px] text-amber">
                        {picked ? "✓ Added to tree" : "Add to tree →"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {pickedResults.length > 0 && (
          <div className="mt-16">
            <p className="text-center font-sans text-[11px] uppercase tracking-[3px] text-amber-dim">
              Your bloodline
            </p>
            <h2 className="mt-3 text-center font-display text-2xl text-cream-warm sm:text-3xl">
              {pickedResults.length} generation{pickedResults.length === 1 ? "" : "s"} back
            </h2>
            <div className="mt-8">
              <BloodlineTree generations={treeGenerations} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function FsInput({
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="rounded-[10px] border border-amber-dim/20 bg-bg-input/80 px-4 py-2.5 font-sans text-sm text-cream-soft placeholder:text-text-dim focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber/40"
    />
  );
}

export default FamilyTree;
