import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const OCCASIONS: { label: string; slug: string; highlighted: boolean }[] = [
  { label: "Father's Day", slug: "fathers-day", highlighted: true },
  { label: "Christmas", slug: "christmas", highlighted: true },
  { label: "Wedding", slug: "wedding", highlighted: true },
  { label: "Graduation", slug: "graduation", highlighted: true },
  { label: "Birthday", slug: "birthday", highlighted: false },
  { label: "Anniversary", slug: "anniversary", highlighted: false },
  { label: "New Baby", slug: "new-baby", highlighted: false },
  { label: "Mother's Day", slug: "mothers-day", highlighted: false },
  { label: "Housewarming", slug: "housewarming", highlighted: false },
  { label: "Retirement", slug: "retirement", highlighted: false },
  { label: "Family Reunion", slug: "reunion", highlighted: false },
  { label: "Valentine's Day", slug: "valentines", highlighted: false },
];

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" } as const,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const OccasionsSection = () => (
  <motion.section {...reveal} className="py-16 text-center">
    <p className="mb-3 text-[10px] uppercase tracking-[4px] text-amber-dim">
      The Perfect Gift
    </p>
    <h2 className="font-display text-3xl text-cream-warm sm:text-4xl">
      The gift they'll never forget.
    </h2>
    <p className="mx-auto mt-4 max-w-md font-serif italic text-foreground">
      For the people who already have everything — give them something that can
      never be bought twice.
    </p>

    <div className="mt-12 flex flex-wrap justify-center gap-3">
      {OCCASIONS.map((occasion) => (
        <Link
          key={occasion.slug}
          to={`/gifts/${occasion.slug}`}
          className="rounded-pill font-sans text-[13px] transition-all duration-300"
          style={
            occasion.highlighted
              ? {
                  padding: "8px 20px",
                  border: "1px solid rgba(232,148,58,0.4)",
                  background: "rgba(232,148,58,0.06)",
                  color: "#e8b85c",
                  textDecoration: "none",
                }
              : {
                  padding: "8px 20px",
                  border: "1px solid rgba(61,48,32,1)",
                  background: "rgba(26,21,14,0.9)",
                  color: "#d0c4b4",
                  textDecoration: "none",
                }
          }
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor =
              "rgba(232,148,58,0.35)";
            (e.currentTarget as HTMLAnchorElement).style.color = "#e8b85c";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor =
              occasion.highlighted
                ? "rgba(232,148,58,0.4)"
                : "rgba(61,48,32,1)";
            (e.currentTarget as HTMLAnchorElement).style.color =
              occasion.highlighted ? "#e8b85c" : "#d0c4b4";
          }}
        >
          {occasion.label}
        </Link>
      ))}
    </div>
  </motion.section>
);

export default OccasionsSection;
