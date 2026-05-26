import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import josephOsmondPortrait from "@/assets/joseph-osmond-1827.jpeg";
import { usePageMeta } from "@/hooks/usePageMeta";

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
  usePageMeta({ title: "Our Story | AncestorsQR", description: "The Osmond family traced back to 1086 — fourteen generations, surfaced by AncestorsQR so your family doesn't have to wait decades." });
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
            Mine took 14 generations to find.
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
              Then I found the Domesday Book entry. 1086. Three lines of Latin, recorded
              by Norman surveyors sent by William the Conqueror twenty years after he
              took England.
            </Body>
            <Body>
              <em style={{ color: "#d8cdbf" }}>
                Osmund the Baker. Holding land in Galton, Woodstreet, and Milborne —
                three small landholdings in the County of Dorset.
              </em>
            </Body>
            <Body>
              That was my family. In the oldest public record in English history. Before
              Canada existed. Before Newfoundland was mapped. Before the word "surname"
              even meant what it means today.
            </Body>
          </div>
          <PullQuote>"Osmund the Baker. Dorset, England. 1086."</PullQuote>
        </motion.section>

        <OrnamentalDivider />

        {/* ── SECTION 2: The roots in Dorset ── */}
        <motion.section {...reveal}>
          <SectionLabel>Holnest · Hermitage · Long Burton</SectionLabel>
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
              The earliest confirmed ancestor I can name by date is Edmund Osmond, born
              around 1600, in the parish of Holnest, North Dorset. He married Edeth Maber
              on November 16, 1628 — a small entry in a church register that almost
              didn't survive.
            </Body>
            <Body>
              His son Giles Osmond (b. 1634) was christened at Holnest and became a
              carpenter and church warden in Hermitage. The wood he worked still holds up
              the roof of his parish church. He was buried October 25, 1719.
            </Body>
            <Body>
              His grandson Giles Osmond (b. 1667) married Mary Harbin in 1683 — a
              clandestine marriage, performed by an excommunicated minister, brought
              before the Bishop's court and recorded in his own hand.
            </Body>
            <Body>
              Three generations later, Ralph Osmond married Martha Clarke on August 18,
              1725, at Long Burton. Their fourth child — baptized April 28, 1728 — was
              named David.
            </Body>
            <Body>
              These weren't powerful people. They were carpenters, shepherds, church
              wardens, bakers. They worked the land. They raised children in stone
              parishes still standing today.
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
          <SectionLabel>Newfoundland · 1757</SectionLabel>
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
            <Body>
              In the spring of 1757, David Osmond — 29 years old — left everything he
              knew and crossed the Atlantic. He settled at Heart's Content, Newfoundland,
              a fishing village at the edge of the known world. Trinity Court records
              appointed him police constable that same year.
            </Body>
            <Body>
              He married Eleanor (surname Nicholson, by family tradition). His sons
              fished the same waters he did.
            </Body>
            <Body>
              A century later, Joseph Osmond (1802–1868) built a fishing operation from
              nothing at Moreton's Harbour. His sons Mark and Ambrose grew it into one of
              the largest shipping businesses in Newfoundland — trading across the West
              Indies and Caribbean for over 100 years.
            </Body>
            <Body>
              From a baker holding 30 acres in Dorset. To a merchant fleet crossing the
              Atlantic.
            </Body>
          </div>

          {/* Portrait — Joseph Osmond (1802–1868) */}
          <figure className="mx-auto mt-10" style={{ maxWidth: "380px" }}>
            <img
              src={josephOsmondPortrait}
              alt="Portrait of Joseph Osmond (1802–1868), Moreton's Harbour, Newfoundland"
              className="w-full"
              style={{
                borderRadius: "14px",
                border: "1px solid rgba(212,160,74,0.25)",
                filter: "sepia(40%) contrast(1.1) brightness(0.9)",
                display: "block",
              }}
            />
            <figcaption
              className="mt-4 text-center font-serif italic"
              style={{ color: "#8a7e6e", fontSize: "14px" }}
            >
              Joseph Osmond (1802–1868) — Moreton's Harbour, Newfoundland
            </figcaption>
          </figure>
        </motion.section>

        <OrnamentalDivider />

        {/* ── SECTION 4: The chain to me ── */}
        <motion.section {...reveal}>
          <SectionLabel>The Chain to Me</SectionLabel>
          <h2
            className="mt-6 text-center font-display"
            style={{
              color: "#e8ddd0",
              fontSize: "clamp(28px, 4vw, 38px)",
              lineHeight: 1.2,
            }}
          >
            The chain to me
          </h2>
          <div className="mt-10">
            <Body>
              Joseph's line continued through the smallest harbours of Notre Dame Bay:
            </Body>

            <ul
              className="my-10 font-serif"
              style={{
                color: "#d8cdbf",
                fontSize: "17px",
                lineHeight: 1.85,
                listStyle: "none",
                paddingLeft: 0,
                borderLeft: "1px solid #3d3020",
              }}
            >
              {[
                "James Osmond + Martha Canning (Martha, b. 1822 d. 1912, daughter of Andrew Canning of Barr'd Islands)",
                "Basil Osmond + Martha Ann Peyton",
                "James Henry Osmond (b. March 31, 1881) — drowned at Birchy Bay in 1912, age 31, leaving a wife and six children",
                "Arthur Samuel Osmond",
                "Edgar Osmond (my grandfather)",
                "Dean Osmond (my father, b. 1958)",
                "Gregory Angus Dean Osmond — born March 13, 1978, Toronto",
              ].map((line, i) => (
                <li
                  key={i}
                  style={{
                    paddingLeft: "20px",
                    paddingTop: "6px",
                    paddingBottom: "6px",
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: "6px",
                      top: "16px",
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#a07830",
                    }}
                  />
                  {line}
                </li>
              ))}
            </ul>

            <Body>
              Fourteen generations. From a baker in Dorset in 1086 to a child in Toronto
              in 1978. Every one of them carried the name forward.
            </Body>
          </div>
        </motion.section>

        <OrnamentalDivider />

        {/* ── SECTION 5: The crest ── */}
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
              Somewhere in the seventeenth century the family registered a coat of arms.
              The motto, in Latin:
            </Body>
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
              className="mt-4 font-serif italic"
              style={{
                color: "#d8cdbf",
                fontSize: "16px",
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
              From Labour, We Rise. That's not a quote invented for a logo. That's three
              centuries of Osmonds — carpenters, shepherds, fishermen, merchants —
              distilled into four words.
            </Body>
          </div>
        </motion.section>

        <OrnamentalDivider />

        {/* ── SECTION 6: How I found it ── */}
        <motion.section {...reveal}>
          <SectionLabel>How I Found It</SectionLabel>
          <h2
            className="mt-6 text-center font-display"
            style={{
              color: "#e8ddd0",
              fontSize: "clamp(28px, 4vw, 38px)",
              lineHeight: 1.2,
            }}
          >
            How I found it
          </h2>
          <div className="mt-10">
            <Body>
              I didn't do this alone. Two relatives spent decades chasing the same names
              through different archives:
            </Body>
            <Body>
              <strong style={{ color: "#e8b85c", fontWeight: 600 }}>
                Charles Sankey (Dorset side)
              </strong>{" "}
              — a relative-in-law who became the first Osmond descendant to return to
              Holnest in May 1990. He stood inside the same church where David Osmond was
              baptized in 1728. He walked Osmonds Farm. He wrote it all into a research
              book that I have now scanned cover-to-cover.
            </Body>
            <Body>
              <strong style={{ color: "#e8b85c", fontWeight: 600 }}>
                Kevin Osmond (Newfoundland side)
              </strong>{" "}
              — built a numbered descendant chart tracing every Osmond born in
              Newfoundland back to David. His book is how I traced my line to Edgar.
            </Body>
            <Body>
              Between them: 80+ historical documents. Wills from the 1700s. Church
              records from Piddletrenthide. Domesday entries from 1086. Letters to a
              sitting Marquess. Photographs of people who died before anyone alive today
              was born.
            </Body>
            <Body>
              I scanned 184 pages from those books in a single afternoon. AI helped me
              extract every name, every date, every place — but the work was done by
              people who cared, decades before I was born.
            </Body>
          </div>
        </motion.section>

        <OrnamentalDivider />

        {/* ── SECTION 7: What I built ── */}
        <motion.section {...reveal}>
          <SectionLabel>What I Built</SectionLabel>
          <h2
            className="mt-6 text-center font-display"
            style={{
              color: "#e8ddd0",
              fontSize: "clamp(28px, 4vw, 38px)",
              lineHeight: 1.2,
            }}
          >
            What I built
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
              Most people don't know where they come from. Not because the records don't
              exist. Because nobody ever took the time to find them.
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
              AncestorsQR exists so you don't have to spend forty years to get what I got.
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
              You enter your surname. We search WikiTree's free database of 32M+
              community-verified family records. When you connect with FamilySearch, we
              search 1.5 billion more. AI helps you make sense of what comes back —
              turning records into a story, names into a coat of arms, a tree into a
              hardcover book on your shelf.
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
              It's not magic. It's the work other people already did, surfaced for you in
              minutes.
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

        </motion.section>

        <div className="h-16" />
      </article>
    </div>
  );
}
