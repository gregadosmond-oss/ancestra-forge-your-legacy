import { useNavigate } from "react-router-dom";
import { startAmbientAudio } from "@/lib/ambientAudio";

const EntryPortalPage = () => {
  const navigate = useNavigate();

  const handleEnter = () => {
    startAmbientAudio();
    window.scrollTo({ top: 0, behavior: "instant" });
    navigate("/home");
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* Background video */}
      <video
        src="/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center 30%" }}
      />

      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(13,10,7,0.55) 0%, rgba(13,10,7,0.82) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Crest */}
        <img
          src="/crest.png"
          alt="Ancestra crest"
          style={{
            width: "180px",
            height: "auto",
            filter: "drop-shadow(0 0 32px rgba(212,160,74,0.45))",
          }}
        />

        {/* Headline */}
        <p
          className="mt-8 font-serif text-2xl italic"
          style={{ color: "#e8b85c" }}
        >
          Welcome to Ancestra
        </p>

        <p
          className="mt-3 font-sans text-sm"
          style={{ color: "#8a7e6e", letterSpacing: "1px" }}
        >
          Every family has a story worth telling.
        </p>

        {/* CTA */}
        <button
          onClick={handleEnter}
          className="mt-10 font-sans text-[13px] font-semibold uppercase tracking-[1.5px]"
          style={{
            background: "linear-gradient(135deg, #e8943a, #c47828)",
            color: "#1a1208",
            padding: "18px 52px",
            borderRadius: "60px",
            animation: "portalPulse 2.5s ease-in-out infinite",
          }}
        >
          Begin Your Journey
        </button>
      </div>

      <style>{`
        @keyframes portalPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(232,148,58,0); }
          50% { box-shadow: 0 0 0 22px rgba(232,148,58,0.2); }
        }
      `}</style>
    </div>
  );
};

export default EntryPortalPage;
