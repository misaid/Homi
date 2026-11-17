// Homi UI primitives. Every pill, field, button and sheet in the app comes from
// here so screens stay consistent. Tokens live in constants/theme.ts and
// constants/type.ts.
import Ionicons from "@expo/vector-icons/Ionicons";
import { type ComponentProps, type ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  avatarTints,
  dangerBorder,
  palette,
  radius,
  shadow,
  space,
  status,
  type StatusTone,
} from "@/constants/theme";
import { font, type } from "@/constants/type";

type IconName = ComponentProps<typeof Ionicons>["name"];

const noOutline = Platform.select({ web: { outlineStyle: "none" } as any, default: {} });
const pointer = Platform.select({ web: { cursor: "pointer" } as any, default: {} });

/* ------------------------------------------------------------------ Button */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  disabled,
  full,
  style,
  accessibilityLabel,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: "md" | "sm";
  icon?: IconName;
  disabled?: boolean;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const fg =
    variant === "primary"
      ? palette.white
      : variant === "secondary"
      ? palette.tintDark
      : variant === "danger"
      ? status.danger.fg
      : palette.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.btn,
        size === "sm" && styles.btnSm,
        variant === "primary" && { backgroundColor: palette.tint },
        variant === "secondary" && { backgroundColor: palette.wash },
        variant === "danger" && { borderWidth: 1, borderColor: dangerBorder },
        full && { alignSelf: "stretch" },
        pressed && styles.pressed,
        disabled && { opacity: 0.5 },
        pointer,
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={size === "sm" ? 16 : 18} color={fg} /> : null}
      <Text style={[styles.btnText, size === "sm" && { fontSize: 14 }, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 40,
  tone = "plain",
  color,
  style,
}: {
  icon: IconName;
  onPress?: () => void;
  accessibilityLabel: string;
  size?: number;
  tone?: "plain" | "wash";
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: tone === "wash" ? palette.wash : "transparent",
        },
        pressed && styles.pressed,
        pointer,
        style,
      ]}
    >
      <Ionicons name={icon} size={Math.round(size * 0.5)} color={color ?? (tone === "wash" ? palette.tintDark : palette.ink)} />
    </Pressable>
  );
}

/** The one floating action on a list screen. */
export function Fab({
  onPress,
  accessibilityLabel,
  bottom = 16,
}: {
  onPress: () => void;
  accessibilityLabel: string;
  bottom?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.fab, shadow.float, { bottom }, pressed && styles.pressed, pointer]}
    >
      <Ionicons name="add" size={28} color={palette.white} />
    </Pressable>
  );
}

/* -------------------------------------------------------------------- Chip */

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [
        styles.chip,
        active && { backgroundColor: palette.ink },
        pressed && styles.pressed,
        pointer,
      ]}
    >
      <Text style={[styles.chipText, active && { color: palette.white }]}>{label}</Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------- Badge */

