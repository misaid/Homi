import { useAuth } from "@clerk/clerk-expo";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export function useApi() {
  const { getToken } = useAuth();

  async function request<T = unknown>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const token = await getToken();
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {}

    if (!res.ok)
      throw new Error(data?.error || data?.message || res.statusText);
    return data as T;
  }

  return {
    get: <T>(p: string) => request<T>(p),
    post: <T>(p: string, body?: unknown) =>
      request<T>(p, { method: "POST", body: JSON.stringify(body) }),
    put: <T>(p: string, body?: unknown) =>
      request<T>(p, { method: "PUT", body: JSON.stringify(body) }),
    patch: <T>(p: string, body?: unknown) =>
      request<T>(p, { method: "PATCH", body: JSON.stringify(body) }),
    del: <T>(p: string) => request<T>(p, { method: "DELETE" }),
  };
}
