import { usePageMeta } from "@/hooks/usePageMeta";

const FamilyTree = () => {
  usePageMeta({
    title: "Create Your Family Tree — AncestorsQR",
    description: "Build your visual bloodline tree. See your ancestors across generations, names, dates, and places.",
  });

  return (
    <div className="min-h-screen bg-background px-6 py-24 text-center">
      <h1 className="font-display text-4xl text-cream-warm">Create Your Family Tree</h1>
      <p className="mt-4 font-serif italic text-amber-light">Coming soon</p>
    </div>
  );
};

export default FamilyTree;
