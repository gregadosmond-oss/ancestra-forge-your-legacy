import { usePageMeta } from "@/hooks/usePageMeta";

const CollectHistory = () => {
  usePageMeta({
    title: "Collect Your Family History — AncestorsQR",
    description: "Gather stories, photos, and memories from your family. Preserve your bloodline before the details fade.",
  });

  return (
    <div className="min-h-screen bg-background px-6 py-24 text-center">
      <h1 className="font-display text-4xl text-cream-warm">Collect Your History From a Family Member</h1>
      <p className="mt-4 font-serif italic text-amber-light">Coming soon</p>
    </div>
  );
};

export default CollectHistory;
