import { usePageMeta } from "@/hooks/usePageMeta";

const Novel = () => {
  usePageMeta({
    title: "Your Digital Novel — AncestorsQR",
    description: "Read your family's full story as a beautifully written digital novel. Every chapter of your bloodline, brought to life.",
  });

  return (
    <div className="min-h-screen bg-background px-6 py-24 text-center">
      <h1 className="font-display text-4xl text-cream-warm">Your digital novel</h1>
      <p className="mt-4 font-serif italic text-amber-light">Coming soon</p>
    </div>
  );
};

export default Novel;
