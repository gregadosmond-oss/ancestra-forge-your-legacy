import { useParams } from "react-router-dom";

const JourneyPlaceholder = () => {
  const { stop } = useParams();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-cream-warm">
      <div className="text-center">
        <p className="font-sans text-[10px] uppercase tracking-[4px] text-amber-dim">
          STOP {stop ?? "?"} / 06
        </p>
        <h1 className="mt-4 font-display text-5xl">Stop {stop} placeholder</h1>
      </div>
    </div>
  );
};

export default JourneyPlaceholder;
