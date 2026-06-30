// Jugaad auth — hardcoded demo credentials, session in localStorage

const DEMO_USER = {
  id: 1,
  name: "Bhoomi Gundecha",
  email: "bhoomigundecha@gmail.com",
  city: "Mumbai",
  style: "moderate",
};

const DEMO_PASSWORD = "bhoomi123";

export function loginWithEmail(email, password) {
  if (
    email.trim().toLowerCase() === DEMO_USER.email &&
    password === DEMO_PASSWORD
  ) {
    saveSession(DEMO_USER);
    return DEMO_USER;
  }
  throw new Error("Invalid email or password");
}

export function saveSession(buyer) {
  if (typeof window !== "undefined") {
    localStorage.setItem("jugaad_buyer", JSON.stringify(buyer));
  }
}

export function getSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("jugaad_buyer");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("jugaad_buyer");
  }
}
