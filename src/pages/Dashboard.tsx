import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Tool = { name: string; to: string; key: string };

const freeTools: Tool[] = [
  { name: "Surname Lookup", to: "/tools/surname", key: "surname" },
  { name: "Meet Your Ancestor", to: "/tools/ancestor", key: "ancestor" },
  { name: "The 1700s You", to: "/tools/1700s", key: "1700s" },
  { name: "Motto Generator", to: "/tools/motto", key: "motto" },
  { name: "Bloodline Quiz", to: "/tools/quiz", key: "quiz" },
];

const legacyTools: Tool[] = [
  { name: "Chat With Your Ancestor", to: "/tools/chat", key: "chat" },
  { name: "Forge Your Crest", to: "/tools/crest", key: "crest" },
  { name: "Get Your Family Story", to: "/tools/story", key: "story" },
  { name: "Create Your Family Tree", to: "/tools/tree", key: "tree" },
  { name: "Collect Your History From a Family Member", to: "/tools/collect", key: "collect" },
];

const TOTAL = 10;

const Dashboard = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState<string>("");
  const [tier, setTier] = useState<string>("free");
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/login", { replace: true });
        return;
      }
      const uid = session.user.id;
      const [{ data: profile }, { data: completions }] = await Promise.all([
        supabase.from("profiles").select("first_name, tier").eq("id", uid).maybeSingle(),
        supabase.from("tool_completions").select("tool_key").eq("user_id", uid),
      ]);
      if (!active) return;
      setFirstName(profile?.first_name ?? "");
      setTier(profile?.tier ?? "free");
      setCompleted(new Set((completions ?? []).map((c) => c.tool_key)));
      setDataReady(true);
    })();
    return () => { active = false; };
  }, [navigate]);


  const isFree = dataReady && tier === "free";
  const completedCount = completed.size;
  const progressPct = (completedCount / TOTAL) * 100;


  const renderTool = (tool: Tool, locked: boolean) => {
    const isDone = completed.has(tool.key);

    if (locked) {
      return (
        <div key={tool.to} className="flex flex-col items-center gap-2">
          <div
            className="relative flex aspect-square w-full flex-col items-center justify-center rounded-full border border-amber-dim/10 bg-card/40 p-4 text-center"
            style={{ boxShadow: "inset 0 0 40px rgba(232,148,58,0.02)" }}
          >
            {isDone && (
              <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md ring-2 ring-background">
                <Check size={14} strokeWidth={3} />
              </span>
            )}
            <Lock className="mb-2 text-text-dim/40" size={18} />
            <span className="font-display text-sm leading-tight text-text-dim/40 md:text-base">
              {tool.name}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div key={tool.to} className="flex flex-col items-center gap-2">
        <Link
          to={tool.to}
          className="group relative flex aspect-square w-full flex-col items-center justify-center rounded-full border border-amber-dim/30 bg-card p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-amber hover:bg-card-hover"
          style={{ boxShadow: "inset 0 0 40px rgba(232,148,58,0.04)" }}
        >
          {isDone && (
            <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md ring-2 ring-background">
              <Check size={14} strokeWidth={3} />
            </span>
          )}
          <span className="font-display text-sm leading-tight text-cream-warm group-hover:text-amber-light md:text-base">
            {tool.name}
          </span>
        </Link>
        {isDone && (
          <span className="text-[10px] uppercase tracking-widest text-emerald-500/80">
            Completed
          </span>
        )}
      </div>
    );
  };

  const allTools = [...freeTools, ...legacyTools];

  const renderSkeletonTool = (tool: Tool) => (
    <div key={tool.to} className="flex flex-col items-center gap-2">
      <div
        className="relative flex aspect-square w-full animate-pulse flex-col items-center justify-center rounded-full border border-amber-dim/10 bg-card/40 p-4 text-center"
        style={{ boxShadow: "inset 0 0 40px rgba(232,148,58,0.02)" }}
      >
        <span className="font-display text-sm leading-tight text-text-dim/30 md:text-base">
          {tool.name}
        </span>
      </div>
      <span className="h-4 w-20 animate-pulse rounded-full bg-card/60" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="text-center font-display text-4xl text-cream-warm md:text-5xl">
          {dataReady ? (
            <>Welcome{firstName ? `, ${firstName}` : ""}</>
          ) : (
            <span className="mx-auto inline-block h-10 w-64 animate-pulse rounded-md bg-card/60 align-middle" />
          )}
        </h1>
        <p className="mt-3 text-center font-serif text-base italic text-amber-light">
          Your family's story awaits
        </p>

        <div className="mx-auto mt-10 max-w-xl">
          <div className="mb-2 flex items-center justify-between font-sans text-xs uppercase tracking-widest text-text-dim">
            {dataReady ? (
              <>
                <span>{completedCount} of {TOTAL} tools completed</span>
                <span className="text-amber-light">{Math.round(progressPct)}%</span>
              </>
            ) : (
              <>
                <span className="h-3 w-40 animate-pulse rounded-full bg-card/60" />
                <span className="h-3 w-10 animate-pulse rounded-full bg-card/60" />
              </>
            )}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full border border-amber-dim/20 bg-card">
            {dataReady && (
              <div
                className="h-full rounded-full bg-gradient-to-r from-honey to-honey-dim transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            )}
          </div>
        </div>

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
          {dataReady ? (
            <>
              {freeTools.map((tool) => renderTool(tool, false))}
              {legacyTools.map((tool) => renderTool(tool, isFree))}
            </>
          ) : (
            allTools.map((tool) => renderSkeletonTool(tool))
          )}
        </div>

        <div className="mt-16">
          {!dataReady ? (
            <div className="mx-auto h-48 max-w-xl animate-pulse rounded-2xl border border-amber-dim/20 bg-card/40" />
          ) : completedCount < TOTAL ? (
            <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-amber-dim/20 bg-card/60 px-8 py-10 text-center">
              <Lock className="mb-4 text-text-dim/50" size={28} />
              <h2 className="font-display text-xl text-cream-warm md:text-2xl">
                Unlock Your Novel
              </h2>
              <p className="mt-2 font-serif italic text-amber-light">
                Complete all 10 tools to unlock your digital novel
              </p>
              <p className="mt-4 font-sans text-xs uppercase tracking-widest text-text-dim">
                {completedCount} of {TOTAL} completed
              </p>
            </div>
          ) : (
            <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-amber-dim/20 bg-card/60 px-8 py-10 text-center">
              <h2 className="font-display text-2xl text-cream-warm md:text-3xl">
                Your novel is unlocked
              </h2>
              <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/novel"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-honey to-honey-dim px-8 py-4 text-sm font-semibold uppercase tracking-widest text-[#1a1208] shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(232,148,58,0.2)]"
                >
                  Read your novel
                </Link>
                <Link
                  to="/order-book"
                  className="inline-flex items-center justify-center rounded-full border border-amber-dim/30 bg-card/60 px-8 py-4 text-sm font-semibold uppercase tracking-widest text-amber-light transition-all duration-300 hover:border-amber hover:bg-card-hover"
                >
                  Order the physical book — $99
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
