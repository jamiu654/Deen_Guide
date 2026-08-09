const rawApiBase = (import.meta.env.VITE_API_BASE || "").trim();

const normalizedApiBase = rawApiBase.replace(/\/+$/, "");

export const API_BASE = normalizedApiBase
  ? normalizedApiBase.endsWith("/api")
    ? normalizedApiBase
    : `${normalizedApiBase}/api`
  : "/api";

async function parseJson(response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Server returned non JSON response: ${text.slice(0, 1000)}`
    );
  }

  return await response.json();
}

export async function fetchJson(path, options = {}) {
  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  const url = `${API_BASE}${normalizedPath}`;

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");

    throw new Error(
      `API request failed: ${response.status} ${response.statusText}. ` +
      `${text.slice(0, 500)}`
    );
  }

  return await parseJson(response);
}

const apiClient = {
  fetchJson,
  API_BASE,
};

export default apiClient;