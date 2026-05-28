import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const tools = [
  { name: "Surname Lookup", to: "/tools/surname" },
  { name: "Meet Your Ancestor", to: "/tools/ancestor" },
  { name: "The 1700s You", to: "/tools/1700s" },
  { name: "Motto Generator", to: "/tools/motto" },
  { name: "Bloodline Quiz", to: "/tools/quiz" },
  { name: "Chat With Your Ancestor", to: "/tools/chat" },
  { name: "Forge Your Crest", to: "/tools/crest" },
  { name: "Get Your Family Story", to: "/tools/story" },
  { name: "Create Your Family Tree", to: "/tools/tree" },
  { name: "Collect Your History From a Family Member", to: "/tools/collect" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState<string>("");
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
        .select("first_name")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!active) return;
      setFirstName(data?.first_name ?? "");
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

  return (
    <div className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="text-center font-display text-4xl text-cream-warm md:text-5xl">
          Welcome{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-3 text-center font-serif text-base italic text-amber-light">
          Your family's story awaits
        </p>

        <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {tools.map((tool) => (
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
