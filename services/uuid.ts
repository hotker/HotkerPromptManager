/**
 * Generates a UUID v4 string.
 * Falls back to Math.random() if crypto.randomUUID() is not available (e.g., in non-HTTPS contexts).
 */
export function generateUUID(): string {
  // Try native crypto API first (available in HTTPS/localhost)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback for non-secure contexts (http://ip:port)
  // Compliant with UUID v4 spec (mostly)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
