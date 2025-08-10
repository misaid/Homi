import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";

const BASE_URL: string | undefined =
  (Constants?.expoConfig?.extra as { API_URL?: string } | undefined)?.API_URL ??
  // Fallback for classic manifest in older Expo runtimes
  (Constants as any)?.manifest?.extra?.API_URL ??
  "http://localhost:3000";

export function useApi() {
  const { getToken } = useAuth();

  async function request<T = unknown>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const token = await getToken();
    const body = (init as any).body;
    const isFormData =
      typeof FormData !== "undefined" && body instanceof FormData;
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(init.headers || ({} as any)),
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
      request<T>(p, {
        method: "POST",
        body:
          typeof FormData !== "undefined" && body instanceof FormData
            ? (body as any)
            : JSON.stringify(body),
      }),
    put: <T>(p: string, body?: unknown) =>
      request<T>(p, { method: "PUT", body: JSON.stringify(body) }),
    patch: <T>(p: string, body?: unknown) =>
      request<T>(p, { method: "PATCH", body: JSON.stringify(body) }),
    del: <T>(p: string) => request<T>(p, { method: "DELETE" }),
  };
}
