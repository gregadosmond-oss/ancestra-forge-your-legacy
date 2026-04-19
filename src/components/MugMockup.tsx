import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MugMockupProps {
  surname: string;
}

const PLACEHOLDER_CREST =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Coat_of_arms_of_the_United_Kingdom.svg/600px-Coat_of_arms_of_the_United_Kingdom.svg.png";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

async function renderMugDesign(surnameRaw: string, crestUrl: string): Promise<Blob> {
  const SURNAME = surnameRaw.toUpperCase();
  const W = 2475;
  const H = 1155;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = "#0d0a07";
  ctx.fillRect(0, 0, W, H);

  // Gold border strips
  ctx.fillStyle = "#c9a84c";
  ctx.fillRect(0, 80, W, 18);
  ctx.fillRect(0, 1055, W, 18);

  // Inner frame
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = "#c9a84c";
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 108, 2435, 919);
  ctx.restore();

  // Crest (best-effort; continue if it fails)
  try {
    const crestImg = await loadImage(crestUrl);
    ctx.drawImage(crestImg, 1600, 110, 700, 895);
  } catch (e) {
    console.warn("[MugMockup] Crest image failed to load:", e);
  }

  // "HOUSE OF" label (manual letter-spacing)
  ctx.fillStyle = "#a07830";
  ctx.font = "52px Georgia, serif";
  ctx.textBaseline = "alphabetic";
  drawSpacedText(ctx, "HOUSE OF", 350, 260, 6);

  // Surname
  ctx.fillStyle = "#e8b85c";
  ctx.font = "bold 148px Georgia, serif";
  ctx.fillText(SURNAME, 350, 430);

  // Gold rule line
  ctx.strokeStyle = "#c9a84c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(350, 458);
  ctx.lineTo(1600, 458);
  ctx.stroke();

  // QR label
  ctx.fillStyle = "#a07830";
  ctx.font = "28px Arial, sans-serif";
  drawSpacedText(ctx, "SCAN YOUR LEGACY", 330, 720, 4);

  // QR image
  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=c9a84c&bgcolor=0d0a07&qzone=2&data=${encodeURIComponent(
      `https://ancestorsqr.com/f/${SURNAME}`
    )}`;
    const qrImg = await loadImage(qrUrl);
    ctx.drawImage(qrImg, 205, 740, 250, 250);
  } catch (e) {
    console.warn("[MugMockup] QR image failed to load:", e);
  }

  // Watermark
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#c9a84c";
  ctx.font = "34px Georgia, serif";
  ctx.fillText("A N C E S T O R S Q R", 950, 1115);
  ctx.restore();

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("canvas.toBlob returned null"));
    }, "image/png");
  });
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

export default function MugMockup({ surname }: MugMockupProps) {
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);

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

        // 1. Render full mug design on a browser canvas
        console.log("[MugMockup] Rendering canvas design for:", trimmed);
        const designBlob = await renderMugDesign(trimmed, crestUrl);
        if (cancelled) return;

        // 2. Upload to Supabase storage
        const slug = trimmed.toLowerCase().replace(/\s+/g, "-");
        const path = `heirloom-preview/${slug}-preview.png`;
        const { error: uploadErr } = await supabase.storage
          .from("crests")
          .upload(path, designBlob, {
            upsert: true,
            contentType: "image/png",
            cacheControl: "3600",
          });

        if (uploadErr) {
          console.error("[MugMockup] Upload failed:", uploadErr);
          if (!cancelled) setMockupUrl(null);
          return;
        }

        const { data: pub } = supabase.storage.from("crests").getPublicUrl(path);
        const designUrl = `${pub.publicUrl}?t=${Date.now()}`;
        console.log("[MugMockup] Uploaded design:", designUrl);

        // 3. Pass uploaded image URL to generate-mug-mockup
        const { data, error } = await supabase.functions.invoke("generate-mug-mockup", {
          body: { surname: trimmed, crestUrl, designUrl },
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
