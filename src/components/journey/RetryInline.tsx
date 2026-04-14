type Props = {
  /** Shown above the button. Short, warm, never alarming. */
  message?: string;
  onRetry: () => void;
};

const RetryInline = ({
  message = "The archives are still forging this.",
  onRetry,
}: Props) => (
  <div className="flex flex-col items-center gap-3 py-6">
    <p className="font-serif text-sm italic text-amber-dim">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="rounded-pill border border-amber-dim/40 bg-card/40 px-6 py-2 font-sans text-[11px] uppercase tracking-[2px] text-amber-light transition-colors hover:border-amber hover:text-amber"
    >
      Try again
    </button>
  </div>
);

export default RetryInline;
