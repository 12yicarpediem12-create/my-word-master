"use client";

const AUTH_COOKIE_NAME = "wm-access-token";

export function setAuthAccessTokenCookie(accessToken: string, expiresAt?: number | null) {
  if (typeof document === "undefined") return;

  const nowInSeconds = Math.floor(Date.now() / 1000);
  const maxAge = expiresAt ? Math.max(expiresAt - nowInSeconds, 0) : 3600;
  const secureAttr = window.location.protocol === "https:" ? "; Secure" : "";

  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(accessToken)}; Path=/; SameSite=Lax; Max-Age=${maxAge}${secureAttr}`;
}

export function clearAuthAccessTokenCookie() {
  if (typeof document === "undefined") return;
  const secureAttr = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; SameSite=Lax; Max-Age=0${secureAttr}`;
}
