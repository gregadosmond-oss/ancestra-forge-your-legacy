import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p
    className="text-center font-sans font-semibold uppercase"
    style={{
      fontSize: "10px",
      letterSpacing: "4px",
      color: "#a07830",
    }}
  >
    {children}
  </p>
);

const OrnamentalDivider = () => (
  <div className="flex items-center justify-center gap-4 py-12">
    <div
      className="h-px w-16 sm:w-24"
      style={{ background: "linear-gradient(to right, transparent, #a07830)" }}
    />
    <span style={{ color: "#a07830", fontSize: "14px" }}>✦</span>
    <div
      className="h-px w-16 sm:w-24"
      style={{ background: "linear-gradient(to left, transparent, #a07830)" }}
    />
  </div>
);

const Body = ({ children }: { children: React.ReactNode }) => (
  <p
    className="font-serif"
    style={{
      color: "#c4b8a6",
      fontSize: "17px",
      lineHeight: 1.95,
      marginBottom: "1.5rem",
    }}
  >
    {children}
  </p>
);

const PullQuote = ({ children }: { children: React.ReactNode }) => (
  <motion.blockquote
    {...reveal}
    className="my-12 font-display italic"
    style={{
      color: "#e8b85c",
      fontSize: "clamp(22px, 3.4vw, 30px)",
      lineHeight: 1.35,
      borderLeft: "3px solid #a07830",
      paddingLeft: "32px",
      paddingTop: "8px",
      paddingBottom: "8px",
    }}
  >
    {children}
  </motion.blockquote>
);

