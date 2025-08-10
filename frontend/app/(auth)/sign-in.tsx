// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { useAuth, useClerk, useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function SignInScreen() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { setActive } = useClerk();
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(
    () =>
      email.trim().length > 3 && email.includes("@") && password.length >= 6,
    [email, password]
  );

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) router.replace("/(tabs)/home");
  }, [isLoaded, isSignedIn, router]);

  async function onSignIn() {
    if (!isSignInLoaded || !canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await signIn!.create({ identifier: email.trim() });
      const res = await signIn!.attemptFirstFactor({
        strategy: "password",
        password: password.trim(),
      });
      if (res.status === "complete" && res.createdSessionId) {
        await setActive?.({ session: res.createdSessionId });
        router.replace("/(tabs)/home");
        // Fallbacks to ensure navigation takes effect immediately
        setTimeout(() => {
          try {
            router.replace("/(tabs)/home");
          } catch {}
        }, 0);
        if (typeof window !== "undefined") {
          setTimeout(() => {
            try {
              if (window.location) window.location.assign("/");
            } catch {}
          }, 400);
        }
        return;
      }
      setError("Sign in not complete. Try again.");
    } catch (e: any) {
      const msg: string = e?.errors?.[0]?.message || e?.message || String(e);
      const lower = msg.toLowerCase();
      if (
        lower.includes("not yet valid") ||
        lower.includes("issued in the future") ||
        lower.includes("clock skew") ||
        lower.includes("not valid yet")
      ) {
        setError(
          "Your device time may be incorrect. Enable automatic date and time, then try again."
        );
      } else if (msg.includes("Couldn't find your account")) {
        setError("We couldn't find that account. You can create one.");
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sign in</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          style={styles.input}
        />
        <Button
          title={submitting ? "Signing in..." : "Sign in"}
          onPress={onSignIn}
          disabled={!canSubmit || submitting}
        />
        <View style={styles.switchRow}>
          <Text>New here? </Text>
          <Pressable onPress={() => router.push("/(auth)/sign-up")}>
            <Text style={styles.link}>Create account</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 8 },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  error: { color: "#b00020", textAlign: "center" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  link: { color: "#2563eb", fontWeight: "600" },
});
