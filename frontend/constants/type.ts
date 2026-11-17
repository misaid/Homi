// Homi type system. One quiet grotesque, Hanken Grotesk, carries everything:
// hierarchy comes from weight, size and tight tracking, not a second face.
//
// Web: one family name, weight chosen with fontWeight (the face comes from the
// Google Fonts <link> injected by loadBrandFonts()).
// Native: one family name per weight (loaded with useFonts in app/_layout.tsx);
// fontWeight is deliberately omitted so the platform does not fake-bold.
import { Platform, type TextStyle } from "react-native";

type Weight = 400 | 500 | 600 | 700 | 800;
/** Kept as a parameter so call sites say what the text is for; both map to Hanken Grotesk. */
type Kind = "display" | "body";

export const WEB_FAMILY = "'Hanken Grotesk', system-ui, -apple-system, 'Segoe UI', sans-serif";

const NATIVE_FAMILY: Record<Weight, string> = {
  400: "HankenGrotesk_400Regular",
  500: "HankenGrotesk_500Medium",
  600: "HankenGrotesk_600SemiBold",
  700: "HankenGrotesk_700Bold",
  800: "HankenGrotesk_800ExtraBold",
};

export function font(_kind: Kind, weight: Weight = 400): TextStyle {
  if (Platform.OS === "web") {
    return { fontFamily: WEB_FAMILY, fontWeight: String(weight) as TextStyle["fontWeight"] };
  }
  return { fontFamily: NATIVE_FAMILY[weight] };
}

/** Family for react-native-svg <Text>, which needs it set explicitly. */
export function svgFont(weight: 500 | 700 = 500): { fontFamily: string; fontWeight?: string } {
  if (Platform.OS === "web") return { fontFamily: "Hanken Grotesk, system-ui, sans-serif", fontWeight: String(weight) };
  return { fontFamily: NATIVE_FAMILY[weight] };
}

const tabular: TextStyle = { fontVariant: ["tabular-nums"] };

export const type = {
  display: { ...font("display", 800), fontSize: 28, lineHeight: 32, letterSpacing: -0.8 },
  title: { ...font("display", 700), fontSize: 20, lineHeight: 26, letterSpacing: -0.5 },
  heading: { ...font("display", 700), fontSize: 17, lineHeight: 22, letterSpacing: -0.4 },
  section: {
    ...font("body", 700),
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  bodyStrong: { ...font("body", 600), fontSize: 16, lineHeight: 22 },
  body: { ...font("body", 400), fontSize: 15, lineHeight: 22 },
  label: { ...font("body", 600), fontSize: 15, lineHeight: 20 },
  caption: { ...font("body", 500), fontSize: 13, lineHeight: 18 },
  micro: { ...font("body", 600), fontSize: 11, lineHeight: 14 },
  numeral: { ...font("display", 700), fontSize: 28, lineHeight: 32, letterSpacing: -0.6, ...tabular },
  money: { ...font("body", 700), fontSize: 16, lineHeight: 22, ...tabular },
  tabular,
} satisfies Record<string, TextStyle>;

/** Web only: injects the Google Fonts stylesheet shared by the app and the landing page. */
export function loadBrandFonts() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  if (document.getElementById("homi-fonts")) return;
  const l = document.createElement("link");
  l.id = "homi-fonts";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap";
  document.head.appendChild(l);
}
