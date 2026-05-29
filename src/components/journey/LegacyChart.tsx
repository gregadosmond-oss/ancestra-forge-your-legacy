import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

export type TreePerson = {
  name: string;
  birthYear?: string | null;
  birthPlace?: string | null;
  deathYear?: string | null;
  deathPlace?: string | null;
  spouseName?: string | null;
  marriageYear?: string | null;
  isYou?: boolean;
};

type Props = {
  surname: string;
  // kept for backwards compatibility — no longer used.
  // Lineage is now sourced directly from family_tree_members.
  generations?: TreePerson[][];
  originPlace?: string | null;
  currentPlace?: string | null;
};

type AncestorNode = {
  id: string;
  name: string;
  relationshipLabel: string;
  generationsBack: number;
  birthYear?: string | null;
  birthPlace?: string | null;
  deathYear?: string | null;
};

function yearOf(s?: string | null): string | null {
  if (!s) return null;
  const m = String(s).match(/\d{4}/);
  return m ? m[0] : null;
}

function formatLifeLine(p: AncestorNode): string | null {
  const parts: string[] = [];
  if (p.birthYear || p.birthPlace) {
    parts.push(`b. ${[p.birthYear, p.birthPlace].filter(Boolean).join(" ")}`.trim());
  }
  if (p.deathYear) {
    parts.push(`d. ${p.deathYear}`);
  }
  return parts.length ? parts.join(" · ") : null;
}

const LegacyChart = ({ surname, originPlace, currentPlace }: Props) => {
  const [you, setYou] = useState<{ name: string }>({ name: "You" });
  const [ancestors, setAncestors] = useState<AncestorNode[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profile }, { data: members }] = await Promise.all([
        supabase
          .from("profiles")
          .select("first_name, surname")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("family_tree_members")
          .select("id, name, generations_back, relationship_label, birth_date, birth_place, death_date")
          .eq("user_id", user.id)
          .not("generations_back", "is", null),
      ]);
      if (cancelled) return;

      const first = profile?.first_name?.trim();
      const last = profile?.surname?.trim() || surname;
      const name = first || last ? `${first ?? ""} ${last ?? ""}`.trim() : "You";
      setYou({ name });

      const list: AncestorNode[] = (members ?? [])
        .filter((m: any) => typeof m.generations_back === "number")
        .map((m: any) => ({
          id: m.id,
          name: m.name,
          relationshipLabel: (m.relationship_label || "Ancestor").toString(),
          generationsBack: m.generations_back as number,
          birthYear: yearOf(m.birth_date),
          birthPlace: m.birth_place || null,
          deathYear: yearOf(m.death_date),
        }))
        // oldest first (largest generations_back at top)
        .sort((a, b) => b.generationsBack - a.generationsBack);

      setAncestors(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [surname]);

  const renderedCount = ancestors.length + 1; // + You
  const birthYears = ancestors
    .map((a) => (a.birthYear ? parseInt(a.birthYear, 10) : NaN))
    .filter((n) => !Number.isNaN(n));
  const deathYears = ancestors
    .map((a) => (a.deathYear ? parseInt(a.deathYear, 10) : NaN))
    .filter((n) => !Number.isNaN(n));
  const earliest = birthYears.length ? Math.min(...birthYears) : null;
  const latest = deathYears.length ? Math.max(...deathYears) : null;

  const placeLine = [originPlace, currentPlace].filter(Boolean).join(" → ");
  const metaBits: string[] = [];
  metaBits.push(`${renderedCount} generation${renderedCount === 1 ? "" : "s"}`);
  if (earliest && latest) metaBits.push(`${earliest}–${latest}`);
  else if (earliest) metaBits.push(`${earliest}`);

  type Node =
    | { kind: "ancestor"; data: AncestorNode }
    | { kind: "you"; name: string };

  const nodes: Node[] = [
    ...ancestors.map((a) => ({ kind: "ancestor" as const, data: a })),
    { kind: "you" as const, name: you.name },
  ];

  return (
    <section className="mx-auto w-full max-w-2xl">
      {/* Header */}
      <div className="text-center">
        <p className="font-sans text-[11px] uppercase tracking-[4px] text-amber-dim">
          Legacy Chart
        </p>
        <h2 className="mt-3 font-display text-3xl text-cream-warm sm:text-4xl">
          The {surname} Family
        </h2>
        {placeLine && (
          <p className="mt-2 font-serif italic text-amber-light">{placeLine}</p>
        )}
        <p className="mt-1 font-sans text-xs uppercase tracking-[2px] text-text-dim">
          {metaBits.join(" · ")}
        </p>
        <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-amber/50 to-transparent" />
      </div>

      {/* Chart — single descending column */}
      <div className="relative mt-10 flex flex-col items-center">
        {nodes.map((node, idx) => {
          const isLast = idx === nodes.length - 1;
          const isYou = node.kind === "you";
          const label = isYou
            ? "You"
            : (node as Extract<Node, { kind: "ancestor" }>).data.relationshipLabel.toUpperCase();
          const displayName = isYou
            ? node.name
            : (node as Extract<Node, { kind: "ancestor" }>).data.name;
          const life = isYou
            ? null
            : formatLifeLine((node as Extract<Node, { kind: "ancestor" }>).data);

          return (
            <div key={isYou ? "you" : (node as any).data.id} className="relative flex w-full flex-col items-center">
              <div
                className={`mb-3 rounded-pill border px-3 py-[3px] font-sans text-[10px] uppercase tracking-[3px] ${
                  isYou
                    ? "border-amber/50 bg-amber/[0.08] text-amber"
                    : "border-amber-dim/30 bg-card/40 text-amber"
                }`}
              >
                {label}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 + idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className={`relative w-full max-w-sm rounded-[14px] border px-5 py-4 text-center backdrop-blur-sm ${
                  isYou
                    ? "border-amber/60 bg-amber/[0.07] shadow-[0_0_40px_rgba(232,148,58,0.15)]"
                    : "border-amber-dim/25 bg-card/60"
                }`}
              >
                <h3
                  className={`font-display ${
                    isYou ? "text-2xl text-cream-warm" : "text-xl text-cream-soft"
                  }`}
                >
                  {displayName}
                </h3>
                {life && (
                  <p className="mt-1.5 font-sans text-xs leading-relaxed text-text-dim">
                    {life}
                  </p>
                )}
              </motion.div>

              {!isLast && (
                <div
                  aria-hidden
                  className="my-3 h-10 w-px bg-gradient-to-b from-amber-dim/40 via-amber-dim/30 to-amber-dim/40"
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default LegacyChart;
