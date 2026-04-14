type Props = { children: React.ReactNode; className?: string };

const SectionLabel = ({ children, className = "" }: Props) => (
  <p
    className={`font-sans text-[10px] uppercase tracking-[4px] text-amber-dim ${className}`}
  >
    {children}
  </p>
);

export default SectionLabel;
