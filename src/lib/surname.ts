/**
 * Format a surname for display: first letter of each word uppercase, rest lowercase.
 * Examples: "osmond" → "Osmond", "MACDONALD" → "Macdonald", "van der berg" → "Van Der Berg".
 * Only changes casing — never alters the letters themselves.
 */
export function formatSurname(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""))
    .filter(Boolean)
    .join(" ");
}
