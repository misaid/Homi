import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Phone from "./Phone";
import { m } from "./theme";

const shots = [
  { src: require("@/assets/images/units.png"), name: "Units", note: "Your whole portfolio at a glance." },
  { src: require("@/assets/images/tenants.png"), name: "Tenants", note: "Residents and contacts, sorted." },
  { src: require("@/assets/images/rent.png"), name: "Rent", note: "Due, paid and overdue in one view." },
  { src: require("@/assets/images/home.png"), name: "Issues", note: "Maintenance, tracked to done." },
];

export default function Screenshot() {
  const { width } = useWindowDimensions();
  const cols = width >= 1000 ? 4 : width >= 600 ? 2 : 1;
  const gap = 28;
  const inner = Math.min(m.max, width) - 40;
  const phoneW = Math.min(250, (inner - gap * (cols - 1)) / cols);
  return (
    <View style={s.wrapper}>
      <View style={s.content}>
        <Text accessibilityRole="header" style={[s.title, { fontSize: width >= 900 ? 48 : 34 }]}>
          Built for the phone in your pocket.
        </Text>
        <Text style={s.sub}>The same four screens you will use every day.</Text>
        <View style={[s.grid, { gap }]}>
          {shots.map((x, i) => (
            <View key={x.name} style={{ width: phoneW, marginTop: cols === 4 && i % 2 ? 48 : 0 }}>
              <Phone source={x.src} width={phoneW} label={`${x.name} screen`} />
              <Text style={s.name}>{x.name}</Text>
              <Text style={s.note}>{x.note}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { width: "100%", backgroundColor: m.ink },
  content: { maxWidth: m.max, width: "100%", alignSelf: "center", paddingHorizontal: 20, paddingVertical: 96 },
  title: { fontFamily: m.display, fontWeight: "800", color: m.onDark, letterSpacing: -1.2, maxWidth: 640 },
  sub: { fontFamily: m.body, fontSize: 18, color: m.onDarkMuted, marginTop: 12, marginBottom: 56 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  name: { fontFamily: m.display, fontSize: 20, fontWeight: "700", color: m.onDark, marginTop: 22 },
  note: { fontFamily: m.body, fontSize: 15, color: m.onDarkMuted, marginTop: 4 },
});
