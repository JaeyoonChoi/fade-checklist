export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object") {
    const obj = e as Record<string, unknown>;
    if (typeof obj.message === "string") {
      const parts = [obj.message];
      if (typeof obj.details === "string" && obj.details) parts.push(obj.details);
      if (typeof obj.hint === "string" && obj.hint) parts.push(`(${obj.hint})`);
      return parts.join(" — ");
    }
    try {
      return JSON.stringify(e);
    } catch {
      return String(e);
    }
  }
  return String(e);
}
