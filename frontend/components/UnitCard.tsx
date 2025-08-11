// All data fetching must use lib/api useApi(). Do not call fetch directly.
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { memo, useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

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
  const colorScheme = useColorScheme();
  const cardBg = Colors[colorScheme ?? "light"].card;
  const chipBg = colorScheme === "dark" ? "#0b1a2b" : "#f4f7fa";
  const addBg = colorScheme === "dark" ? "#0b2230" : "#e6f3f7";
  const {
    name,
    address,
    monthly_rent,
    beds,
    baths,
    photos,
    occupants_count,
    onPress,
    onAddOccupant,
  } = props;
  const coverUri = useMemo(
    () => (photos && photos.length > 0 ? photos[0] : null),
    [photos]
  );
  const pressAnim = useRef(new Animated.Value(1)).current;

  const accessibilityLabel = `${name}. Beds ${beds ?? "-"}, Baths ${
    baths ?? "-"
  }, Occupants ${occupants_count}. ${address}`;

  return (
    <Pressable
      onPressIn={() => {
        Animated.spring(pressAnim, {
          toValue: 0.98,
          useNativeDriver: true,
          friction: 8,
          tension: 140,
        }).start();
      }}
      onPressOut={() => {
        Animated.spring(pressAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
          tension: 140,
        }).start();
      }}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      style={{ borderRadius: RADIUS }}
    >
      <Animated.View
        style={[
          styles.card,
          { transform: [{ scale: pressAnim }], backgroundColor: cardBg },
        ]}
      >
        <View style={styles.headerWrapper}>
          {coverUri ? (
            <Image
              source={{ uri: coverUri }}
              style={styles.headerImage}
              contentFit="cover"
              transition={220}
            />
          ) : (
            <View style={styles.placeholder} />
          )}
          <View style={styles.headerOverlay}>
            <Text numberOfLines={1} style={styles.titleOverlay}>
              {name}
            </Text>
          </View>
        </View>
        <View style={styles.body}>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.metaItem,
                styles.metaChip,
                { backgroundColor: chipBg },
              ]}
              accessibilityLabel={`Beds ${beds ?? 0}`}
            >
              <Ionicons name="bed-outline" size={16} color="#444" />
              <Text style={styles.metaText}>{beds ?? "-"}</Text>
            </View>
            <View
              style={[
                styles.metaItem,
                styles.metaChip,
                { backgroundColor: chipBg },
              ]}
              accessibilityLabel={`Baths ${baths ?? 0}`}
            >
              <Ionicons name="water-outline" size={16} color="#444" />
              <Text style={styles.metaText}>{baths ?? "-"}</Text>
            </View>
            <View
              style={[
                styles.metaItem,
                styles.metaChip,
                { backgroundColor: chipBg },
              ]}
              accessibilityLabel={`Occupants ${occupants_count}`}
            >
              <Ionicons name="person-outline" size={16} color="#444" />
              <Text style={styles.metaText}>{occupants_count}</Text>
            </View>
            <View
              style={[
                styles.metaItem,
                styles.metaChip,
                { backgroundColor: chipBg },
              ]}
              accessibilityLabel={`Monthly rent ${monthly_rent ?? 0}`}
            >
              <Ionicons name="cash-outline" size={16} color="#444" />
              <Text style={styles.metaText}>
                {(() => {
                  const n =
                    typeof monthly_rent === "string"
                      ? Number(monthly_rent)
                      : monthly_rent;
                  return typeof n === "number" && Number.isFinite(n)
                    ? `$${Number(n).toLocaleString()}`
                    : "-";
                })()}
              </Text>
            </View>
            {onAddOccupant && (
              <Pressable
                onPress={onAddOccupant}
                style={[styles.addBtn, { backgroundColor: addBg }]}
                accessibilityLabel="Add occupant"
              >
                <Ionicons name="person-add-outline" size={16} color="#0a7ea4" />
                <Text style={styles.addBtnText}>Add</Text>
              </Pressable>
            )}
          </View>
          {!!address && (
            <View
              style={styles.addressRow}
              accessibilityLabel={`Address ${address}`}
            >
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text
                numberOfLines={2}
                ellipsizeMode="tail"
                style={styles.address}
              >
                {address}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export const UnitCard = memo(UnitCardComponent);

const RADIUS = 12;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: RADIUS,
    marginHorizontal: 8,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: "hidden",
  },
  headerWrapper: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#f0f0f0",
    position: "relative",
  },
  headerImage: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: RADIUS,
    borderTopRightRadius: RADIUS,
  },
  headerOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e6eef6",
  },
  body: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  titleOverlay: { fontSize: 17, fontWeight: "700", color: "#fff" },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaChip: {
    backgroundColor: "#f4f7fa",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  metaText: { color: "#444", fontWeight: "500", fontSize: 14 },
  addBtn: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#e6f3f7",
  },
  addBtnText: { color: "#0a7ea4", fontWeight: "700" },
  address: {
    color: "#444",
    fontSize: 14,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
