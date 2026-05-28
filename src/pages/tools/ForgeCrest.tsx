import { usePageMeta } from "@/hooks/usePageMeta";

const ForgeCrest = () => {
  usePageMeta({
    title: "Forge Your Crest — AncestorsQR",
    description: "Design your custom family coat of arms with AI. Symbols, colors, and motto — forged for your bloodline.",
  });

  return (
    <div className="min-h-screen bg-background px-6 py-24 text-center">
      <h1 className="font-display text-4xl text-cream-warm">Forge Your Crest</h1>
      <p className="mt-4 font-serif italic text-amber-light">Coming soon</p>
    </div>
  );
};

export default ForgeCrest;