export function Badge({
  label,
  tone = "neutral",
  dot = true,
  style,
}: {
  label: string;
  tone?: StatusTone;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = status[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      {dot ? <View style={[styles.badgeDot, { backgroundColor: t.fg }]} /> : null}
      <Text style={[styles.badgeText, { color: t.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------- SearchField */

export function SearchField({
  value,
  onChangeText,
  placeholder,
  style,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.search, style]}>
      <Ionicons name="search" size={18} color={palette.muted} />
      <TextInput
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        placeholderTextColor={palette.faint}
        value={value}
        onChangeText={onChangeText}
        style={[styles.searchInput, noOutline]}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 ? (
        <Pressable accessibilityLabel="Clear search" onPress={() => onChangeText("")} hitSlop={8} style={pointer}>
          <Ionicons name="close-circle" size={18} color={palette.faint} />
        </Pressable>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------- Field */

export function Field({
  label,
  error,
  hint,
  prefix,
  multiline,
  style,
  ...input
}: TextInputProps & {
  label: string;
  error?: string | null;
  hint?: string;
  prefix?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: space.lg }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.fieldBox,
          multiline && { height: 104, alignItems: "flex-start", paddingVertical: 12 },
          focused && { borderColor: palette.tint },
          !!error && { borderColor: status.danger.fg },
        ]}
      >
        {prefix ? <Text style={styles.fieldPrefix}>{prefix}</Text> : null}
        <TextInput
          {...input}
          multiline={multiline}
          placeholderTextColor={palette.faint}
          onFocus={(e) => {
            setFocused(true);
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            input.onBlur?.(e);
          }}
          style={[styles.fieldInput, multiline && { textAlignVertical: "top", height: "100%" }, noOutline, style]}
        />
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

/* -------------------------------------------------------------------- Card */

export function Card({
  children,
  style,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  return <View style={[styles.card, padded && { padding: space.lg }, style]}>{children}</View>;
}

/**
 * Style for one row of a "grouped" list: consecutive rows read as a single
 * white card with hairline dividers, without wrapping a virtualized list.
 */
export function groupedRow(index: number, count: number, opts: { joinTop?: boolean } = {}): ViewStyle {
  const first = index === 0 && !opts.joinTop;
  const last = index === count - 1;
  return {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: last ? 1 : 0,
    borderTopLeftRadius: first ? radius.lg : 0,
    borderTopRightRadius: first ? radius.lg : 0,
    borderBottomLeftRadius: last ? radius.lg : 0,
    borderBottomRightRadius: last ? radius.lg : 0,
  };
}

/* ------------------------------------------------------------------ Avatar */

export function initialsOf(name: string): string {
  return (
    (name || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export function Avatar({ name, size = 40, uri }: { name: string; size?: number; uri?: string | null }) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const bg = avatarTints[h % avatarTints.length];
  const box = { width: size, height: size, borderRadius: size / 2 };
  if (uri) return <Image source={{ uri }} style={box} />;
  return (
    <View style={[box, { backgroundColor: bg, alignItems: "center", justifyContent: "center" }]}>
      <Text style={{ ...font("display", 700), fontSize: Math.round(size * 0.36), color: palette.ink }}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}

/* ----------------------------------------------------------- SectionHeader */

export function SectionHeader({
  title,
  right,
  style,
}: {
  title: string;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <Text style={styles.sectionLabel}>{title}</Text>
      {right}
    </View>
  );
}

/* -------------------------------------------------------------- EmptyState */

export function EmptyState({
  icon,
  title,
  body,
  action,
  tone = "info",
  style,
}: {
  icon: IconName;
  title: string;
  body?: string;
  action?: ReactNode;
  tone?: "info" | "danger";
  style?: StyleProp<ViewStyle>;
}) {
  const t = status[tone];
  return (
    <View style={[styles.empty, style]}>
      <View style={[styles.emptyIcon, { backgroundColor: t.bg }]}>
        <Ionicons name={icon} size={22} color={t.fg} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
      {action ? <View style={{ marginTop: space.lg }}>{action}</View> : null}
    </View>
  );
}

/* --------------------------------------------------------------- Segmented */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.segTrack}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            disabled={disabled}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[styles.seg, on && styles.segOn, on && shadow.card, pointer]}
          >
            <Text style={[styles.segText, on && { color: palette.ink }]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* --------------------------------------------------------------- SelectRow */

/** A labelled row that expands into an inline, scrollable radio list. */
export function SelectRow<T extends string | null>({
  label,
  options,
  value,
  onChange,
  last,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  last?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(spin, { toValue: open ? 1 : 0, duration: 150, useNativeDriver: Platform.OS !== "web" }).start();
  }, [open, spin]);
  const current = options.find((o) => o.value === value)?.label ?? "Unassigned";
  return (
    <View style={!last && { borderBottomWidth: 1, borderBottomColor: palette.border }}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current}`}
        style={[styles.selectRow, pointer]}
      >
        <Text style={styles.selectLabel}>{label}</Text>
        <Text style={[styles.selectValue, value == null && { color: palette.muted }]} numberOfLines={1}>
          {current}
        </Text>
        <Animated.View
          style={{ transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) }] }}
        >
          <Ionicons name="chevron-down" size={18} color={palette.faint} />
        </Animated.View>
      </Pressable>
      {open ? (
        <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled contentContainerStyle={{ paddingBottom: space.sm }}>
          {options.map((o) => {
            const on = o.value === value;
            return (
              <Pressable
                key={String(o.value)}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={({ pressed }) => [styles.option, pressed && { backgroundColor: palette.page }, pointer]}
              >
                <View style={[styles.radio, on && { borderColor: palette.tint }]}>
                  {on ? <View style={styles.radioDot} /> : null}
                </View>
                <Text style={[styles.optionText, on && font("body", 600)]}>{o.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------- Sheet */

/** Bottom sheet on phones, centred card at >= 768px. */
export function Sheet({
  visible,
  onClose,
  children,
  header,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= 768;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.sheetBackdrop, wide ? { justifyContent: "center", padding: 24 } : { justifyContent: "flex-end" }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View
          style={[
            styles.sheet,
            { maxHeight: Math.round(height * 0.88) },
            wide
              ? { borderRadius: radius.xl, width: "100%", maxWidth: 480, alignSelf: "center" }
              : { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          {!wide ? <View style={styles.grabber} /> : null}
          {header}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: space.sm }}
            style={{ flexGrow: 0 }}
          >
            {children}
          </ScrollView>
          {footer ? <View style={styles.sheetFooter}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

export function SheetHeader({
  label,
  right,
  onClose,
}: {
  label: string;
  right?: ReactNode;
  onClose: () => void;
}) {
  return (
    <View style={styles.sheetHeader}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {right}
      <View style={{ flex: 1 }} />
      <IconButton icon="close" accessibilityLabel="Close" onPress={onClose} size={32} tone="wash" />
    </View>
  );
}

/** One tappable line in an action sheet. */
export function SheetAction({
  icon,
  label,
  onPress,
  danger,
  selected,
}: {
  icon?: IconName;
  label: string;
  onPress: () => void;
  danger?: boolean;
  selected?: boolean;
}) {
  const fg = danger ? status.danger.fg : palette.ink;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.sheetAction, pressed && { backgroundColor: palette.page }, pointer]}
    >
      {icon ? <Ionicons name={icon} size={20} color={fg} /> : null}
      <Text style={[styles.sheetActionText, { color: fg }, selected && font("body", 700)]}>{label}</Text>
      {selected ? <Ionicons name="checkmark" size={20} color={palette.tint} /> : null}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ styles */

export const textStyles = StyleSheet.create({
  muted: { ...type.caption, color: palette.muted } as TextStyle,
  error: { ...type.caption, color: status.danger.fg } as TextStyle,
});

const styles = StyleSheet.create({
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  btn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  btnSm: { height: 36, paddingHorizontal: 12 },
  btnText: { ...font("body", 600), fontSize: 15 },
  fab: {
    position: "absolute",
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: palette.field,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { ...font("body", 600), fontSize: 13, color: palette.inkSoft },
  badge: {
    height: 22,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { ...font("body", 700), fontSize: 11 },
  search: {
    height: 44,
    borderRadius: radius.md,
    backgroundColor: palette.field,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: { flex: 1, minWidth: 0, height: 44, ...font("body", 400), fontSize: 15, color: palette.ink },
  fieldLabel: { ...font("body", 600), fontSize: 13, color: palette.muted, marginBottom: 6 },
  fieldBox: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 6,
  },
  fieldPrefix: { ...font("body", 600), fontSize: 15, color: palette.muted },
  fieldInput: { flex: 1, minWidth: 0, height: "100%", ...font("body", 400), fontSize: 15, color: palette.ink },
  fieldError: { ...type.caption, color: status.danger.fg, marginTop: 6 },
  fieldHint: { ...type.caption, color: palette.faint, marginTop: 6 },
  card: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 36,
    marginTop: space.xl,
    marginBottom: space.sm,
  },
  sectionLabel: { ...type.section, color: palette.muted } as TextStyle,
  empty: { alignItems: "center", paddingVertical: 36, paddingHorizontal: 24 },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { ...type.heading, color: palette.ink, textAlign: "center" },
  emptyBody: { ...type.body, color: palette.muted, textAlign: "center", marginTop: 4, maxWidth: 300 },
  segTrack: { flexDirection: "row", backgroundColor: palette.field, borderRadius: radius.md, padding: 3 },
  seg: { flex: 1, height: 36, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  segOn: { backgroundColor: palette.card },
  segText: { ...font("body", 600), fontSize: 13, color: palette.muted },
  selectRow: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 10 },
  selectLabel: { ...font("body", 500), fontSize: 15, color: palette.muted, width: 64 },
  selectValue: { ...font("body", 600), fontSize: 15, color: palette.ink, flex: 1, textAlign: "right" },
  option: { flexDirection: "row", alignItems: "center", gap: 12, height: 44, paddingHorizontal: 8, borderRadius: radius.sm },
  optionText: { ...font("body", 400), fontSize: 15, color: palette.ink },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.washDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.tint },
  sheetBackdrop: { flex: 1, backgroundColor: palette.backdrop },
  sheet: {
    backgroundColor: palette.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: 10,
    paddingBottom: 16,
  },
  grabber: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: palette.washDeep, marginBottom: 6 },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingVertical: 8 },
  sheetFooter: { paddingHorizontal: 20, paddingTop: 12 },
  sheetAction: { height: 52, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 8, borderRadius: radius.sm },
  sheetActionText: { ...font("body", 500), fontSize: 16, flex: 1 },
});
