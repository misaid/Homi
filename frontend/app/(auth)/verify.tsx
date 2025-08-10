// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { useAuth, useSignUp } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; pw?: string }>();
  const { setActive } = useAuth();
  const { signUp, isLoaded } = useSignUp();

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = useMemo(() => code.trim().length >= 6, [code]);

  useEffect(() => {
    // no-op: screen works even if email param missing
  }, [params]);

  async function verify() {
    if (!isLoaded || !canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await signUp!.attemptEmailAddressVerification({
        code: code.trim(),
      });
      if (res.status === "complete") {
        const sessionId =
          res.createdSessionId || (signUp as any)?.createdSessionId;
        if (sessionId && setActive) {
          await setActive({ session: sessionId });
        }
        router.replace("/(tabs)/home");
        return;
      }
      setError(
        "Verification not complete. Please check the code and try again."
      );
    } catch (err: any) {
      console.warn("sign-up verify error", err);
      const msg = `${err?.errors?.[0]?.message || err}`;
      // If the verification is already completed, try to recover by navigating
      // back to sign-in with prefilled email so the user can sign in.
      if (msg.toLowerCase().includes("already") && params.email) {
        router.replace({
          pathname: "/(auth)/sign-in",
          params: { email: params.email },
        });
        return;
      }
      setError(err?.errors?.[0]?.message || "Verification failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    if (!isLoaded) return;
    try {
      await signUp!.prepareEmailAddressVerification({ strategy: "email_code" });
    } catch (err) {
      console.warn("resend sign-up code error", err);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Verify your email</Text>
        {params.email ? (
          <Text style={styles.subtitle}>We sent a code to {params.email}</Text>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="6-digit code"
          keyboardType="number-pad"
          maxLength={6}
          style={styles.input}
        />
        <Button
          title={submitting ? "Verifying..." : "Verify"}
          onPress={verify}
          disabled={!canSubmit || submitting || !isLoaded}
        />
        <View style={styles.switchRow}>
          <Text onPress={resend} style={styles.link}>
            Resend code
          </Text>
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
  title: { fontSize: 20, fontWeight: "600" },
  subtitle: { color: "#555" },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  switchRow: { flexDirection: "row", gap: 8 },
  link: { color: "#2563eb", fontWeight: "600" },
});
