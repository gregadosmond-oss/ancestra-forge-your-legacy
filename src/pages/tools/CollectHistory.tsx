import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMarkToolComplete } from "@/hooks/useMarkToolComplete";
import { usePageMeta } from "@/hooks/usePageMeta";

const RELATIONSHIPS = [
  { value: "grandparent", label: "Grandparent" },
  { value: "parent", label: "Parent" },
  { value: "aunt-uncle", label: "Aunt / Uncle" },
  { value: "sibling", label: "Sibling" },
  { value: "other", label: "Other" },
];

const PROMPTS: { key: string; label: string; placeholder: string }[] = [
  {
    key: "grewUp",
    label: "Where did they grow up?",
    placeholder: "Town, country, what the place was like…",
  },
  {
    key: "parentsNames",
    label: "What were their parents' names?",
    placeholder: "Names, occupations, anything you remember…",
  },
  {
    key: "earliestMemory",
    label: "What is their earliest memory?",
    placeholder: "The first thing they remember…",
  },
  {
    key: "familyStories",
    label: "What family stories did they tell?",
    placeholder: "Stories repeated at the dinner table, legends, lessons…",
  },
  {
    key: "favoriteMemory",
    label: "A favorite memory of them?",
    placeholder: "Your favorite moment with them…",
  },
];

type FormState = {
  relativeName: string;
  relationship: string;
  answers: Record<string, string>;
};

const emptyForm = (): FormState => ({
  relativeName: "",
  relationship: "",
  answers: Object.fromEntries(PROMPTS.map((p) => [p.key, ""])),
});

const CollectHistory = () => {
  usePageMeta({
    title: "Collect Your Family History — AncestorsQR",
    description:
      "Capture the memories of a parent, grandparent, or relative before they're lost. Save them to your family archive.",
  });

  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [justSavedName, setJustSavedName] = useState<string | null>(null);

  useMarkToolComplete("collect", savedCount > 0);

  function updateAnswer(key: string, value: string) {
    setForm((f) => ({ ...f, answers: { ...f.answers, [key]: value } }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    if (!form.relativeName.trim()) {
      toast.error("Their name is required");
      return;
    }
    if (!form.relationship) {
      toast.error("Please pick a relationship");
      return;
    }
    const anyAnswer = Object.values(form.answers).some((v) => v.trim().length > 0);
    if (!anyAnswer) {
      toast.error("Add at least one memory before saving");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("family_memories").insert({
        user_id: user.id,
        relative_name: form.relativeName.trim(),
        relationship: form.relationship,
        answers: form.answers,
      });
      if (error) throw error;
      setJustSavedName(form.relativeName.trim());
      setSavedCount((n) => n + 1);
      toast.success("Memory saved");
      // Refresh the AI-woven memories chapter in the background (fire & forget)
      supabase.functions
        .invoke("weave-memories-chapter", { body: { user_id: user.id } })
        .catch((e) => console.warn("weave-memories-chapter failed", e));

    } catch (err) {
      toast.error("Couldn't save", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  function addAnother() {
    setForm(emptyForm());
    setJustSavedName(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-background px-6 py-20">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <p className="font-sans text-[11px] uppercase tracking-[3px] text-amber-dim">
            Family History
          </p>
          <h1 className="mt-3 font-display text-4xl tracking-tight text-cream-warm sm:text-5xl">
            Collect their stories
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-serif italic text-amber-light">
            Capture a relative's memories before they're lost. One conversation
            can preserve a lifetime.
          </p>
        </div>

        {justSavedName && (
          <div className="mx-auto mt-10 max-w-xl rounded-[14px] border border-amber/40 bg-amber/[0.08] p-6 text-center">
            <p className="font-sans text-[11px] uppercase tracking-[2px] text-amber">
              ✓ Memory saved
            </p>
            <h2 className="mt-2 font-display text-2xl text-cream-warm">
              {justSavedName}'s story is safe.
            </h2>
            <p className="mt-2 font-serif text-sm italic text-cream-soft">
              {savedCount} {savedCount === 1 ? "relative" : "relatives"} captured so far.
            </p>
            <button
              type="button"
              onClick={addAnother}
              className="mt-5 rounded-pill px-8 py-3 font-sans text-[12px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300"
              style={{ background: "linear-gradient(135deg, #e8943a, #c47828)" }}
            >
              Add another relative
            </button>
          </div>
        )}

        {!justSavedName && (
          <form
            onSubmit={handleSubmit}
            className="mt-10 flex flex-col gap-5 rounded-[14px] border border-amber-dim/20 bg-card/50 p-6 backdrop-blur-sm sm:p-8"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Their name">
                <input
                  type="text"
                  required
                  value={form.relativeName}
                  onChange={(e) => setForm((f) => ({ ...f, relativeName: e.target.value }))}
                  placeholder="e.g. Grandma Rose"
                  className={inputClasses}
                />
              </Field>
              <Field label="Relationship to you">
                <select
                  required
                  value={form.relationship}
                  onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))}
                  className={inputClasses}
                >
                  <option value="">Choose one…</option>
                  {RELATIONSHIPS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="my-2 flex items-center gap-3">
              <div className="h-px flex-1 bg-amber-dim/20" />
              <span className="font-sans text-[10px] uppercase tracking-[2px] text-amber-dim">
                Their memories
              </span>
              <div className="h-px flex-1 bg-amber-dim/20" />
            </div>

            {PROMPTS.map((p) => (
              <Field key={p.key} label={p.label}>
                <textarea
                  rows={3}
                  value={form.answers[p.key]}
                  onChange={(e) => updateAnswer(p.key, e.target.value)}
                  placeholder={p.placeholder}
                  className={`${inputClasses} resize-y leading-relaxed`}
                />
              </Field>
            ))}

            <button
              type="submit"
              disabled={saving}
              className="mt-2 rounded-pill px-8 py-3 font-sans text-[12px] font-semibold uppercase tracking-[1.5px] text-primary-foreground transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #e8943a, #c47828)" }}
            >
              {saving ? "Saving…" : "Save this memory"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const inputClasses =
  "w-full rounded-[10px] border border-amber-dim/20 bg-bg-input/80 px-4 py-2.5 font-sans text-sm text-cream-soft placeholder:text-text-dim focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-sans text-[11px] uppercase tracking-[1.5px] text-amber-dim">
        {label}
      </span>
      {children}
    </label>
  );
}

export default CollectHistory;
