import { usePageMeta } from "@/hooks/usePageMeta";

const FamilyStory = () => {
  usePageMeta({
    title: "Get Your Family Story — AncestorsQR",
    description: "Read your full family story — AI-written chapters tracing your surname through history, migration, and legacy.",
  });

  return (
    <div className="min-h-screen bg-background px-6 py-24 text-center">
      <h1 className="font-display text-4xl text-cream-warm">Get Your Family Story</h1>
      <p className="mt-4 font-serif italic text-amber-light">Coming soon</p>
    </div>
  );
};

export default FamilyStory;
