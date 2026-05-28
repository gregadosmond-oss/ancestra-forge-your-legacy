import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const freeTools = [
  { name: "Surname Lookup", to: "/tools/surname" },
  { name: "Meet Your Ancestor", to: "/tools/ancestor" },
  { name: "The 1700s You", to: "/tools/1700s" },
  { name: "Motto Generator", to: "/tools/motto" },
  { name: "Bloodline Quiz", to: "/tools/quiz" },
];

const legacyTools = [
  { name: "Chat With Your Ancestor", to: "/tools/chat" },
  { name: "Forge Your Crest", to: "/tools/crest" },
  { name: "Get Your Family Story", to: "/tools/story" },
  { name: "Create Your Family Tree", to: "/tools/tree" },
  { name: "Collect Your History From a Family Member", to: "/tools/collect" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState<string>("");
  const [tier, setTier] = useState<string>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/login", { replace: true });
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("first_name, tier")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!active) return;
      setFirstName(data?.first_name ?? "");
      setTier(data?.tier ?? "free");
      setLoading(false);
    })();
    return () => { active = false; };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-6 py-16 text-center font-serif italic text-text-dim">
        Loading…
      </div>
    );
  }

  const isFree = tier === "free";

  const renderTool = (tool: { name: string; to: string }, locked: boolean) => {
    if (locked) {
      return (
        <div
          key={tool.to}
          className="group flex aspect-square flex-col items-center justify-center rounded-full border border-amber-dim/10 bg-card/40 p-4 text-center"
          style={{
            boxShadow: "inset 0 0 40px rgba(232,148,58,0.02)",
          }}
        >
          <Lock className="mb-2 text-text-dim/40" size={18} />
          <span className="font-display text-sm leading-tight text-text-dim/40 md:text-base">
            {tool.name}
          </span>
        </div>
      );
    }

    return (
      <Link
        key={tool.to}
        to={tool.to}
        className="group flex aspect-square flex-col items-center justify-center rounded-full border border-amber-dim/30 bg-card p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-amber hover:bg-card-hover"
        style={{
          boxShadow: "inset 0 0 40px rgba(232,148,58,0.04)",
        }}
      >
        <span className="font-display text-sm leading-tight text-cream-warm group-hover:text-amber-light md:text-base">
          {tool.name}
        </span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="text-center font-display text-4xl text-cream-warm md:text-5xl">
          Welcome{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-3 text-center font-serif text-base italic text-amber-light">
          Your family's story awaits
        </p>

        {isFree && (
          <div className="mt-8 flex justify-center">
            <Link
              to="/upgrade"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-honey to-honey-dim px-8 py-4 text-sm font-semibold uppercase tracking-widest text-[#1a1208] shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(232,148,58,0.2)]"
            >
              Upgrade to Legacy — $29.99
            </Link>
          </div>
        )}

        <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {freeTools.map((tool) => renderTool(tool, false))}
          {legacyTools.map((tool) => renderTool(tool, isFree))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
