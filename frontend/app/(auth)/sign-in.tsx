// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth, useClerk, useSignIn } from "@clerk/clerk-expo";
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

export default function SignInScreen() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { setActive } = useClerk();
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();
  const colorScheme = useColorScheme();
  const pageBg = Colors[colorScheme ?? "light"].pageBackground;
  const cardBg = Colors[colorScheme ?? "light"].card;
  const border = Colors[colorScheme ?? "light"].border;
  const tint = Colors[colorScheme ?? "light"].tint;
  const text = Colors[colorScheme ?? "light"].text;
  const muted = Colors[colorScheme ?? "light"].mutedText;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(
    () =>
      email.trim().length > 3 && email.includes("@") && password.length >= 6,
    [email, password]
  );

  if (isLoaded && isSignedIn) return <Redirect href="/(tabs)/home" />;

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
        // Let render-time redirect take over without forcing a reload
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
          <Text style={[styles.title, { color: text }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: muted }]}>
            Sign in to continue
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}

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
            onPress={onSignIn}
            disabled={!canSubmit || submitting}
            style={[
              styles.primaryBtn,
              {
                backgroundColor: tint,
                opacity: !canSubmit || submitting ? 0.7 : 1,
              },
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {submitting ? "Signing in..." : "Sign in"}
            </Text>
          </Pressable>

          <View style={styles.switchRow}>
            <Text style={{ color: muted }}>New here? </Text>
            <Pressable onPress={() => router.push("/(auth)/sign-up")}>
              <Text style={[styles.link, { color: tint }]}>Create account</Text>
            </Pressable>
          </View>
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
  subtitle: { marginBottom: 8 },
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
