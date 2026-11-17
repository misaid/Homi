// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { Badge, IconButton } from "@/components/ui";
import { palette, radius, shadow } from "@/constants/theme";
import { font, type } from "@/constants/type";
import { Image } from "expo-image";
import { memo, useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

export type UnitCardProps = {
  id: string;
  name: string;
  address: string;
  monthly_rent?: number | string | null;
  beds?: number | null;
  baths?: number | null;
  occupants_count: number;
  photos: string[];
  onPress?: () => void;
  onAddOccupant?: () => void;
};

function UnitCardComponent(props: UnitCardProps) {
  const { name, address, monthly_rent, beds, baths, photos, occupants_count, onPress, onAddOccupant } = props;
  const coverUri = useMemo(() => (photos && photos.length > 0 ? photos[0] : null), [photos]);
  const pressAnim = useRef(new Animated.Value(1)).current;
  const spring = (toValue: number) =>
    Animated.spring(pressAnim, { toValue, useNativeDriver: true, friction: 8, tension: 140 }).start();

  const rentNum = typeof monthly_rent === "string" ? Number(monthly_rent) : monthly_rent;
  const rent =
    typeof rentNum === "number" && Number.isFinite(rentNum) ? `$${rentNum.toLocaleString("en-US")}` : null;
  const meta = [
    beds != null ? `${beds} bd` : null,
    baths != null ? `${baths} ba` : null,
    `${occupants_count} ${occupants_count === 1 ? "tenant" : "tenants"}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const vacant = occupants_count === 0;

  const accessibilityLabel = `${name}. Beds ${beds ?? "-"}, Baths ${baths ?? "-"}, Occupants ${occupants_count}. ${address}`;

  return (
    <Pressable
      onPressIn={() => spring(0.98)}
      onPressOut={() => spring(1)}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      style={styles.wrap}
    >
      <Animated.View style={[styles.card, { transform: [{ scale: pressAnim }] }]}>
        <View style={styles.media}>
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.image} contentFit="cover" transition={220} />
          ) : (
            <View style={styles.placeholder} />
          )}
          <View style={styles.fade} pointerEvents="none">
            <Svg width="100%" height="100%" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="homiUnitFade" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#1b1840" stopOpacity={0} />
                  <Stop offset="1" stopColor="#1b1840" stopOpacity={0.78} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#homiUnitFade)" />
            </Svg>
          </View>
          {rent ? (
            <View style={styles.rentPill} accessibilityLabel={`Monthly rent ${rent}`}>
              <Text style={styles.rentText}>
                {rent}
                <Text style={styles.rentPer}>/mo</Text>
              </Text>
            </View>
          ) : null}
          <View style={styles.caption} pointerEvents="none">
            <Text numberOfLines={1} style={styles.name}>
              {name}
            </Text>
            {!!address && (
              <Text numberOfLines={1} style={styles.address}>
                {address}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.body}>
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
          <Badge label={vacant ? "Vacant" : "Occupied"} tone={vacant ? "warn" : "ok"} style={{ alignSelf: "center" }} />
          {onAddOccupant ? (
            <IconButton
              icon="person-add-outline"
              tone="wash"
              size={32}
              accessibilityLabel="Add occupant"
              onPress={onAddOccupant}
            />
          ) : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export const UnitCard = memo(UnitCardComponent);

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginVertical: 8, borderRadius: radius.lg },
  card: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: "hidden",
  },
  media: { width: "100%", aspectRatio: 16 / 10, backgroundColor: palette.wash },
  image: { width: "100%", height: "100%" },
  placeholder: { width: "100%", height: "100%", backgroundColor: palette.wash },
  fade: { position: "absolute", left: 0, right: 0, bottom: 0, height: "55%" },
  rentPill: {
    position: "absolute",
    top: 12,
    right: 12,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: palette.card,
    justifyContent: "center",
    ...shadow.card,
  },
  rentText: { ...font("body", 700), fontSize: 13, color: palette.ink, ...type.tabular },
  rentPer: { ...font("body", 500), color: palette.muted },
  caption: { position: "absolute", left: 14, right: 14, bottom: 12 },
  name: { ...type.title, color: palette.white },
  address: { ...type.caption, color: "rgba(255,255,255,0.88)", marginTop: 1 },
  body: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, height: 52 },
  meta: { ...type.caption, color: palette.inkSoft, flex: 1 },
});
