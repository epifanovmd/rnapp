export function formatFullName(
  firstName?: string | null,
  lastName?: string | null,
  fallback = "Unknown",
): string {
  return [firstName, lastName].filter(Boolean).join(" ") || fallback;
}

export function formatInitials(
  firstName?: string | null,
  lastName?: string | null,
  fallback = "U",
): string {
  const parts = [firstName, lastName].filter(Boolean) as string[];

  return parts.length > 0
    ? parts
        .map(s => s[0])
        .join("")
        .toUpperCase()
    : fallback[0].toUpperCase();
}
