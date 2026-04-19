import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MugMockupProps {
  surname: string;
}

const PLACEHOLDER_CREST =
  "https://fjtkjbnvpobawqqkzrst.supabase.co/storage/v1/object/public/crests/wagman.png";

// Original spec is 2475x1155. We render scaled at 800x374 (≈ /3.094) for a smaller payload.
const SCALE = 800 / 2475;
const W = Math.round(2475 * SCALE); // 800
const H = Math.round(1155 * SCALE); // 374

const s = (n: number) => n * SCALE;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
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

    // QR label
    ctx.fillStyle = "#a07830";
    ctx.font = `${s(28)}px Arial, sans-serif`;
    drawSpacedText(ctx, "SCAN YOUR LEGACY", s(330), s(720), s(4));

    // QR placeholder (api.qrserver.com has no CORS — use a gold rectangle with "QR" text)
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#c9a84c";
    ctx.fillRect(s(205), s(740), s(250), s(250));
    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${s(50)}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("QR", s(205 + 125), s(740 + 125));
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

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
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    const trimmed = surname.trim();

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (!trimmed) {
      setPreviewUrl(null);
      setMockupUrl(null);
      setErrorMsg(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setErrorMsg(null);
    setMockupUrl(null);

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

        // 1. Render canvas → base64 data URL
        console.log("[MugMockup] Rendering canvas design for:", trimmed);
        const dataUrl = await renderMugDesign(trimmed, crestUrl);
        if (cancelled) return;

        // Show the flat canvas immediately as the preview
        setPreviewUrl(dataUrl);

        // 2. Send base64 to edge function (it will upload via service role + call Printful)
        console.log("[MugMockup] Sending design to edge function…");
        const { data, error } = await supabase.functions.invoke("generate-mug-mockup", {
          body: { surname: trimmed, designBase64: dataUrl, crestUrl },
        });
        console.log("[MugMockup] Response:", { data, error });

        if (cancelled) return;

        if (error) {
          console.error("[MugMockup] Edge function error:", error);
          setErrorMsg(error.message ?? "Failed to generate 3D mockup");
        } else if (data?.mockupUrl) {
          setMockupUrl(data.mockupUrl);
        } else {
          setErrorMsg("No mockup returned");
        }
      } catch (e) {
        if (!cancelled) {
          console.error("[MugMockup] Error:", e);
          setErrorMsg((e as Error).message ?? "Mockup failed");
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

  // Display priority: 3D Printful mockup > flat canvas preview > spinner > empty state
  const displayUrl = mockupUrl ?? previewUrl;

  return (
    <div
      className="w-full mx-auto flex items-center justify-center overflow-hidden rounded-[18px] relative"
      style={{ maxWidth: 500, aspectRatio: "1 / 1", background: "#1a1510" }}
    >
      {displayUrl ? (
        <>
          <img
            src={displayUrl}
            alt={`${surname} family crest mug preview`}
            className="h-full w-full object-contain"
          />
          {loading && !mockupUrl && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm">
              <div
                className="h-3 w-3 animate-spin rounded-full border-2 border-amber-dim/30"
                style={{ borderTopColor: "#e8b85c" }}
              />
              <span className="font-sans text-[10px] uppercase tracking-[2px] text-amber-dim">
                Forging 3D mug…
              </span>
            </div>
          )}
        </>
      ) : loading ? (
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-amber-dim/30"
            style={{ borderTopColor: "#e8b85c" }}
          />
          <p className="font-sans text-[11px] uppercase tracking-[2px] text-amber-dim">
            Forging your mug…
          </p>
        </div>
      ) : errorMsg ? (
        <div className="flex flex-col items-center gap-2 px-6 text-center">
          <div className="text-3xl">⚠️</div>
          <p className="font-serif text-xs italic text-text-dim">{errorMsg}</p>
        </div>
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
