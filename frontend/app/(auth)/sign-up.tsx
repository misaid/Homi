// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { useAuth, useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Button,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function SignUpScreen() {
  const router = useRouter();
  const { setActive } = useAuth();
  const { signUp, isLoaded } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState<"form" | "verify">("form");

  const canSubmitForm = useMemo(
    () => email.trim().includes("@") && password.trim().length >= 6,
    [email, password]
  );
  const canSubmitCode = useMemo(() => code.trim().length >= 6, [code]);

  async function onCreateAccount() {
    if (!isLoaded || !canSubmitForm) return;
    setError(null);
    setSubmitting(true);
    try {
      await signUp!.create({
        emailAddress: email.trim(),
        password: password.trim(),
      });
      await signUp!.prepareEmailAddressVerification({ strategy: "email_code" });
      setStage("verify");
    } catch (e: any) {
      const msg: string = e?.errors?.[0]?.message || e?.message || String(e);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerify() {
    if (!isLoaded || !canSubmitCode) return;
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
      setError("Verification not complete. Check the code and try again.");
    } catch (e: any) {
      const msg: string = e?.errors?.[0]?.message || e?.message || String(e);
      if (
        msg.includes("already been verified") ||
        msg.toLowerCase().includes("already verified")
      ) {
        try {
          await signUp!.reload();
          const sid = (signUp as any)?.createdSessionId;
          if (sid && setActive) {
            await setActive({ session: sid });
            router.replace("/(tabs)/home");
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
        } catch {}
      } else if (
        msg.toLowerCase().includes("not yet valid") ||
        msg.toLowerCase().includes("issued in the future") ||
        msg.toLowerCase().includes("clock skew") ||
        msg.toLowerCase().includes("not valid yet")
      ) {
        setError(
          "Your device time may be incorrect. Enable automatic date and time, then try again."
        );
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create account</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {stage === "form" ? (
          <>
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
              title={submitting ? "Creating account..." : "Create account"}
              onPress={onCreateAccount}
              disabled={!canSubmitForm || submitting}
            />
            <View style={styles.switchRow}>
              <Text>Have an account? </Text>
              <Pressable onPress={() => router.push("/(auth)/sign-in")}>
                <Text style={styles.link}>Sign in</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text>We sent a 6 digit code to {email}</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="6 digit code"
              keyboardType="number-pad"
              maxLength={6}
              style={styles.input}
            />
            <Button
              title={submitting ? "Verifying..." : "Verify"}
              onPress={onVerify}
              disabled={!canSubmitCode || submitting}
            />
          </>
        )}
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
