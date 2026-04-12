/**
 * Extract the username from a portfolio subdomain hostname.
 *
 * e.g. "jeremiaef.mixmomnt.com" -> "jeremiaef"
 *      "app.mixmomnt.com"        -> null
 *      "mixmomnt.com"            -> null
 *      "localhost:3000"          -> null
 *      "foo.localhost:3000"      -> "foo"
 */
export function extractUsername(hostname: string): string | null {
  const host = hostname.replace(/:\d+$/, "");
  const parts = host.split(".");

  // Single segment (e.g. "localhost", "mysite.com") — not a subdomain
  if (parts.length === 1) return null;

  // If there are more than 2 parts, the first segment is the username
  // e.g. "foo.bar.baz.com" -> first segment is the username/subdomain
  if (parts.length >= 2) {
    return parts[0];
  }

  return null;
}

/**
 * Returns true when the hostname represents a portfolio subdomain
 * (i.e. any subdomain that is not an app/public route).
 *
 * e.g. "jeremiaef.mixmomnt.com" -> true
 *      "app.mixmomnt.com"        -> false
 *      "mixmomnt.com"           -> false
 *      "localhost:3000"         -> false (not a subdomain)
 */
export function isPortfolioSubdomain(hostname: string): boolean {
  const host = hostname.replace(/:\d+$/, "");
  const parts = host.split(".");

  // Needs at least 3 parts for a valid portfolio subdomain on a real domain:
  // username.mixmomnt.com
  // For localhost, any non-top-level segment that isn't "app" is a portfolio subdomain:
  // foo.localhost:3000
  if (parts.length < 2) return false;

  const [first, second, third] = parts;
  const TLD_INDEX = 2; // TLD is at index 2 in "username.domain.com"
  const isRealDomain = parts.length >= TLD_INDEX + 1;

  if (isRealDomain) {
    // "username.mixmomnt.com" -> third = "com" (real domain)
    // "username.localhost" -> third = undefined (not a real TLD)
    const tld = parts[TLD_INDEX];
    const isKnownTld =
      tld === "com" ||
      tld === "dev" ||
      tld === "io" ||
      tld === "org" ||
      tld === "net" ||
      tld === "app";

    if (isKnownTld) {
      // username.mixmomnt.com -> portfolio subdomain if first is not app/www
      return first !== "app" && first !== "www";
    }
  }

  // localhost / unknown TLD: single non-reserved segment = portfolio subdomain
  // e.g. "foo.localhost:3000" -> first="foo", portfolio subdomain = true
  // "app.localhost:3000" -> first="app", portfolio subdomain = false
  return first !== "app" && first !== "localhost";
}
