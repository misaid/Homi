import { loadBrandFonts } from "@/constants/type";
import { Platform } from "react-native";

export const m = {
  ink: "#1b1840",
  inkSoft: "#4a4670",
  inkMuted: "#6b6890",
  paper: "#faf9ff",
  wash: "#ece9fb",
  washDeep: "#d9d4f6",
  line: "#e2def5",
  accent: "#5b4fe0",
  accentDark: "#4338c4",
  onDark: "#f4f2ff",
  onDarkMuted: "#b9b4e6",
  display: Platform.select({
    web: "'Hanken Grotesk', system-ui, sans-serif",
    default: undefined,
  }) as string | undefined,
  body: Platform.select({
    web: "'Hanken Grotesk', system-ui, sans-serif",
    default: undefined,
  }) as string | undefined,
  max: 1160,
};

export const focusRing = Platform.select({
  web: {
    outlineWidth: 2,
    outlineColor: "#5b4fe0",
    outlineOffset: 3,
    outlineStyle: "solid",
  },
  default: {},
}) as any;

export const shadowSoft = Platform.select({
  web: { boxShadow: "0 30px 60px -20px rgba(27,24,64,0.35), 0 8px 18px -8px rgba(27,24,64,0.25)" },
  default: {
    shadowColor: "#1b1840",
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
  },
}) as any;

export function loadMarketingFonts() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  loadBrandFonts();
  if (document.getElementById("homi-marketing-css")) return;
  const s = document.createElement("style");
  s.id = "homi-marketing-css";
  s.textContent = `::selection{background:#5b4fe0;color:#fff}html{scroll-behavior:smooth}
  ::-webkit-scrollbar{width:10px}::-webkit-scrollbar-track{background:#faf9ff}::-webkit-scrollbar-thumb{background:#d9d4f6;border-radius:8px;border:2px solid #faf9ff}
  @keyframes homiRise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
  .homi-rise{animation:homiRise .9s cubic-bezier(.16,1,.3,1) both}`;
  document.head.appendChild(s);
}
