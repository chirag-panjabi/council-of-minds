export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback if randomUUID throws for some reason
    }
  }
  
  // Fallback for insecure contexts (e.g. HTTP) where crypto.randomUUID is undefined
  // Uses crypto.getRandomValues if available, otherwise Math.random
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) => {
      const n = Number(c);
      return (n ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (n / 4)))).toString(16);
    });
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
