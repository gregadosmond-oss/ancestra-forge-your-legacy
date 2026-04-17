interface SocialShareProps {
  url: string;
  surname: string;
}

export default function SocialShare({ url, surname }: SocialShareProps) {
  const text = `I just discovered the ${surname} family legacy — coat of arms, family story, migration history and more. Every family has a story worth telling.`;

  // Native share sheet (iOS/Android covers TikTok, Instagram, WhatsApp, Messages, etc.)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `House ${surname} Legacy`, text, url });
      } catch {
        // user cancelled — do nothing
      }
    }
  };

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const platforms = [
    {
      name: "Facebook",
      color: "#1877F2",
      shareUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      ),
    },
    {
      name: "X",
      color: "#000000",
      shareUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: "WhatsApp",
      color: "#25D366",
      shareUrl: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      color: "#0A66C2",
      shareUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col items-center gap-4">

      {/* Native share button — shown on mobile, hidden on desktop if not available */}
      {canNativeShare && (
        <button
          onClick={handleNativeShare}
          className="flex w-full max-w-xs items-center justify-center gap-2 rounded-pill py-3.5 font-sans text-[12px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #e8943a, #c47828)", color: "#1a1208" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share My Legacy
        </button>
      )}

      {/* Platform buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {platforms.map((p) => (
          <a
            key={p.name}
            href={p.shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-pill border px-4 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-[1px] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
            style={{
              borderColor: "rgba(212,160,74,0.25)",
              background: "rgba(212,160,74,0.05)",
              color: "#d4a04a",
            }}
          >
            <span style={{ color: p.color }}>{p.icon}</span>
            {p.name}
          </a>
        ))}
      </div>

      {/* TikTok / Instagram note */}
      <p className="max-w-[260px] text-center font-sans text-[9px] leading-relaxed" style={{ color: "#6a5e4e" }}>
        For TikTok &amp; Instagram — tap <strong style={{ color: "#a07830" }}>Share My Legacy</strong> on your phone to share directly via the app
      </p>
    </div>
  );
}
