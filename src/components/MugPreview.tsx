import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MugPreviewProps {
  surname: string;
}

export default function MugPreview({ surname }: MugPreviewProps) {
  const [crestUrl, setCrestUrl] = useState<string | null>(null);
  const trimmed = surname.trim();
  const displaySurname = trimmed ? trimmed.toUpperCase() : "SURNAME";
  const isPlaceholder = !trimmed;

  useEffect(() => {
    if (!trimmed) {
      setCrestUrl(null);
      return;
    }
    let cancelled = false;
    const lookup = trimmed.toLowerCase();
    supabase
      .from("surname_crests")
      .select("image_url")
      .eq("surname", lookup)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setCrestUrl(data?.image_url ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [trimmed]);

  return (
    <div className="w-full" style={{ maxWidth: 600 }}>
      <svg
        viewBox="0 0 2475 1155"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto rounded-[14px]"
        style={{ display: "block" }}
      >
        {/* Background */}
        <rect width="2475" height="1155" fill="#0d0a07" />

        {/* Gold border strips */}
        <rect x="0" y="80" width="2475" height="18" fill="#c9a84c" />
        <rect x="0" y="1057" width="2475" height="18" fill="#c9a84c" />

        {/* Left — HOUSE OF */}
        <text
          x="350"
          y="260"
          fontFamily="Georgia, serif"
          fontSize="52"
          fill="#a07830"
        >
          HOUSE OF
        </text>

        {/* Surname */}
        <text
          x="350"
          y="430"
          fontFamily="Georgia, serif"
          fontSize="148"
          fontWeight="bold"
          fill={isPlaceholder ? "#5a4a2e" : "#e8b85c"}
        >
          {displaySurname}
        </text>

        {/* Gold rule line */}
        <line x1="350" y1="458" x2="1600" y2="458" stroke="#c9a84c" strokeWidth="3" />

        {/* QR label */}
        <text
          x="330"
          y="720"
          fontFamily="Arial, sans-serif"
          fontSize="28"
          fill="#a07830"
        >
          SCAN YOUR LEGACY
        </text>

        {/* QR placeholder */}
        <rect x="205" y="740" width="250" height="250" fill="#2a2018" />

        {/* Vertical divider */}
        <line
          x1="1640"
          y1="108"
          x2="1640"
          y2="1047"
          stroke="#c9a84c"
          strokeOpacity="0.25"
          strokeWidth="2"
        />

        {/* Crest area */}
        {crestUrl ? (
          <image
            href={crestUrl}
            x="1600"
            y="110"
            width="700"
            height="935"
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <rect x="1600" y="110" width="700" height="935" fill="#2a2018" />
        )}

        {/* Watermark */}
        <text
          x="950"
          y="1029"
          fontFamily="Georgia, serif"
          fontSize="34"
          fill="#c9a84c"
          fillOpacity="0.18"
          textAnchor="middle"
        >
          A N C E S T O R S Q R
        </text>
      </svg>
    </div>
  );
}
