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

const Terms = () => {
  usePageMeta({ title: "Terms of Service | AncestorsQR" });
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
            Terms of Service
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
            Welcome to AncestorsQR. By accessing or using our website,
            services, or purchasing our digital products, you agree to be
            bound by these Terms of Service. Please read them carefully.
          </p>

          <h2
            className="font-display"
            style={{ color: "#e8b85c", fontSize: "22px", marginTop: "32px" }}
          >
            About Our Service
          </h2>
          <p>
            AncestorsQR provides AI-generated heritage content, including
            custom family crests, written family stories, family trees, and
            related digital products. Our content is created using artificial
            intelligence and historical references and is intended for
            entertainment, inspiration, and personal enjoyment — not as
            verified genealogical research.
          </p>

          <h2
            className="font-display"
            style={{ color: "#e8b85c", fontSize: "22px", marginTop: "32px" }}
          >
            Eligibility
          </h2>
          <p>
            You must be at least 18 years old or have permission from a parent
            or legal guardian to use our services or make purchases.
          </p>

          <h2
            className="font-display"
            style={{ color: "#e8b85c", fontSize: "22px", marginTop: "32px" }}
          >
            Accounts & Email
          </h2>
          <p>
            When you provide your email address, you authorize us to send you
            transactional messages related to your purchases, including order
            confirmations, delivery notifications, and account information.
            You are responsible for keeping your account information accurate
            and secure.
          </p>

          <h2
            className="font-display"
            style={{ color: "#e8b85c", fontSize: "22px", marginTop: "32px" }}
          >
            Purchases & Payments
          </h2>
          <p>
            All payments are processed securely through Stripe. Prices are
            listed in U.S. dollars unless otherwise noted and may change at
            any time. By making a purchase, you confirm that the payment
            information you provide is accurate and that you are authorized
            to use the chosen payment method.
          </p>

          <h2
            className="font-display"
            style={{ color: "#e8b85c", fontSize: "22px", marginTop: "32px" }}
          >
            Digital Products & Delivery
          </h2>
          <p>
            Digital products — such as crests, stories, certificates, and
            other AI-generated content — are delivered electronically, usually
            via email or to your account, shortly after payment is confirmed.
            Because these products are generated and delivered digitally, all
            sales are final and non-refundable except where required by law
            or in cases of clear technical failure on our part.
          </p>

          <h2
            className="font-display"
            style={{ color: "#e8b85c", fontSize: "22px", marginTop: "32px" }}
          >
            Refunds
          </h2>
          <p>
            If you experience a technical issue that prevents delivery of
            your purchase, please contact us within 14 days at{" "}
            <a
              href="mailto:gregadosmond@gmail.com"
              style={{ color: "#e8943a", textDecoration: "underline" }}
            >
              gregadosmond@gmail.com
            </a>{" "}
            and we will work with you to resolve it, including issuing a
            refund where appropriate.
          </p>

          <h2
            className="font-display"
            style={{ color: "#e8b85c", fontSize: "22px", marginTop: "32px" }}
          >
            AI-Generated Content Disclaimer
          </h2>
          <p>
            All crests, stories, mottos, and family histories are generated
            by artificial intelligence based on historical patterns,
            heraldic traditions, and the information you provide. They are
            creative interpretations and should not be relied upon as
            verified historical or genealogical records. Names, dates, and
            events may be fictionalized for narrative purposes.
          </p>

          <h2
            className="font-display"
            style={{ color: "#e8b85c", fontSize: "22px", marginTop: "32px" }}
          >
            Intellectual Property
          </h2>
          <p>
            All content on this site, including the AncestorsQR name, logo,
            design system, and original written material, is owned by us or
            our licensors. When you purchase a digital product, you receive
            a personal, non-exclusive, non-transferable license to use it for
            personal, non-commercial purposes. You may not resell or
            redistribute our content without written permission.
          </p>

          <h2
            className="font-display"
            style={{ color: "#e8b85c", fontSize: "22px", marginTop: "32px" }}
          >
            Acceptable Use
          </h2>
          <p>
            You agree not to misuse our services, attempt to disrupt our
            systems, scrape our content, or use our platform for any unlawful
            or harmful purpose.
          </p>

          <h2
            className="font-display"
            style={{ color: "#e8b85c", fontSize: "22px", marginTop: "32px" }}
          >
            Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by law, AncestorsQR is not liable
            for any indirect, incidental, or consequential damages arising
            from your use of our services. Our total liability for any claim
            shall not exceed the amount you paid us in the past twelve months.
          </p>

          <h2
            className="font-display"
            style={{ color: "#e8b85c", fontSize: "22px", marginTop: "32px" }}
          >
            Termination
          </h2>
          <p>
            We reserve the right to suspend or terminate your access to our
            services at any time if you violate these Terms or misuse our
            platform.
          </p>

          <h2
            className="font-display"
            style={{ color: "#e8b85c", fontSize: "22px", marginTop: "32px" }}
          >
            Changes to These Terms
          </h2>
          <p>
            We may update these Terms from time to time. Continued use of our
            services after changes are posted constitutes acceptance of the
            updated Terms.
          </p>

          <h2
            className="font-display"
            style={{ color: "#e8b85c", fontSize: "22px", marginTop: "32px" }}
          >
            Contact Us
          </h2>
          <p>
            For questions about these Terms, please contact us at{" "}
            <a
              href="mailto:gregadosmond@gmail.com"
              style={{ color: "#e8943a", textDecoration: "underline" }}
            >
              gregadosmond@gmail.com
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

export default Terms;
