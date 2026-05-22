import { useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const COLORS = {
  bg: "#0d0a07",
  card: "#1a1510",
  amber: "#d4a04a",
  amberLight: "#e8b85c",
  amberDim: "#a07830",
  honey: "#e8943a",
  honeyDim: "#c47828",
  cream: "#f0e8da",
  text: "#d0c4b4",
  textBody: "#c4b8a6",
  textDim: "#8a7e6e",
  line: "#3d3020",
  ink: "#1a1208",
};

const fontDisplay = "'Libre Caslon Display', serif";
const fontSerif = "'Libre Caslon Text', serif";
const fontSans = "'DM Sans', sans-serif";

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p
    style={{
      fontFamily: fontSans,
      fontSize: 11,
      letterSpacing: 4,
      textTransform: "uppercase",
      color: COLORS.amberDim,
      margin: 0,
      marginBottom: 14,
    }}
  >
    {children}
  </p>
);

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2
    style={{
      fontFamily: fontDisplay,
      fontSize: 28,
      color: COLORS.cream,
      margin: 0,
      marginBottom: 20,
      lineHeight: 1.2,
    }}
  >
    {children}
  </h2>
);

const Body = ({ children }: { children: React.ReactNode }) => (
  <p
    style={{
      fontFamily: fontSans,
      fontSize: 16,
      lineHeight: 1.7,
      color: COLORS.text,
      margin: 0,
      marginBottom: 16,
    }}
  >
    {children}
  </p>
);

const Divider = () => (
  <div
    style={{
      height: 1,
      background: `linear-gradient(to right, transparent, ${COLORS.line}, transparent)`,
      margin: "56px 0",
    }}
  />
);

const Section = ({ children }: { children: React.ReactNode }) => (
  <section style={{ marginBottom: 8 }}>{children}</section>
);

const BtnWarm = ({
  children,
  href,
  as = "button",
}: {
  children: React.ReactNode;
  href?: string;
  as?: "button" | "a";
}) => {
  const style: React.CSSProperties = {
    display: "inline-block",
    background: `linear-gradient(135deg, ${COLORS.honey}, ${COLORS.honeyDim})`,
    color: COLORS.ink,
    fontFamily: fontSans,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    padding: "16px 32px",
    borderRadius: 60,
    border: "none",
    cursor: "pointer",
    textDecoration: "none",
  };
  return as === "a" && href ? (
    <a href={href} style={style}>
      {children}
    </a>
  ) : (
    <button style={style}>{children}</button>
  );
};

const BtnSoft = ({ children }: { children: React.ReactNode }) => (
  <button
    style={{
      background: "rgba(232,148,58,0.06)",
      border: `1px solid rgba(232,148,58,0.18)`,
      color: COLORS.amber,
      fontFamily: fontSans,
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      padding: "15px 32px",
      borderRadius: 60,
      cursor: "pointer",
    }}
  >
    {children}
  </button>
);

const TreeNode = ({
  label,
  withLink = false,
  dim = false,
}: {
  label: string;
  withLink?: boolean;
  dim?: boolean;
}) => (
  <div
    style={{
      background: "rgba(232,148,58,0.04)",
      border: `1px solid ${dim ? "rgba(160,120,48,0.3)" : "rgba(212,160,74,0.4)"}`,
      borderRadius: 14,
      padding: "10px 14px",
      fontFamily: fontSans,
      fontSize: 12,
      color: dim ? COLORS.textDim : COLORS.text,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      textAlign: "center",
      lineHeight: 1.4,
      minHeight: 48,
    }}
  >
    <span>{label}</span>
    {withLink && <ExternalLink size={12} color={COLORS.amber} />}
  </div>
);

const TreeRow = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: "grid",
      gap: 10,
      marginBottom: 10,
    }}
  >
    {children}
  </div>
);

