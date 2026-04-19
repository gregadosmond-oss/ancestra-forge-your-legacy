import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MugMockupProps {
  surname: string;
}

export default function MugMockup({ surname }: MugMockupProps) {
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const PLACEHOLDER_CREST = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Coat_of_arms_of_the_United_Kingdom.svg/600px-Coat_of_arms_of_the_United_Kingdom.svg.png";

  useEffect(() => {
    const trimmed = surname.trim();

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (!trimmed) {
      setMockupUrl(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    debounceRef.current = window.setTimeout(async () => {
      try {
        const lookup = trimmed.toLowerCase();
        const { data: crest } = await supabase
          .from("surname_crests")
          .select("image_url")
          .eq("surname", lookup)
          .maybeSingle();

        if (cancelled) return;

        const crestUrl = crest?.image_url ?? PLACEHOLDER_CREST;

        console.log("[MugMockup] Invoking generate-mug-mockup:", { surname: trimmed, crestUrl });
        const { data, error } = await supabase.functions.invoke("generate-mug-mockup", {
          body: { surname: trimmed, crestUrl },
        });
        console.log("[MugMockup] Response:", { data, error });

        if (cancelled) return;

        if (error || !data?.mockupUrl) {
          console.error("Mockup generation failed:", error ?? data);
          setMockupUrl(null);
        } else {
          setMockupUrl(data.mockupUrl);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Mockup error:", e);
          setMockupUrl(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [surname]);

  return (
    <div
      className="w-full mx-auto flex items-center justify-center overflow-hidden rounded-[18px]"
      style={{ maxWidth: 500, aspectRatio: "1 / 1", background: "#1a1510" }}
    >
      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-amber-dim/30"
            style={{ borderTopColor: "#e8b85c" }}
          />
          <p className="font-sans text-[11px] uppercase tracking-[2px] text-amber-dim">
            Forging your mug…
          </p>
        </div>
      ) : mockupUrl ? (
        <img
          src={mockupUrl}
          alt={`${surname} family crest mug preview`}
          className="h-full w-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center gap-2 px-6 text-center">
          <div className="text-5xl">☕</div>
          <p className="font-serif text-sm italic text-text-dim">
            Type your surname to preview your mug
          </p>
        </div>
      )}
    </div>
  );
}
