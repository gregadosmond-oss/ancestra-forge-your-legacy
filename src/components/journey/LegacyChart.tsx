import { motion } from "framer-motion";

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
  generations: TreePerson[][]; // outer = generations oldest→youngest; inner = people in that gen
  originPlace?: string | null;
  currentPlace?: string | null;
};

function formatLifeLine(p: TreePerson): string | null {
  const parts: string[] = [];
  if (p.birthYear || p.birthPlace) {
    parts.push(
      `b. ${[p.birthYear, p.birthPlace].filter(Boolean).join(" ")}`.trim(),
    );
  }
  if (p.deathYear || p.deathPlace) {
    parts.push(
      `d. ${[p.deathYear, p.deathPlace].filter(Boolean).join(" ")}`.trim(),
    );
  }
  return parts.length ? parts.join(" · ") : null;
}

const LegacyChart = ({ surname, generations, originPlace, currentPlace }: Props) => {
  const allPeople = generations.flat();
  const years = allPeople
    .flatMap((p) => [p.birthYear, p.deathYear])
    .map((y) => (y ? parseInt(String(y).slice(0, 4), 10) : NaN))
    .filter((n) => !Number.isNaN(n));
  const earliest = years.length ? Math.min(...years) : null;
  const latest = years.length ? Math.max(...years) : null;

  const placeLine = [originPlace, currentPlace].filter(Boolean).join(" → ");
  const metaBits: string[] = [];
  metaBits.push(`${generations.length} generation${generations.length === 1 ? "" : "s"}`);
  if (earliest && latest) metaBits.push(`${earliest}–${latest}`);

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

      {/* Chart */}
      <div className="relative mt-10 flex flex-col items-center">
        {generations.map((gen, gi) => {
          const isLast = gi === generations.length - 1;
          return (
            <div key={gi} className="relative flex w-full flex-col items-center">
              {/* Gen label */}
              <div className="mb-3 rounded-pill border border-amber-dim/30 bg-card/40 px-3 py-[3px] font-sans text-[10px] uppercase tracking-[3px] text-amber">
                Gen {gi + 1}
              </div>

              {/* Person cards row (with branching when >1) */}
              <div className="relative flex w-full flex-wrap items-stretch justify-center gap-4">
                {/* Branch connectors for multi-person rows */}
                {gen.length > 1 && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute left-[12%] right-[12%] top-0 h-px -translate-y-3 bg-amber-dim/30"
                  />
                )}
                {gen.map((p, pi) => {
                  const life = formatLifeLine(p);
                  return (
                    <motion.div
                      key={`${gi}-${pi}-${p.name}`}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.6,
                        delay: 0.1 + gi * 0.12 + pi * 0.05,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className={`relative w-full max-w-sm rounded-[14px] border px-5 py-4 text-center backdrop-blur-sm ${
                        p.isYou
                          ? "border-amber/60 bg-amber/[0.07] shadow-[0_0_40px_rgba(232,148,58,0.15)]"
                          : "border-amber-dim/25 bg-card/60"
                      }`}
                    >
                      {p.isYou && (
                        <p className="mb-1 font-sans text-[10px] uppercase tracking-[4px] text-amber">
                          You
                        </p>
                      )}
                      <h3
                        className={`font-display ${
                          p.isYou
                            ? "text-2xl text-cream-warm"
                            : "text-xl text-cream-soft"
                        }`}
                      >
                        {p.name}
                      </h3>
                      {life && (
                        <p className="mt-1.5 font-sans text-xs leading-relaxed text-text-dim">
                          {life}
                        </p>
                      )}
                      {p.spouseName && (
                        <p className="mt-1 font-serif text-sm italic text-amber-dim">
                          m. {p.spouseName}
                          {p.marriageYear ? ` · ${p.marriageYear}` : ""}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Vertical connector to next gen */}
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
