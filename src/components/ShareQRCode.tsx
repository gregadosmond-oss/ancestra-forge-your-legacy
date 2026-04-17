import { useState } from "react";
import { toast } from "sonner";

interface ShareQRCodeProps {
  url: string;
  surname: string;
}

export default function ShareQRCode({ url, surname }: ShareQRCodeProps) {
  const [copied, setCopied] = useState(false);

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=d4a04a&bgcolor=13100b&qzone=1&data=${encodeURIComponent(url)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — try selecting the link manually.");
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = qrSrc + "&format=png";
    a.download = `${surname}-legacy-qr.png`;
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* QR code */}
      <div
        className="rounded-[14px] p-3"
        style={{ background: "#13100b", border: "1px solid rgba(160,120,48,0.3)" }}
      >
        <img
          src={qrSrc}
          alt={`QR code for ${surname} legacy`}
          width={160}
          height={160}
          className="block rounded-[8px]"
        />
      </div>

      {/* URL display */}
      <p
        className="max-w-[220px] break-all text-center font-sans text-[10px] tracking-[1px]"
        style={{ color: "#a07830" }}
      >
        {url.replace("https://", "")}
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-pill border px-4 py-2 font-sans text-[11px] font-semibold uppercase tracking-[1.5px] transition-all duration-200 hover:opacity-80"
          style={{ borderColor: "rgba(212,160,74,0.35)", background: "rgba(212,160,74,0.06)", color: "#d4a04a" }}
        >
          {copied ? (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy Link
            </>
          )}
        </button>

        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 rounded-pill border px-4 py-2 font-sans text-[11px] font-semibold uppercase tracking-[1.5px] transition-all duration-200 hover:opacity-80"
          style={{ borderColor: "rgba(212,160,74,0.35)", background: "rgba(212,160,74,0.06)", color: "#d4a04a" }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Save QR
        </button>
      </div>
    </div>
  );
}