export default function About() {
  return (
    <div className="relative min-h-screen" style={{ background: "#0d0a07" }}>
      {/* Subtle warm ambient glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(232,148,58,0.04), transparent 60%)",
        }}
      />

      <article className="relative z-10 mx-auto px-6 sm:px-8" style={{ maxWidth: "720px" }}>
        {/* ── HERO ── */}
        <section className="flex min-h-[88vh] flex-col items-center justify-center py-20 text-center">
          <motion.div {...reveal}>
            <SectionLabel>The Founder's Story</SectionLabel>
          </motion.div>

          <motion.h1
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.15 }}
            className="mt-6 font-display"
            style={{
              color: "#f0e8da",
              fontSize: "clamp(36px, 6vw, 56px)",
              lineHeight: 1.15,
              letterSpacing: "-0.5px",
            }}
          >
            Every family has a story worth telling.
          </motion.h1>

          <motion.p
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.3 }}
            className="mt-6 font-serif italic"
            style={{ color: "#e8b85c", fontSize: "18px" }}
          >
            Mine took 960 years to find.
          </motion.p>
        </section>

        <OrnamentalDivider />

        {/* ── SECTION 1: It started with a name ── */}
        <motion.section {...reveal}>
          <SectionLabel>It Started With a Name</SectionLabel>
          <div className="mt-10">
            <Body>
              My surname is Osmond. I'd heard it my whole life — but I didn't know what
              it meant, where it came from, or what it had cost the people who carried it
              before me.
            </Body>
            <Body>
              Then I found the Domesday Book entry. 1066. Three lines of Latin, recorded
              by Norman surveyors sent by William the Conqueror.
            </Body>
            <Body>
              <em style={{ color: "#d8cdbf" }}>
                Osmond the Baker. Holding land in Gallion, Woodstock, and Melbourne.
                County of Dorset.
              </em>
            </Body>
            <Body>
              That was my family. In the oldest public record in English history. Before
              Canada existed. Before Newfoundland was mapped. Before the word "surname"
              even meant what it means today.
            </Body>
          </div>
          <PullQuote>"Osmond the Baker. Dorset, England. 1066."</PullQuote>
        </motion.section>

        <OrnamentalDivider />

        {/* ── SECTION 2: The roots in Dorset ── */}
        <motion.section {...reveal}>
          <SectionLabel>Holnest · Hermitage · Piddletrenthide</SectionLabel>
          <h2
            className="mt-6 text-center font-display"
            style={{
              color: "#e8ddd0",
              fontSize: "clamp(28px, 4vw, 38px)",
              lineHeight: 1.2,
            }}
          >
            The roots in Dorset
          </h2>
          <div className="mt-10">
            <Body>
              The earliest confirmed ancestor I can name is Edmund Osmond, born around
              1600, in the parish of Holnest, North Dorset. He married Elizabeth Mabry on
              the 10th of November, 1628 — a small entry in a church register that almost
              didn't survive.
            </Body>
            <Body>
              His son Giles became a carpenter and church warden in Hermitage. His
              grandson Giles married Mary Harbin in 1685 — a clandestine marriage,
              performed against the wishes of the landowner, and later brought before the
              local Vicar.
            </Body>
            <Body>
              In 1795, James Osmond of Glanville Wooton signed his Last Will and
              Testament. I have a copy of that document. His actual signature. Witnessed
              by Ann Wiltshire and James Wiltshire, on the 25th of May, 1795.
            </Body>
            <Body>
              These weren't powerful people. They were carpenters, shepherds, church
              wardens, bakers. They worked the land. They raised children in stone
              parishes that are still standing today.
            </Body>
          </div>
          <PullQuote>"They weren't born wealthy. They earned everything."</PullQuote>
        </motion.section>

        <OrnamentalDivider />

        {/* ── SECTION 3: The crossing (highlighted card) ── */}
        <motion.section
          {...reveal}
          className="my-8 rounded-[22px] px-6 py-12 sm:px-12"
          style={{
            background: "#1a1510",
            border: "1px solid rgba(212,160,74,0.25)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          }}
        >
          <SectionLabel>Newfoundland · 1753</SectionLabel>
          <h2
            className="mt-6 text-center font-display"
            style={{
              color: "#e8ddd0",
              fontSize: "clamp(28px, 4vw, 38px)",
              lineHeight: 1.2,
            }}
          >
            The crossing
          </h2>
          <div className="mt-10">
            <Body>Around 1753, one man changed everything.</Body>
            <Body>
              David Osmond, born in Dorset in 1728, left everything he knew and crossed
              the Atlantic. He settled at Hearts Content, Newfoundland — a fishing
              village at the edge of the known world.
            </Body>
            <Body>
              He died there in 1783, aged 57, buried at Forrest Road Anglican Churchyard
              in St James. He had six children.
            </Body>
            <Body>
              One of them was Joseph Osmond, born 1802 at Moreton's Harbour. Joseph built
              a fishing operation from nothing. His sons Mark and Ambrose grew it into
              one of the largest shipping businesses in Newfoundland — trading across
              the West Indies and Caribbean for over 100 years.
            </Body>
            <Body>
              From a baker holding 30 acres in Dorset. To a merchant fleet crossing the
              Atlantic.
            </Body>
          </div>

          {/* Portrait placeholder */}
          <div
            className="mx-auto mt-10 flex aspect-[3/4] max-w-[260px] items-center justify-center rounded-[14px] text-center"
            style={{
              background: "#0d0a07",
              border: "1px solid rgba(212,160,74,0.3)",
            }}
          >
            <p
              className="font-serif italic"
              style={{ color: "#a07830", fontSize: "13px", padding: "0 16px" }}
            >
              Portrait: Joseph Osmond, c.1827
            </p>
          </div>
        </motion.section>

        <OrnamentalDivider />

        {/* ── SECTION 4: The crest ── */}
        <motion.section {...reveal}>
          <SectionLabel>The Osmond Coat of Arms · Since 1688</SectionLabel>
          <h2
            className="mt-6 text-center font-display"
            style={{
              color: "#e8ddd0",
              fontSize: "clamp(28px, 4vw, 38px)",
              lineHeight: 1.2,
            }}
          >
            The crest
          </h2>
          <div className="mt-10">
            <Body>
              Somewhere along the way, the Osmond family registered a Coat of Arms.
            </Body>
            <Body>The date on the record is 1688. The motto is Latin:</Body>
          </div>

          <div className="my-12 text-center">
            <p
              className="font-display"
              style={{
                color: "#e8b85c",
                fontSize: "clamp(28px, 4.5vw, 36px)",
                letterSpacing: "0.5px",
              }}
            >
              Ex Labore, Ascendimus
            </p>
            <p
              className="mt-4 font-sans uppercase"
              style={{
                color: "#8a7e6e",
                fontSize: "11px",
                letterSpacing: "3px",
              }}
            >
              From Labour, We Rise
            </p>
          </div>

          <div className="mt-8">
            <Body>
              I didn't know that motto existed until I started digging. When I found it,
              I stopped.
            </Body>
            <Body>
              From Labour, We Rise. That's not a quote someone invented for a logo.
              That's 300 years of Osmonds — carpenters, shepherds, fishermen, merchants —
              distilled into four words.
            </Body>
          </div>
        </motion.section>

        <OrnamentalDivider />

        {/* ── SECTION 5: Why I built Ancestra ── */}
        <motion.section {...reveal}>
          <SectionLabel>The Reason</SectionLabel>
          <h2
            className="mt-6 text-center font-display"
            style={{
              color: "#e8ddd0",
              fontSize: "clamp(28px, 4vw, 38px)",
              lineHeight: 1.2,
            }}
          >
            Why I built Ancestra
          </h2>
          <div className="mt-10">
            <p
              className="font-serif"
              style={{
                color: "#d8cdbf",
                fontSize: "18px",
                lineHeight: 1.95,
                marginBottom: "1.5rem",
              }}
            >
              Most people don't know where they come from.
            </p>
            <p
              className="font-serif"
              style={{
                color: "#d8cdbf",
                fontSize: "18px",
                lineHeight: 1.95,
                marginBottom: "1.5rem",
              }}
            >
              Not because the records don't exist. Because nobody ever took the time to
              find them.
            </p>
            <p
              className="font-serif"
              style={{
                color: "#d8cdbf",
                fontSize: "18px",
                lineHeight: 1.95,
                marginBottom: "1.5rem",
              }}
            >
              I spent years tracing my family — through wills, church records, census
              documents, Domesday entries, letters to a sitting Marquess, photographs of
              people who died before anyone alive today was born.
            </p>
            <p
              className="font-serif"
              style={{
                color: "#d8cdbf",
                fontSize: "18px",
                lineHeight: 1.95,
                marginBottom: "1.5rem",
              }}
            >
              What I found changed how I see myself. It changed what I think is possible.
              When you know you come from people who crossed oceans and built things from
              nothing — that lives in you differently.
            </p>
            <p
              className="font-serif"
              style={{
                color: "#d8cdbf",
                fontSize: "18px",
                lineHeight: 1.95,
                marginBottom: "1.5rem",
              }}
            >
              Ancestra exists so you don't have to spend five years to get what I got.
            </p>
            <p
              className="font-serif"
              style={{
                color: "#d8cdbf",
                fontSize: "18px",
                lineHeight: 1.95,
                marginBottom: "1.5rem",
              }}
            >
              You enter your surname. In five minutes, you have a crest, a story, and a
              lineage — rooted in real history, built for your family.
            </p>
            <p
              className="font-serif italic"
              style={{
                color: "#e8b85c",
                fontSize: "20px",
                lineHeight: 1.6,
                marginTop: "2rem",
                textAlign: "center",
              }}
            >
              Every family has a story worth telling. Yours is waiting.
            </p>
          </div>
        </motion.section>

        <OrnamentalDivider />

        {/* ── CTA ── */}
        <motion.section
          {...reveal}
          className="relative my-12 rounded-[22px] px-6 py-16 text-center sm:px-12"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(232,148,58,0.08), rgba(26,21,16,0.6) 70%)",
            border: "1px solid rgba(232,148,58,0.18)",
          }}
        >
          <h2
            className="font-display"
            style={{
              color: "#f0e8da",
              fontSize: "clamp(30px, 5vw, 40px)",
              lineHeight: 1.2,
            }}
          >
            Discover yours.
          </h2>
          <p
            className="mt-4 font-serif italic"
            style={{ color: "#e8b85c", fontSize: "18px" }}
          >
            It takes five minutes. It lasts a lifetime.
          </p>

          <Link
            to="/journey/1"
            className="mt-10 inline-block font-sans font-semibold uppercase transition-all duration-[400ms] hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #e8943a, #c47828)",
              color: "#1a1208",
              fontSize: "13px",
              letterSpacing: "1.5px",
              padding: "16px 40px",
              borderRadius: "60px",
              boxShadow: "0 8px 30px rgba(232,148,58,0.18)",
            }}
          >
            Begin Your Journey
          </Link>

          <p
            className="mt-6 font-sans uppercase"
            style={{
              color: "#8a7e6e",
              fontSize: "11px",
              letterSpacing: "3px",
            }}
          >
            Free to start · No account required
          </p>
        </motion.section>

        <div className="h-16" />
      </article>
    </div>
  );
}
