import { motion } from "framer-motion";
import { usePageMeta } from "@/hooks/usePageMeta";

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

const Divider = () => (
  <div className="my-12 flex items-center justify-center gap-3">
    <div
      className="h-px w-10"
      style={{ background: "linear-gradient(90deg, transparent, #a07830, transparent)" }}
    />
    <div className="text-base" style={{ color: "#a07830" }}>✦</div>
    <div
      className="h-px w-10"
      style={{ background: "linear-gradient(90deg, transparent, #a07830, transparent)" }}
    />
  </div>
);

const PrivacyPolicy = () => {
  usePageMeta({ title: "Privacy Policy | AncestorsQR" });
  return (
    <main
      className="min-h-screen px-6 py-16 md:py-24"
      style={{ background: "#0d0a07" }}
    >
      <article className="mx-auto" style={{ maxWidth: "720px" }}>
        <motion.header {...reveal} className="text-center">
          <div
            className="font-sans"
            style={{
              color: "#a07830",
              fontSize: "10px",
              letterSpacing: "4px",
              textTransform: "uppercase",
            }}
          >
            Legal
          </div>
          <h1
            className="mt-4 font-display"
            style={{
              color: "#f0e8da",
              fontSize: "clamp(32px, 5vw, 48px)",
              lineHeight: 1.15,
            }}
          >
            Privacy Policy
          </h1>
          <p
            className="mt-4 font-serif italic"
            style={{ color: "#8a7e6e", fontSize: "14px" }}
          >
            Last updated: April 19, 2026
          </p>
        </motion.header>

        <Divider />

        <motion.section
          {...reveal}
          className="space-y-6 font-serif"
          style={{ color: "#c4b8a6", fontSize: "16px", lineHeight: 1.95 }}
        >
          <p>
            AncestorsQR ("we," "us," or "our") respects your privacy. This
            Privacy Policy explains how we collect, use, and protect your
            information when you visit our website or purchase our digital
            products.
          </p>

          <h2
            className="font-display"
            style={{ color: "#e8b85c", fontSize: "22px", marginTop: "32px" }}
          >
            Information We Collect
          </h2>
          <p>
            We collect information you provide directly to us, such as your
            name, email address, surname, and family details when you use our
            journey, free tools, or make a purchase. We also collect payment
            information through our payment processor, Stripe, and may collect
            usage data such as your IP address, browser type, and pages visited.
          </p>

          <h2
            className="font-display"
            style={{ color: "#e8b85c", fontSize: "22px", marginTop: "32px" }}
          >
            How We Use Your Information
          </h2>
          <p>
            We use your information to generate your custom crest, family
            story, and other AI-generated content; to process payments and
            deliver digital products; to send transactional emails such as
            order confirmations and delivery notifications; to improve our
            services; and to communicate with you about your account or
            purchases.
          </p>

          <h2
            className="font-display"
            style={{ color: "#e8b85c", fontSize: "22px", marginTop: "32px" }}
          >
            Payment Processing
          </h2>
          <p>
            All payments are processed securely through Stripe. We do not
            store your full credit card details on our servers. Please review
            Stripe's privacy policy for information on how they handle your
            payment data.
          </p>

          <h2
            className="font-display"
            style={{ color: "#e8b85c", fontSize: "22px", marginTop: "32px" }}
          >
            AI-Generated Content
          </h2>
          <p>
            Our service uses third-party AI providers to generate crests,
            stories, and other content based on the information you provide.
            Your inputs may be processed by these providers solely for the
            purpose of generating your legacy materials.
          </p>

          <h2
            className="font-display"
            style={{ color: "#e8b85c", fontSize: "22px", marginTop: "32px" }}
          >
            Sharing Your Information
          </h2>
          <p>
            We do not sell your personal information. We share information
            only with trusted service providers who help us operate our
            business — payment processors, email delivery services, AI
            providers, and print-on-demand fulfillment partners — and only as
            necessary to provide our services to you.
          </p>

          <h2
            className="font-display"
            style={{ color: "#e8b85c", fontSize: "22px", marginTop: "32px" }}
          >
            Cookies & Tracking
          </h2>
          <p>
            We use cookies and similar technologies to remember your
            preferences, maintain your session, and understand how our site is
            used. You can disable cookies in your browser settings, though
            some features may not work properly.
          </p>

          <h2
            className="font-display"
            style={{ color: "#e8b85c", fontSize: "22px", marginTop: "32px" }}
          >
            Your Rights
          </h2>
          <p>
            You may request access to, correction of, or deletion of your
            personal information at any time by contacting us. You may also
            unsubscribe from marketing emails using the link at the bottom of
            any email.
          </p>

          <h2
            className="font-display"
            style={{ color: "#e8b85c", fontSize: "22px", marginTop: "32px" }}
          >
            Data Security
          </h2>
          <p>
            We implement reasonable technical and organizational measures to
            protect your information. However, no system is completely
            secure, and we cannot guarantee absolute security.
          </p>

          <h2
            className="font-display"
            style={{ color: "#e8b85c", fontSize: "22px", marginTop: "32px" }}
          >
            Children's Privacy
          </h2>
          <p>
            Our services are not intended for children under 13. We do not
            knowingly collect personal information from children.
          </p>

          <h2
            className="font-display"
            style={{ color: "#e8b85c", fontSize: "22px", marginTop: "32px" }}
          >
            Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. The "Last
            updated" date at the top reflects the most recent revision.
          </p>

          <h2
            className="font-display"
            style={{ color: "#e8b85c", fontSize: "22px", marginTop: "32px" }}
          >
            Contact Us
          </h2>
          <p>
            If you have any questions about this Privacy Policy, please
            contact us at{" "}
            <a
              href="mailto:greg@ancestorsqr.com"
              style={{ color: "#e8943a", textDecoration: "underline" }}
            >
              greg@ancestorsqr.com
            </a>
            .
          </p>
        </motion.section>

        <Divider />

        <motion.footer
          {...reveal}
          className="text-center font-serif italic"
          style={{ color: "#8a7e6e", fontSize: "13px" }}
        >
          © 2026 AncestorsQR — Every family has a story worth telling.
        </motion.footer>
      </article>
    </main>
  );
};

export default PrivacyPolicy;
