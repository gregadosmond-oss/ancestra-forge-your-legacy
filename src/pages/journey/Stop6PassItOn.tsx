import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SectionLabel from "@/components/journey/SectionLabel";
import WarmDivider from "@/components/journey/WarmDivider";
import ProductCard from "@/components/journey/ProductCard";
import StaggerGroup, { staggerItem } from "@/components/journey/StaggerGroup";
import AuthGate from "@/components/AuthGate";
import { MOCK_PRODUCTS } from "@/test/fixtures/legacy";
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

        {/* Action 1: Send free preview */}
        <motion.div variants={staggerItem} className="mt-16">
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

        {/* Action 3: Physical keepsake */}
        <motion.div variants={staggerItem}>
          <p className="mb-6 text-center font-serif text-sm italic text-amber-dim">
            Or gift a physical keepsake
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {MOCK_PRODUCTS.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </motion.div>

        <motion.p
          variants={staggerItem}
          className="mt-20 text-center font-serif text-sm italic text-amber-dim"
        >
          An Ancestra Original.
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