const FamilySearchDemo = () => {
  usePageMeta({
    title: "AncestorsQR × FamilySearch — Integration Preview",
    description: "Partner preview of the AncestorsQR × FamilySearch integration.",
  });

  useEffect(() => {
    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const created = !robots;
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    const prev = robots.getAttribute("content");
    robots.setAttribute("content", "noindex, nofollow");
    return () => {
      if (created) robots?.remove();
      else if (prev) robots?.setAttribute("content", prev);
    };
  }, []);

  const steps = [
    {
      title: "User clicks Connect",
      desc: "Server-side edge function familysearch-build-auth-url constructs the OAuth URL with our beta AppKey. AppKey never exposed to the browser.",
    },
    {
      title: "Redirect to FamilySearch",
      desc: "User is sent to identbeta.familysearch.org/cis-web/oauth2/v3/authorization. They sign in with FamilySearch credentials. We never touch their password.",
    },
    {
      title: "FamilySearch redirects back",
      desc: "Once authenticated, FamilySearch sends user to https://ancestorsqr.com/auth/familysearch/callback?code=...",
    },
    {
      title: "Server-side token exchange",
      desc: "auth-familysearch-callback edge function exchanges code for access token. Token stored in familysearch_sessions table, row-level-secured per user.",
    },
    {
      title: "User returns to Stop 3",
      desc: "Authenticated. Real tree replaces placeholder. Token reused on subsequent visits.",
    },
  ];

  const edgeFns = [
    "familysearch-build-auth-url",
    "auth-familysearch-callback",
    "familysearch-pull-tree",
    "familysearch-search-records",
    "familysearch-contribute-memory (scaffolded, awaiting compliance approval)",
  ];

  const endpoints = [
    "OAuth 2.0 Authorization Code grant",
    "Persons (read)",
    "Relationships / tree (read)",
    "Places (read, for migration mapping)",
    "Memories + Sources (write, opt-in only)",
  ];

  const MockCard = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 22,
        padding: 40,
      }}
    >
      {children}
    </div>
  );

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh" }}>
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "64px 24px",
        }}
      >
        {/* SECTION 1 — Header */}
        <Section>
          <Eyebrow>PARTNER PREVIEW · NOT PUBLIC</Eyebrow>
          <h1
            style={{
              fontFamily: fontDisplay,
              fontSize: 44,
              color: COLORS.cream,
              margin: 0,
              marginBottom: 16,
              lineHeight: 1.15,
            }}
          >
            AncestorsQR × FamilySearch
          </h1>
          <p
            style={{
              fontFamily: fontSerif,
              fontStyle: "italic",
              fontSize: 18,
              color: COLORS.textBody,
              margin: 0,
            }}
          >
            How the integration works, from a user's first click to the memories give-back.
          </p>
        </Section>

        <Divider />

        {/* SECTION 2 — Context */}
        <Section>
          <Eyebrow>THE USER FUNNEL</Eyebrow>
          <H2>Where FamilySearch fits.</H2>
          <Body>
            AncestorsQR is a digital legacy product. Users enter a surname and receive an
            AI-generated coat of arms, a family story (9 chapters digital, 12 chapters in the hardcover Legacy Book edition), and a visual bloodline tree.
            It's an emotional discovery experience, not a genealogy database.
          </Body>
          <Body>
            The FamilySearch integration surfaces at Stop 3 of our 6-stop journey — the bloodline
            view. By default, this stop shows an AI-imagined family tree. For users who connect
            their FamilySearch account, we replace the AI tree with their actual records.
          </Body>
          <Body>
            We never duplicate FamilySearch data. We surface what users already have, attribute
            back to FamilySearch profiles, and create a return path that drives new FamilySearch
            signups from our funnel.
          </Body>
        </Section>

        <Divider />

        {/* SECTION 3 — Pre-Auth */}
        <Section>
          <Eyebrow>STEP 1 — BEFORE CONNECTING</Eyebrow>
          <H2>What users see at Stop 3 by default.</H2>
          <MockCard>
            <h3
              style={{
                fontFamily: fontDisplay,
                fontSize: 22,
                color: COLORS.amberLight,
                margin: 0,
                marginBottom: 6,
              }}
            >
              Your Bloodline
            </h3>
            <p
              style={{
                fontFamily: fontSerif,
                fontStyle: "italic",
                fontSize: 14,
                color: COLORS.textBody,
                margin: 0,
                marginBottom: 28,
              }}
            >
              An imagined glimpse — connect FamilySearch for the real one.
            </p>

            <TreeRow>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                <TreeNode label="Ancestor I · b. ~1820" dim />
                <TreeNode label="Ancestor II · b. ~1820" dim />
                <TreeNode label="Ancestor III · b. ~1820" dim />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, padding: "0 12%" }}>
                <TreeNode label="Parent I · b. ~1955" dim />
                <TreeNode label="Parent II · b. ~1958" dim />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, padding: "0 35%" }}>
                <TreeNode label="You" />
              </div>
            </TreeRow>

            <div style={{ marginTop: 32, marginBottom: 16 }}>
              <BtnWarm>Connect to FamilySearch for your real bloodline</BtnWarm>
            </div>
            <p
              style={{
                fontFamily: fontSans,
                fontStyle: "italic",
                fontSize: 12,
                color: COLORS.textDim,
                margin: 0,
              }}
            >
              We only access records you authorize. No scraping. AppKey stays server-side throughout.
            </p>
          </MockCard>
        </Section>

        <Divider />

        {/* SECTION 4 — OAuth */}
        <Section>
          <Eyebrow>STEP 2 — OAUTH HANDOFF</Eyebrow>
          <H2>How authentication flows.</H2>
          <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {steps.map((s, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: 20,
                  marginBottom: 24,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: COLORS.card,
                    border: `1px solid ${COLORS.amber}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: fontDisplay,
                    fontSize: 16,
                    color: COLORS.amber,
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: fontDisplay,
                      fontSize: 18,
                      color: COLORS.cream,
                      margin: 0,
                      marginBottom: 6,
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: fontSans,
                      fontSize: 14,
                      color: COLORS.textBody,
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {s.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Divider />

        {/* SECTION 5 — Post-Auth */}
        <Section>
          <Eyebrow>STEP 3 — AFTER CONNECTING</Eyebrow>
          <H2>What users see with FamilySearch linked.</H2>
          <MockCard>
            <h3
              style={{
                fontFamily: fontDisplay,
                fontSize: 22,
                color: COLORS.amberLight,
                margin: 0,
                marginBottom: 6,
              }}
            >
              Your Bloodline
            </h3>
            <p
              style={{
                fontFamily: fontSerif,
                fontStyle: "italic",
                fontSize: 14,
                color: COLORS.textBody,
                margin: 0,
                marginBottom: 28,
              }}
            >
              From your FamilySearch records.
            </p>

            <TreeRow>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                <TreeNode label="Joseph Osmond · b. 1888 · NL" withLink />
                <TreeNode label="Anne Pike · b. 1890 · NL" withLink />
                <TreeNode label="William Bennett · b. 1892 · NL" withLink />
                <TreeNode label="Sarah Hayward · b. 1894 · NL" withLink />
                <TreeNode label="Thomas Marshall · b. 1885 · ON" withLink />
                <TreeNode label="Elizabeth Carr · b. 1888 · ON" withLink />
                <TreeNode label="Patrick Doyle · b. 1889 · ON" withLink />
                <TreeNode label="Margaret Lynch · b. 1891 · ON" withLink />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                <TreeNode label="Mark Osmond · b. 1920 · Newfoundland" withLink />
                <TreeNode label="Eliza Bennett · b. 1924 · Newfoundland" withLink />
                <TreeNode label="James Marshall · b. 1918 · Ontario" withLink />
                <TreeNode label="Catherine Doyle · b. 1922 · Ontario" withLink />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, padding: "0 12%" }}>
                <TreeNode label="Dean Osmond · b. 1954 · Newfoundland" withLink />
                <TreeNode label="Mary Marshall · b. 1956 · Ontario" withLink />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, padding: "0 25%" }}>
                <TreeNode label="Gregory Angus Dean Osmond · b. 1986 · Toronto, Canada" />
              </div>
            </TreeRow>

            <div
              style={{
                marginTop: 32,
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <BtnSoft>Disconnect FamilySearch</BtnSoft>
              <BtnWarm>Pull deeper tree (8 generations) — Legacy Pack</BtnWarm>
            </div>
            <p
              style={{
                fontFamily: fontSans,
                fontStyle: "italic",
                fontSize: 12,
                color: COLORS.textDim,
                margin: 0,
              }}
            >
              Illustrative example using the Osmond family lineage. Real user data is private to each customer.
            </p>
          </MockCard>
        </Section>

        <Divider />

        {/* SECTION 6 — Memories */}
        <Section>
          <Eyebrow>STEP 4 — GIVE-BACK</Eyebrow>
          <H2>How we contribute memories to FamilySearch.</H2>
          <Body>
            In our paid Deep Legacy tier ($79), users complete a 15-question AI interview about
            their family. The interview produces structured memory records — stories, dates, place
            attestations — that the user reviews. For each memory, the user opts in: contribute to
            FamilySearch, or keep private.
          </Body>
          <MockCard>
            <p
              style={{
                fontFamily: fontSerif,
                fontStyle: "italic",
                fontSize: 15,
                color: COLORS.cream,
                lineHeight: 1.6,
                margin: 0,
                marginBottom: 24,
              }}
            >
              "Grandmother's account of her father's emigration from Devon in 1928 — including
              ship's name, port of arrival, and the trade he took up in Newfoundland."
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <BtnWarm>Contribute to FamilySearch</BtnWarm>
              <BtnSoft>Keep Private</BtnSoft>
            </div>
          </MockCard>
          <p
            style={{
              fontFamily: fontSans,
              fontSize: 13,
              color: COLORS.textDim,
              lineHeight: 1.6,
              marginTop: 20,
              marginBottom: 0,
            }}
          >
            Opted-in memories POST to FamilySearch via the memories + sources API via our
            familysearch-contribute-memory edge function. We never POST without explicit per-memory
            consent.
          </p>
        </Section>

        <Divider />

        {/* SECTION 7 — Tech */}
        <Section>
          <Eyebrow>INTEGRATION SUMMARY</Eyebrow>
          <H2>What's deployed.</H2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            <div
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.line}`,
                borderRadius: 14,
                padding: 24,
              }}
            >
              <Eyebrow>EDGE FUNCTIONS LIVE</Eyebrow>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {edgeFns.map((f) => (
                  <li
                    key={f}
                    style={{
                      fontFamily: fontSans,
                      fontSize: 13,
                      color: COLORS.text,
                      padding: "6px 0",
                      borderBottom: `1px solid rgba(61,48,32,0.4)`,
                    }}
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.line}`,
                borderRadius: 14,
                padding: 24,
              }}
            >
              <Eyebrow>ENDPOINTS USED</Eyebrow>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {endpoints.map((e) => (
                  <li
                    key={e}
                    style={{
                      fontFamily: fontSans,
                      fontSize: 13,
                      color: COLORS.text,
                      padding: "6px 0",
                      borderBottom: `1px solid rgba(61,48,32,0.4)`,
                    }}
                  >
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div
            style={{
              marginTop: 24,
              padding: 20,
              background: "rgba(232,148,58,0.04)",
              border: `1px solid ${COLORS.line}`,
              borderRadius: 14,
              fontFamily: fontSans,
              fontSize: 13,
              color: COLORS.textBody,
              lineHeight: 1.7,
            }}
          >
            Compliance commitments: AppKey server-only, token storage RLS-protected, no scraping,
            no data resale, user-controlled disconnect, per-memory opt-in for writes.
          </div>
        </Section>

        <Divider />

        {/* SECTION 8 — Status */}
        <Section>
          <Eyebrow>WHERE WE ARE</Eyebrow>
          <H2>Ready for orientation.</H2>
          <Body>
            All four read-side edge functions and the Stop 3 user surface are live against our beta
            AppKey (b00QWS0JL7HB1U0680D0). The write-side memories contribution endpoint is
            scaffolded and will activate after compliance review. We're blocked at one external
            step: the redirect URI https://ancestorsqr.com/auth/familysearch/callback returns
            "Invalid OAuth2 Request" when tested, indicating it needs activation on FamilySearch's
            side. Realm is https://ancestorsqr.com.
          </Body>
          <div style={{ marginTop: 24 }}>
            <BtnWarm
              as="a"
              href="mailto:greg@ancestorsqr.com?subject=Re%3A%20AncestorsQR%20FamilySearch%20Integration%20Preview"
            >
              Reply to Greg — greg@ancestorsqr.com
            </BtnWarm>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default FamilySearchDemo;
