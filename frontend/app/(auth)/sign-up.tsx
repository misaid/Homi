// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth, useSignUp } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
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
  // If already signed in, do not render the form
  if ((useAuth() as any)?.isSignedIn) return <Redirect href="/(tabs)/home" />;
  const colorScheme = useColorScheme();
  const pageBg = Colors[colorScheme ?? "light"].pageBackground;
  const cardBg = Colors[colorScheme ?? "light"].card;
  const border = Colors[colorScheme ?? "light"].border;
  const tint = Colors[colorScheme ?? "light"].tint;
  const text = Colors[colorScheme ?? "light"].text;
  const muted = Colors[colorScheme ?? "light"].mutedText;

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
        // Let render-time redirect take over
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
            // Let render-time redirect take over
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
    <SafeAreaView style={[styles.container, { backgroundColor: pageBg }]}>
      <View style={styles.centerWrap}>
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          <View style={styles.brandRow}>
            <View style={[styles.brandIcon, { backgroundColor: tint }]} />
            <Text style={[styles.brandName, { color: text }]}>Homi</Text>
          </View>
          <Text style={[styles.title, { color: text }]}>Create account</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {stage === "form" ? (
            <>
              <View
                style={[
                  styles.inputRow,
                  { borderColor: border, backgroundColor: cardBg },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={muted}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email address"
                  placeholderTextColor={muted}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  style={[styles.input, { color: text }]}
                />
              </View>
              <View
                style={[
                  styles.inputRow,
                  { borderColor: border, backgroundColor: cardBg },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={muted}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor={muted}
                  secureTextEntry
                  style={[styles.input, { color: text }]}
                />
              </View>
              <Pressable
                onPress={onCreateAccount}
                disabled={!canSubmitForm || submitting}
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: tint,
                    opacity: !canSubmitForm || submitting ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={styles.primaryBtnText}>
                  {submitting ? "Creating account..." : "Create account"}
                </Text>
              </Pressable>
              <View style={styles.switchRow}>
                <Text style={{ color: muted }}>Have an account? </Text>
                <Pressable onPress={() => router.push("/(auth)/sign-in")}>
                  <Text style={[styles.link, { color: tint }]}>Sign in</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={{ color: muted }}>We sent a 6 digit code to</Text>
              <Text style={{ color: text, fontWeight: "700" }}>{email}</Text>
              <View
                style={[
                  styles.inputRow,
                  { borderColor: border, backgroundColor: cardBg },
                ]}
              >
                <Ionicons
                  name="key-outline"
                  size={18}
                  color={muted}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="6 digit code"
                  placeholderTextColor={muted}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[styles.input, { color: text }]}
                />
              </View>
              <Pressable
                onPress={onVerify}
                disabled={!canSubmitCode || submitting}
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: tint,
                    opacity: !canSubmitCode || submitting ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={styles.primaryBtnText}>
                  {submitting ? "Verifying..." : "Verify"}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  brandIcon: { width: 28, height: 28, borderRadius: 8 },
  brandName: { fontSize: 18, fontWeight: "800" },
  title: { fontSize: 22, fontWeight: "800", marginTop: 4 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
  },
  input: { flex: 1, paddingVertical: 6 },
  primaryBtn: {
    marginTop: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },
  error: { color: "#b00020", textAlign: "center", marginTop: 4 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    justifyContent: "center",
  },
  link: { fontWeight: "800" },
});
