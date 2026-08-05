const rawApiBase = (import.meta.env.VITE_API_BASE || "").trim();
const normalizedApiBase = rawApiBase.replace(/\/+$/, "");
const isViteDevOrigin = /(?:localhost|127\.0\.0\.1):5173/.test(
  normalizedApiBase,
);

export const API_BASE =
  !rawApiBase || isViteDevOrigin
    ? "/api"
    : normalizedApiBase.endsWith("/api")
      ? normalizedApiBase
      : `${normalizedApiBase}/api`;

async function parseJsonOrText(response) {
  const ct = response.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return await response.json();
  }
  const text = await response.text().catch(() => "");
  const url = response.url || "(unknown url)";
  throw new Error(
    `Expected JSON from ${url} but received: ${text.slice(0, 1000)}`,
  );
}

// Try primaryBase first (absolute), then fallbackPath (relative)
export async function fetchJson(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const primary = `${API_BASE}${normalizedPath}`;
  const fallback = normalizedPath.startsWith("/api/")
    ? normalizedPath
    : `/api${normalizedPath}`;

  // Try primary
  try {
    const res = await fetch(primary, { credentials: "include" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const primaryError = new Error(
        `Primary ${res.url || primary} failed: ${res.status} ${text.slice(0, 300)}`,
      );
      throw new Error(primaryError.message, {
        cause: primaryError,
      });
    }
    return await parseJsonOrText(res);
  } catch (errPrimary) {
    // Try fallback (relative)
    try {
      const res2 = await fetch(fallback, { credentials: "include" });
      if (!res2.ok) {
        const text = await res2.text().catch(() => "");
        throw new Error(
          `Fallback ${res2.url || fallback} failed: ${res2.status} ${text.slice(0, 300)}`,
        );
      }
      return await parseJsonOrText(res2);
    } catch (errFallback) {
      // prefer primary error message but include both
      const msg = `Primary error: ${errPrimary.message}; Fallback error: ${errFallback.message}`;
      const combinedError = new Error(msg);
      combinedError.cause = errFallback;
      throw combinedError;
    }
  }
}

const apiClient = { fetchJson, API_BASE };

export default apiClient;
