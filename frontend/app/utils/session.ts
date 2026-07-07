export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "PORTFOLIO_SEED";

  // 1. Check if this specific computer already has a session token
  let sessionId = localStorage.getItem("copilot_session_id");

  // 2. If it's a new computer/browser, bake a fresh one on the spot
  if (!sessionId) {
    // Generates a clean short token like "recruiter-a8f3b2"
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(3)))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    sessionId = `recruiter-${randomHex}`;
    localStorage.setItem("copilot_session_id", sessionId);
  }

  return sessionId;
}
