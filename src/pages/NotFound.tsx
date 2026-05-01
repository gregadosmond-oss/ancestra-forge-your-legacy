import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";

const NotFound = () => {
  usePageMeta({ title: "Page Not Found | AncestorsQR" });
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background">
      <img src="/hero.jpg" alt="" className="pointer-events-none fixed inset-0 h-full w-full object-cover" style={{ objectPosition: "center 30%", opacity: 0.38, filter: "saturate(0.7) brightness(0.95)" }} />
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-2 text-xl text-muted-foreground">This branch of the family tree doesn't exist.</p>
        <p className="mb-6 text-base italic text-muted-foreground">But yours does — and it's waiting to be discovered.</p>
        <a
          href="/journey/1"
          className="inline-block rounded-full px-10 py-4 text-xs font-semibold uppercase tracking-[1.5px] transition-transform hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #e8943a, #c47828)",
            color: "#1a1208",
            boxShadow: "0 12px 40px rgba(232,148,58,0.2)",
          }}
        >
          Begin Your Journey →
        </a>
        <div className="mt-6">
          <a href="/" className="text-sm text-muted-foreground underline hover:text-primary/90">
            or return home
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
