import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRY_LABELS } from "@/lib/countries";

const Signup = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [showCountryList, setShowCountryList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const countries = useMemo(
    () =>
      Object.entries(COUNTRY_LABELS)
        .map(([code, name]) => ({ code, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => c.name.toLowerCase().includes(q));
  }, [countries, countryQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!country) {
      setError("Please select your country of origin.");
      return;
    }

    setSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (signUpError) {
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    let userId = data.user?.id ?? null;

    // If no session (email confirmation required), try to sign in to obtain auth context for upsert.
    if (!data.session) {
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError || !signInData.user) {
        setError(
          "Account created. Please check your email to confirm, then sign in."
        );
        setSubmitting(false);
        return;
      }
      userId = signInData.user.id;
    }

    if (!userId) {
      setError("Could not create your profile. Please try signing in.");
      setSubmitting(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          email: email.trim(),
          first_name: firstName.trim(),
          surname: lastName.trim(),
          country_of_origin: COUNTRY_LABELS[country] ?? country,
          tier: "free",
        },
        { onConflict: "id" }
      );

    if (profileError) {
      setError(profileError.message);
      setSubmitting(false);
      return;
    }

    navigate("/dashboard");
  };

  const inputClass =
    "w-full rounded-[14px] border border-amber-dim/30 bg-input px-5 py-4 font-sans text-sm text-cream-warm placeholder:text-text-dim focus:border-amber focus:outline-none";

  return (
    <div className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto w-full max-w-md rounded-[22px] border border-amber-dim/25 bg-card p-8">
        <h1 className="text-center font-display text-3xl text-cream-warm">
          Create your account
        </h1>
        <p className="mt-2 text-center font-serif text-sm italic text-text-dim">
          Begin preserving your family's story
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            required
            maxLength={50}
            className={inputClass}
          />
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            required
            maxLength={50}
            className={inputClass}
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className={inputClass}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min. 8 characters)"
            required
            minLength={8}
            className={inputClass}
          />

          <div className="relative">
            <input
              type="text"
              value={
                showCountryList
                  ? countryQuery
                  : country
                  ? COUNTRY_LABELS[country] ?? ""
                  : countryQuery
              }
              onChange={(e) => {
                setCountryQuery(e.target.value);
                setCountry("");
                setShowCountryList(true);
              }}
              onFocus={() => {
                setShowCountryList(true);
                if (country) setCountryQuery("");
              }}
              onBlur={() => {
                // delay so click on option registers
                setTimeout(() => setShowCountryList(false), 150);
              }}
              placeholder="Country of origin"
              required={!country}
              className={inputClass}
              autoComplete="off"
            />
            {showCountryList && filteredCountries.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-[14px] border border-amber-dim/30 bg-card shadow-lg">
                {filteredCountries.slice(0, 100).map((c) => (
                  <li key={c.code}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setCountry(c.code);
                        setCountryQuery("");
                        setShowCountryList(false);
                      }}
                      className="block w-full px-5 py-2 text-left font-sans text-sm text-cream-soft hover:bg-amber/[0.08]"
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <p className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-4 py-3 font-sans text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-pill px-8 py-4 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #e8943a, #c47828)",
              color: "#1a1208",
            }}
          >
            {submitting ? "Creating account…" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
