/**
 * Validate a redirect destination is internal (no open redirect vulnerability).
 * Returns the destination if safe, or a default if not.
 */
export function safeRedirectDestination(destination: unknown, defaultTo = "/engines"): string {
  if (typeof destination !== "string") return defaultTo;

  const trimmed = destination.trim();

  // Block absolute URLs (http://, https://, //)
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("//")) {
    return defaultTo;
  }

  // Allow relative paths starting with /
  if (!trimmed.startsWith("/")) {
    return defaultTo;
  }

  // Block common encoded bypass attempts
  if (trimmed.includes("%2F%2F") || // encoded //
    trimmed.includes("%3A%2F%2F") // encoded ://
  ) {
    return defaultTo;
  }

  // Must be an internal absolute path
  return trimmed;
}
