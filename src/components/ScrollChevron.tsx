/**
 * Subtle pulsing gold chevron at the bottom of a hero/centered section,
 * indicating that more content sits below the fold.
 */
const ScrollChevron = ({ className = "" }: { className?: string }) => {
  const handleClick = () => {
    window.scrollBy({ top: window.innerHeight * 0.7, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Scroll for more"
      className={`absolute bottom-6 left-1/2 -translate-x-1/2 animate-chevron-pulse cursor-pointer bg-transparent p-2 ${className}`}
      style={{ color: "#d4a04a" }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
};

export default ScrollChevron;
