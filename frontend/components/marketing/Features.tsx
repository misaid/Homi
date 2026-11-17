import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { m } from "./theme";

const items: { title: string; copy: string; icon: any }[] = [
  { title: "Units", copy: "Every property and unit, with its details and photos, in one list.", icon: "business-outline" },
  { title: "Tenants", copy: "Who lives where, with contacts a tap away.", icon: "people-outline" },
  { title: "Rent", copy: "See what is due, mark payments paid, and note how they paid.", icon: "card-outline" },
  { title: "Issues", copy: "Log maintenance problems and watch them move to resolved.", icon: "construct-outline" },
  { title: "Photos", copy: "Attach move-in and condition photos to the unit they belong to.", icon: "images-outline" },
  { title: "Notifications", copy: "Push alerts when something needs your attention.", icon: "notifications-outline" },
];

export default function Features() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  return (
    <View style={s.wrapper}>
      <View style={[s.content, wide && { flexDirection: "row", gap: 80 }]}>
        <View style={wide ? { flex: 5 } : { marginBottom: 32 }}>
          <Text accessibilityRole="header" style={[s.title, { fontSize: wide ? 48 : 34, lineHeight: wide ? 50 : 36 }]}>
            Everything a small portfolio needs. Nothing it doesn't.
          </Text>
        </View>
        <View style={wide ? { flex: 7 } : undefined}>
          {items.map((it, i) => (
            <View key={it.title} style={[s.row, i === 0 && { borderTopWidth: 1 }]}>
              <View style={s.icon}>
                <Ionicons name={it.icon} size={22} color={m.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{it.title}</Text>
                <Text style={s.rowCopy}>{it.copy}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { width: "100%", backgroundColor: m.paper },
  content: { maxWidth: m.max, width: "100%", alignSelf: "center", paddingHorizontal: 20, paddingVertical: 88 },
  title: { fontFamily: m.display, fontWeight: "800", color: m.ink, letterSpacing: -1.2 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 20, paddingVertical: 22,
    borderBottomWidth: 1, borderColor: m.line,
  },
  icon: { width: 48, height: 48, borderRadius: 14, backgroundColor: m.wash, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontFamily: m.display, fontSize: 21, fontWeight: "700", color: m.ink, letterSpacing: -0.3 },
  rowCopy: { fontFamily: m.body, fontSize: 16, lineHeight: 24, color: m.inkSoft, marginTop: 2, maxWidth: 480 },
});
