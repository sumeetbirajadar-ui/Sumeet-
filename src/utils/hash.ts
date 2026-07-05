/** SHA-256 via the standard Web Crypto API — available in both browsers and
 * Android WebViews, no native plugin needed. Used only for the local
 * passcode lock (not for anything security-critical over a network). */
export async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
