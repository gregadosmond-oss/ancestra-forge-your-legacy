import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const GiftPage = () => {
  const { giftId } = useParams<{ giftId: string }>();
  const navigate = useNavigate();

  const { data: gift, isLoading: giftLoading, error: giftError } = useQuery({
    queryKey: ["gift", giftId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gifts")
        .select("surname, status")
        .eq("id", giftId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!giftId,
  });

  const { data: crest } = useQuery({
    queryKey: ["surname_crest", gift?.surname],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surname_crests")
        .select("image_url")
        .eq("surname", gift!.surname.toLowerCase())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!gift?.surname,
  });

  const { data: facts } = useQuery({
    queryKey: ["surname_facts", gift?.surname],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surname_facts")
        .select("payload")
        .eq("surname", gift!.surname.toLowerCase())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!gift?.surname,
  });

  const factsPayload = facts?.payload as Record<string, unknown> | null;
  const motto = factsPayload?.mottoLatin as string | undefined;
  const mottoEnglish = factsPayload?.mottoEnglish as string | undefined;

  const handleClaim = () => {
    navigate(`/journey/1?surname=${encodeURIComponent(gift?.surname ?? "")}`);
  };

  if (giftLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-sans text-sm uppercase tracking-[4px]">
          Unveiling your gift…
        </p>
      </div>
    );
  }

  if (giftError || !gift) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 relative overflow-hidden"
        style={{ background: "#0d0a07" }}
      >
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 50% 50%, hsla(var(--honey), 0.04) 0%, transparent 70%)",
          }}
        />

        <img
          src="/crest.png"
          alt="AncestorsQR crest"
          className="w-20 h-20 object-contain opacity-40"
          draggable={false}
        />

        <h1
          className="font-display text-center"
          style={{ fontSize: "clamp(24px, 5vw, 36px)", color: "hsl(var(--cream))" }}
        >
          Gift Not Found
        </h1>

        <p
          className="font-sans text-center max-w-md"
          style={{ color: "#c4b8a6", fontSize: "15px", lineHeight: "1.7" }}
        >
          This gift link may have expired or doesn't exist. If someone sent you a legacy, ask them for a new link.
        </p>

        <button
          onClick={() => navigate("/")}
          className="font-sans font-semibold uppercase tracking-[1.5px] mt-4 transition-all duration-300"
          style={{
            background: "rgba(232,148,58,0.06)",
            border: "1px solid rgba(232,148,58,0.18)",
            color: "hsl(var(--amber))",
            fontSize: "12px",
            padding: "14px 36px",
            borderRadius: "60px",
            cursor: "pointer",
          }}
        >
          Discover Your Legacy
        </button>

        <p
          className="absolute bottom-6 font-sans text-center uppercase tracking-[3px]"
          style={{ color: "hsl(var(--text-dim))", fontSize: "10px" }}
        >
          Forged by AncestorsQR
        </p>
      </div>
    );
  }

  const surname = gift.surname.charAt(0).toUpperCase() + gift.surname.slice(1);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 45%, hsla(var(--honey), 0.06) 0%, transparent 70%)",
        }}
      />

      {/* Crest image */}
      <div className="mb-8 flex items-center justify-center" style={{ minHeight: "280px" }}>
        <img
          src={crest?.image_url ?? "/crest.png"}
          alt={`House ${surname} family crest`}
          style={{ width: "280px", height: "280px", objectFit: "contain" }}
          draggable={false}
        />
      </div>

      {/* Headline */}
      <h1
        className="font-display text-center mb-3"
        style={{
          fontSize: "clamp(28px, 6vw, 48px)",
          color: "hsl(var(--cream-warm))",
        }}
      >
        House {surname}
      </h1>

      {/* Motto */}
      {motto && (
        <div className="text-center mb-4">
          <p className="font-serif italic" style={{ color: "hsl(var(--amber-light))", fontSize: "17px" }}>
            {motto}
          </p>
          {mottoEnglish && (
            <p className="mt-1 font-sans uppercase tracking-[3px]" style={{ color: "#a07830", fontSize: "9px" }}>
              {mottoEnglish}
            </p>
          )}
        </div>
      )}

      {/* Subtitle */}
      <p
        className="font-sans text-center mb-10 max-w-md"
        style={{ color: "hsl(var(--text-body))", fontSize: "15px" }}
      >
        Someone special wants you to discover your legacy.
      </p>

      {/* CTA Button */}
      <button
        onClick={handleClaim}
        className="font-sans font-semibold uppercase tracking-[1.5px] transition-all duration-300"
        style={{
          background: "linear-gradient(135deg, hsl(var(--honey)), hsl(var(--honey-dim)))",
          color: "hsl(var(--primary-foreground))",
          fontSize: "13px",
          padding: "16px 40px",
          borderRadius: "60px",
          border: "none",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 12px 40px hsla(var(--honey), 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        Claim Your Legacy
      </button>

      {/* Footer mark */}
      <p
        className="absolute bottom-6 font-sans text-center uppercase tracking-[3px]"
        style={{ color: "hsl(var(--text-dim))", fontSize: "10px" }}
      >
        Forged by AncestorsQR
      </p>
    </div>
  );
};

export default GiftPage;
