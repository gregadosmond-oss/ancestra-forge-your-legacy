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

  const motto = (facts?.payload as Record<string, unknown>)?.motto_latin as string | undefined;

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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6">
        <h1 className="font-display text-2xl text-foreground">Gift Not Found</h1>
        <p className="text-muted-foreground font-sans text-center max-w-md">
          This gift link may have expired or doesn't exist.
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
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 mb-8 flex items-center justify-center">
        {crest?.image_url ? (
          <img
            src={crest.image_url}
            alt={`House ${surname} family crest`}
            className="w-full h-full object-contain"
            draggable={false}
          />
        ) : (
          <img
            src="/crest.png"
            alt="Ancestra family crest"
            className="w-full h-full object-contain"
            draggable={false}
          />
        )}
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

      {/* Subtitle */}
      <p
        className="font-serif italic text-center mb-10 max-w-md"
        style={{ color: "hsl(var(--amber-light))", fontSize: "17px" }}
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
        Forged by Ancestra
      </p>
    </div>
  );
};

export default GiftPage;
