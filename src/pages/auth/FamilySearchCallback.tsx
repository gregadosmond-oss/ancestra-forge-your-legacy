import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

type Status =
  | { kind: "loading" }
  | { kind: "success" }
  | { kind: "error"; message: string };

const FamilySearchCallback = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");
    const oauthError = params.get("error");
    const errorDescription = params.get("error_description");

    if (oauthError) {
      setStatus({
        kind: "error",
        message: errorDescription || oauthError,
      });
      return;
    }

    const storedState = localStorage.getItem("fs_oauth_state");
    if (!storedState || storedState !== state) {
      setStatus({ kind: "error", message: "Invalid OAuth state" });
      return;
    }

    if (!code) {
      setStatus({ kind: "error", message: "Missing authorization code" });
      return;
    }

    (async () => {
      const { data, error } = await supabase.functions.invoke(
        "auth-familysearch-callback",
        { body: { code, state } },
      );

      if (error || !data?.success) {
        const message =
          data?.error ||
          error?.message ||
          "Could not connect to FamilySearch";
        setStatus({ kind: "error", message });
        return;
      }

      localStorage.removeItem("fs_oauth_state");
      setStatus({ kind: "success" });
      setTimeout(() => {
        navigate("/journey/3?fs_connected=true");
      }, 1500);
    })();
  }, [params, navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: "#0d0a07" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full text-center"
      >
        {status.kind === "loading" && (
          <>
            <div
              className="mx-auto mb-8 h-10 w-10 rounded-full border-2 animate-spin"
              style={{
                borderColor: "rgba(212,160,74,0.2)",
                borderTopColor: "#d4a04a",
              }}
            />
            <h1
              className="text-3xl mb-3"
              style={{
                fontFamily: "'Libre Caslon Text', serif",
                fontStyle: "italic",
                color: "#e8b85c",
              }}
            >
              Connecting your bloodline…
            </h1>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                color: "#8a7e6e",
              }}
            >
              One moment while we link your FamilySearch account.
            </p>
          </>
        )}

        {status.kind === "success" && (
          <>
            <h1
              className="text-3xl mb-3"
              style={{
                fontFamily: "'Libre Caslon Text', serif",
                fontStyle: "italic",
                color: "#e8b85c",
              }}
            >
              Connected — opening your tree…
            </h1>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                color: "#d0c4b4",
              }}
            >
              Redirecting to your journey.
            </p>
          </>
        )}

        {status.kind === "error" && (
          <div
            className="rounded-2xl p-8"
            style={{
              backgroundColor: "#1a1510",
              border: "1px solid #3d3020",
            }}
          >
            <h1
              className="text-2xl mb-4"
              style={{
                fontFamily: "'Libre Caslon Display', serif",
                color: "#f0e8da",
              }}
            >
              Something went wrong
            </h1>
            <p
              className="mb-6"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                color: "#d0c4b4",
              }}
            >
              {status.message}
            </p>
            <Link
              to="/journey/3"
              className="inline-block uppercase tracking-widest font-semibold"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "13px",
                letterSpacing: "1.5px",
                background: "linear-gradient(135deg, #e8943a, #c47828)",
                color: "#1a1208",
                padding: "16px 40px",
                borderRadius: "60px",
              }}
            >
              Try again
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default FamilySearchCallback;
