import { useEffect, useState } from "react";

type Props = {
  text: string;
  msPerChar?: number;
  onDone?: () => void;
  className?: string;
};

const TypewriterText = ({
  text,
  msPerChar = 12,
  onDone,
  className = "",
}: Props) => {
  const [charCount, setCharCount] = useState(0);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (skipped) {
      setCharCount(text.length);
      onDone?.();
      return;
    }
    if (charCount >= text.length) {
      onDone?.();
      return;
    }
    const t = setTimeout(() => setCharCount((c) => c + 1), msPerChar);
    return () => clearTimeout(t);
  }, [charCount, text, msPerChar, skipped, onDone]);

  return (
    <p
      onClick={() => setSkipped(true)}
      className={`cursor-pointer whitespace-pre-wrap ${className}`}
    >
      {text.slice(0, charCount)}
      {charCount < text.length && <span className="animate-pulse">▌</span>}
    </p>
  );
};

export default TypewriterText;
