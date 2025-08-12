import { useApi } from "@/lib/api";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

export function useRegisterPushToken() {
  const api = useApi();
  const [token, setToken] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      let finalStatus = status;
      if (finalStatus !== "granted") {
        const req = await Notifications.requestPermissionsAsync();
        finalStatus = req.status;
      }
      if (finalStatus !== "granted") return;
      try {
        const exp = await Notifications.getExpoPushTokenAsync();
        if (mounted) setToken(exp.data);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    tokenRef.current = token;
    (async () => {
      try {
        await api.post("/api/v1/device_tokens", {
          token,
          platform: Platform.OS === "ios" ? "ios" : "android",
        });
      } catch {}
    })();
    return () => {
      const t = tokenRef.current;
      if (!t) return;
      (async () => {
        try {
          await api.del(`/api/v1/device_tokens/${encodeURIComponent(t)}`);
        } catch {}
      })();
    };
  }, [token]);

  return token;
}
