// Jugaad Vendor — session persisted client-side, credentials verified server-side.
// "Remember me" picks localStorage (survives browser restarts) vs sessionStorage
// (cleared when the tab closes) — a real behavioral difference, not decorative.

const STORAGE_KEY = 'jugaad_vendor';

export function saveSession(vendor, remember = true) {
  const store = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  store.setItem(STORAGE_KEY, JSON.stringify(vendor));
  other.removeItem(STORAGE_KEY);
}

export function getSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}
