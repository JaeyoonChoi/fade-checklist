const STORAGE_KEY = "afterlife.session_id";

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") {
    throw new Error("getOrCreateSessionId는 클라이언트에서만 호출하세요.");
  }
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing && isUuid(existing)) return existing;
  const fresh = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, fresh);
  return fresh;
}

export function setSessionId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, id);
}

export function clearSessionId() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}
