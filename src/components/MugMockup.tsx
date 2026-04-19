import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";

interface MugMockupProps {
  surname: string;
}

const PLACEHOLDER_CREST =
  "https://fjtkjbnvpobawqqkzrst.supabase.co/storage/v1/object/public/crests/wagman.png";

// Original spec is 2475x1155. Scaled to 800x374 for a crisp web preview.
const SCALE = 800 / 2475;
const W = Math.round(2475 * SCALE); // 800
const H = Math.round(1155 * SCALE); // 374
const s = (n: number) => n * SCALE;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Fetch a remote image as a Blob and return a local object URL — avoids canvas tainting. */
async function fetchAsObjectUrl(url: string): Promise<string> {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error(`Fetch failed (${res.status}): ${url}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

function drawSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number
) {
  let cursor = x;
  for (const ch of text) {
    ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + spacing;
  }
}

/** Renders the mug design at 800x374 and returns a base64 data URL. */
async function renderMugDesign(surnameRaw: string, crestUrl: string): Promise<string> {
  const SURNAME = surnameRaw.toUpperCase();
  const objectUrls: string[] = [];

  try {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2D canvas context");

    // Background
    ctx.fillStyle = "#0d0a07";
    ctx.fillRect(0, 0, W, H);

    // Gold border strips
    ctx.fillStyle = "#c9a84c";
    ctx.fillRect(0, s(80), W, s(18));
    ctx.fillRect(0, s(1055), W, s(18));

    // Inner frame
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = "#c9a84c";
    ctx.lineWidth = 2;
    ctx.strokeRect(s(20), s(108), s(2435), s(919));
    ctx.restore();

    // Crest — fetch as blob → object URL to avoid CORS tainting
    try {
      const localCrestUrl = await fetchAsObjectUrl(crestUrl);
      objectUrls.push(localCrestUrl);
      const crestImg = await loadImage(localCrestUrl);
      ctx.drawImage(crestImg, s(1600), s(110), s(700), s(895));
    } catch (e) {
      console.error("[MugMockup] Crest image failed to load:", e);
    }

    // "HOUSE OF" label
    ctx.fillStyle = "#a07830";
    ctx.font = `${s(52)}px Georgia, serif`;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    drawSpacedText(ctx, "HOUSE OF", s(350), s(260), s(6));

    // Surname
    ctx.fillStyle = "#e8b85c";
    ctx.font = `bold ${s(148)}px Georgia, serif`;
    ctx.fillText(SURNAME, s(350), s(430));

    // Gold rule line
    ctx.strokeStyle = "#c9a84c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s(350), s(458));
    ctx.lineTo(s(1600), s(458));
    ctx.stroke();

    // Watermark
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#c9a84c";
    ctx.font = `${s(34)}px Georgia, serif`;
    ctx.fillText("A N C E S T O R S Q R", s(950), s(1115));
    ctx.restore();

    return canvas.toDataURL("image/png");
  } catch (err) {
    console.error("[MugMockup] renderMugDesign failed:", err);
    throw err;
  } finally {
    for (const u of objectUrls) URL.revokeObjectURL(u);
  }
}

export default function MugMockup({ surname }: MugMockupProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    const trimmed = surname.trim();

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (!trimmed) {
      setPreviewUrl(null);
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
        const dataUrl = await renderMugDesign(trimmed, crestUrl);
        if (cancelled) return;
        setPreviewUrl(dataUrl);
      } catch (e) {
        if (!cancelled) {
          console.error("[MugMockup] Error:", e);
          setPreviewUrl(null);
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
    <div className="w-full mx-auto" style={{ maxWidth: 500 }}>
      <div
        style={{
          background: "linear-gradient(135deg, #1a1510, #0d0a07)",
          border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: 20,
          padding: "32px 24px 20px",
          textAlign: "center",
          minHeight: 240,
        }}
      >
        <p
          style={{
            fontFamily: "sans-serif",
            fontSize: 10,
            letterSpacing: 4,
            color: "#a07830",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Your Mug Design Preview
        </p>

        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt={`${surname} family crest mug design`}
              style={{ width: "100%", borderRadius: 8, display: "block" }}
            />
            <p
              style={{
                fontFamily: "Georgia, serif",
                fontStyle: "italic",
                fontSize: 13,
                color: "#8a7e6e",
                marginTop: 14,
              }}
            >
              This design wraps around your ceramic mug · Printed &amp; shipped in 5–7 days
            </p>
          </>
        ) : loading ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2"
              style={{ borderColor: "rgba(201,168,76,0.2)", borderTopColor: "#c9a84c" }}
            />
            <p
              className="font-sans uppercase"
              style={{ color: "#a07830", fontSize: 10, letterSpacing: 3 }}
            >
              Forging your design…
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 py-6 text-center">
            <div className="text-5xl">☕</div>
            <p className="font-serif italic" style={{ color: "#8a7e6e", fontSize: 13 }}>
              Type your surname to preview your mug
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
