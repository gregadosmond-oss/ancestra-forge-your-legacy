import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SectionLabel from "@/components/journey/SectionLabel";
import WarmDivider from "@/components/journey/WarmDivider";
import StaggerGroup, { staggerItem } from "@/components/journey/StaggerGroup";
import AuthGate from "@/components/AuthGate";
import ShareQRCode from "@/components/ShareQRCode";
import SocialShare from "@/components/SocialShare";
import { useJourney } from "@/contexts/JourneyContext";
import { usePurchase } from "@/hooks/usePurchase";
import { supabase } from "@/integrations/supabase/client";

const Stop6PassItOn = () => {
  const navigate = useNavigate();
  const { surname, facts, story, crest } = useJourney();
  const { user } = usePurchase();

  const [previewEmail, setPreviewEmail] = useState("");
  const [previewSending, setPreviewSending] = useState(false);

  const [giftEmail, setGiftEmail] = useState("");
  const [showGiftAuth, setShowGiftAuth] = useState(false);

  const sendPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewEmail) return;
    setPreviewSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-preview", {
        body: {
          recipientEmail: previewEmail,
          surname: surname ?? "",
          facts: facts.data
            ? {
                meaning: {
                  role: facts.data.meaning.role,
                  origin: facts.data.meaning.origin,
                },
                mottoLatin: facts.data.mottoLatin,
                mottoEnglish: facts.data.mottoEnglish,
              }
            : undefined,
          chapterOneTitle: story.data?.chapterOneTitle,
          chapterOneBody: story.data?.chapterOneBody,
          crestUrl: crest.data?.imageUrl,
        },
      });
      if (error) throw error;
      toast.success(`Preview sent to ${previewEmail}`);
      setPreviewEmail("");
    } catch {
      toast.error("Failed to send preview — please try again.");
    } finally {
      setPreviewSending(false);
    }
  };

  const handleGiftClick = () => {
    if (!giftEmail) {
      toast.error("Enter the recipient's email first.");
      return;
    }
    if (!user) {
      setShowGiftAuth(true);
      return;
    }
    navigate("/checkout", { state: { isGift: true, recipientEmail: giftEmail } });
  };

  const handleGiftAuthenticated = () => {
    setShowGiftAuth(false);
    navigate("/checkout", { state: { isGift: true, recipientEmail: giftEmail } });
  };

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-24">
      <StaggerGroup className="w-full max-w-2xl">
        <motion.div variants={staggerItem} className="text-center">
          <SectionLabel>PASS IT ON</SectionLabel>
          <h1 className="mt-4 font-display text-4xl tracking-tight text-cream-warm sm:text-5xl">
            Who in your family needs to see this?
          </h1>
        </motion.div>

        {/* QR Code share */}
        {surname && (
          <motion.div variants={staggerItem} className="mt-10 flex flex-col items-center">
            <p className="mb-5 font-sans text-[9px] uppercase tracking-[3px]" style={{ color: "#a07830" }}>
              Your shareable legacy link
            </p>
            <ShareQRCode
              url={`${window.location.origin}/f/${surname.toLowerCase()}`}
              surname={surname}
            />
            <p className="mt-4 max-w-xs text-center font-serif text-xs italic" style={{ color: "#8a7e6e" }}>
              Anyone who scans this sees your family crest, motto &amp; story preview — and can discover their own.
            </p>
            <div className="mt-6 w-full">
              <SocialShare
                url={`${window.location.origin}/f/${surname?.toLowerCase()}`}
                surname={surname ?? ""}
              />
            </div>
          </motion.div>
        )}

        <motion.div variants={staggerItem}>
          <WarmDivider />
        </motion.div>

        {/* Action 1: Send free preview */}
        <motion.div variants={staggerItem} className="mt-4">
          <p className="mb-4 text-center font-serif text-sm italic text-amber-dim">
            Send a free preview
          </p>
          <form onSubmit={sendPreview} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={previewEmail}
              onChange={(e) => setPreviewEmail(e.target.value)}
              placeholder="their@email.com"
              className="flex-1 rounded-pill border border-amber-dim/30 bg-input px-6 py-4 font-sans text-sm text-cream-warm placeholder:text-text-dim focus:border-amber focus:outline-none"
            />
            <button
              type="submit"
              disabled={previewSending || !previewEmail}
              className="rounded-pill px-8 py-4 font-sans text-[12px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #e8943a, #c47828)" }}
            >
              {previewSending ? "Sending…" : "Send Preview"}
            </button>
          </form>
        </motion.div>

        <motion.div variants={staggerItem}>
          <WarmDivider />
        </motion.div>

        {/* Action 2: Gift the Legacy Pack */}
        <motion.div variants={staggerItem} className="text-center">
          <p className="mb-4 font-serif text-sm italic text-amber-dim">
            Gift the Legacy Pack
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={giftEmail}
              onChange={(e) => setGiftEmail(e.target.value)}
              placeholder="their@email.com"
              className="flex-1 rounded-pill border border-amber-dim/30 bg-input px-6 py-4 font-sans text-sm text-cream-warm placeholder:text-text-dim focus:border-amber focus:outline-none"
            />
            <button
              onClick={handleGiftClick}
              disabled={!giftEmail}
              className="rounded-pill border border-amber/40 bg-amber/[0.06] px-10 py-4 font-sans text-[12px] font-semibold uppercase tracking-[1.5px] text-amber-light transition-colors hover:bg-amber/[0.12] disabled:opacity-50"
            >
              Gift the Legacy · $29.99
            </button>
          </div>
        </motion.div>

        <motion.div variants={staggerItem}>
          <WarmDivider />
        </motion.div>

        {/* Action 3: Three destination cards */}
        <motion.div variants={staggerItem}>
          <p className="mb-6 text-center font-serif text-sm italic text-amber-dim">
            Want to go deeper?
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">

            {/* Legacy Pack */}
            <div className="flex flex-col rounded-[22px] p-6 text-center" style={{ background: "#1e1810", border: "1px solid rgba(232,148,58,0.35)" }}>
              <div className="mb-3 text-3xl">🛡</div>
              <h3 className="font-display text-base text-cream-warm">Legacy Pack</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "#8a7e6e" }}>
                Your full 9-chapter story, high-res crest, family tree &amp; legacy certificate.
              </p>
              <div className="mt-3 font-display text-2xl" style={{ color: "#e8b85c" }}>$29</div>
              <button
                onClick={() => navigate("/checkout")}
                className="mt-5 rounded-pill py-3 font-sans text-[11px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
              >
                Unlock Now
              </button>
            </div>

            {/* Heirloom Shop */}
            <div className="flex flex-col rounded-[22px] border bg-card p-6 text-center" style={{ borderColor: "rgba(232,148,58,0.12)" }}>
              <div className="mb-3 text-3xl">🎁</div>
              <h3 className="font-display text-base text-cream-warm">Heirloom Shop</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "#8a7e6e" }}>
                Framed crests, mugs, books &amp; more. Every heirloom includes the Legacy Pack.
              </p>
              <div className="mt-3 font-display text-2xl" style={{ color: "#e8b85c" }}>$49+</div>
              <button
                onClick={() => navigate("/shop")}
                className="mt-5 rounded-pill py-3 font-sans text-[11px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:opacity-80"
                style={{ background: "rgba(232,148,58,0.08)", border: "1px solid rgba(232,148,58,0.2)", color: "#d4a04a" }}
              >
                Browse Shop
              </button>
            </div>

            {/* Pricing */}
            <div className="flex flex-col rounded-[22px] border bg-card p-6 text-center" style={{ borderColor: "rgba(232,148,58,0.12)" }}>
              <div className="mb-3 text-3xl">📜</div>
              <h3 className="font-display text-base text-cream-warm">See All Pricing</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "#8a7e6e" }}>
                Compare everything we offer and find the right pack for your family.
              </p>
              <div className="mt-3 font-display text-2xl" style={{ color: "#e8b85c" }}>Free+</div>
              <button
                onClick={() => navigate("/pricing")}
                className="mt-5 rounded-pill py-3 font-sans text-[11px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:opacity-80"
                style={{ background: "rgba(232,148,58,0.08)", border: "1px solid rgba(232,148,58,0.2)", color: "#d4a04a" }}
              >
                View Pricing
              </button>
            </div>

          </div>
        </motion.div>

        <motion.p
          variants={staggerItem}
          className="mt-20 text-center font-serif text-sm italic text-amber-dim"
        >
          An AncestorsQR Original.
        </motion.p>
      </StaggerGroup>

      {showGiftAuth && (
        <AuthGate
          onAuthenticated={handleGiftAuthenticated}
          onClose={() => setShowGiftAuth(false)}
        />
      )}
    </div>
  );
};

export default Stop6PassItOn;
