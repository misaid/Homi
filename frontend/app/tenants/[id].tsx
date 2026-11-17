import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  SectionHeader,
  Sheet,
  SheetAction,
  SheetHeader,
} from "@/components/ui";
import { palette } from "@/constants/theme";
import { font, type } from "@/constants/type";
import { useApi } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import type { Paginated, Tenant, Unit } from "@/lib/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const detailsSchema = z.object({
  email: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  phone: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  rent_amount: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => v === "" || !Number.isNaN(Number(v)), {
      message: "Must be a number",
    }),
  lease_start: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v))
    .refine((v) => !v || dateRegex.test(v), { message: "Use YYYY-MM-DD" }),
  lease_end: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v))
    .refine((v) => !v || dateRegex.test(v), { message: "Use YYYY-MM-DD" }),
});
type DetailsValues = z.infer<typeof detailsSchema>;

export default function TenantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tenantId = String(id);
  const api = useApi();
  const qc = useQueryClient();
  const router = useRouter();
  const navigation = useNavigation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isChangingUnit, setIsChangingUnit] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string | "">("");

  const tenantQuery = useQuery<Tenant, Error>({
    queryKey: qk.tenant(tenantId),
    queryFn: () => api.get<Tenant>(`/api/v1/tenants/${tenantId}`),
    enabled: !!tenantId,
  });

  const unitsQuery = useQuery<Paginated<Unit>, Error>({
    queryKey: qk.units(1, 100),
    queryFn: () => api.get<Paginated<Unit>>(`/api/v1/units?page=1&limit=100`),
  });

  const unitNameById = useMemo(() => {
    const map = new Map<string, string>();
    (unitsQuery.data?.items ?? []).forEach((u) =>
      map.set(String(u.id), u.name)
    );
    return map;
  }, [unitsQuery.data]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DetailsValues>({ resolver: zodResolver(detailsSchema) });

  useEffect(() => {
    if (tenantQuery.data) {
      const t = tenantQuery.data as any;
      reset({
        email: t.email ?? "",
        phone: t.phone ?? t.phone_number ?? t.phoneNumber ?? "",
        rent_amount:
          t.rent_amount ?? t.rentAmount
            ? String(t.rent_amount ?? t.rentAmount)
            : "",
        lease_start: String(t.lease_start ?? t.leaseStart ?? "").slice(0, 10),
        lease_end: String(t.lease_end ?? t.leaseEnd ?? "").slice(0, 10),
      });
      setSelectedUnit(t.unit_id ? String(t.unit_id) : "");
    }
  }, [tenantQuery.data, reset]);

  const updateUnit = useMutation<unknown, Error, { unit_id: string | null }>({
    mutationFn: (body) => api.put(`/api/v1/tenants/${tenantId}`, body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.tenants() });
      await qc.invalidateQueries({ queryKey: qk.units() });
      await qc.invalidateQueries({ queryKey: qk.tenant(tenantId) });
      await qc.invalidateQueries({ queryKey: ["payments"] });
      await qc.invalidateQueries({ queryKey: ["payments", "due"] });
      setIsChangingUnit(false);
      // small toast + navigate back
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const RN = require("react-native");
      if (RN.Platform.OS === "android") {
        RN.ToastAndroid?.show(
          "Schedule will be generated automatically",
          RN.ToastAndroid.SHORT
        );
      } else {
        RN.Alert?.alert("", "Schedule will be generated automatically");
      }
      router.back();
    },
  });

  const updateDetails = useMutation<unknown, Error, DetailsValues>({
    mutationFn: (values) =>
      api.put(`/api/v1/tenants/${tenantId}`, {
        email: values.email,
        phone: values.phone,
        lease_start: values.lease_start,
        lease_end: values.lease_end,
        rent_amount:
          values.rent_amount && String(values.rent_amount).trim() !== ""
            ? Number(values.rent_amount)
            : undefined,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.tenants() });
      await qc.invalidateQueries({ queryKey: qk.tenant(tenantId) });
      await qc.invalidateQueries({ queryKey: ["payments"] });
      await qc.invalidateQueries({ queryKey: ["payments", "due"] });
      // small toast
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const RN = require("react-native");
      if (RN.Platform.OS === "android") {
        RN.ToastAndroid?.show(
          "Schedule will be generated automatically",
          RN.ToastAndroid.SHORT
        );
      } else {
        RN.Alert?.alert("", "Schedule will be generated automatically");
      }
      router.back();
    },
  });

  const deleteTenant = useMutation<unknown, Error, void>({
    mutationFn: async () => api.del(`/api/v1/tenants/${tenantId}`),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.tenants() });
      await qc.invalidateQueries({ queryKey: ["payments"] });
      await qc.invalidateQueries({ queryKey: ["payments", "due"] });
      try {
        router.replace("/(tabs)/tenants");
      } catch {
        router.back();
      }
    },
  });

  const onDeleteTenant = () => {
    if (Platform.OS === "web") {
      // eslint-disable-next-line no-alert
      const confirmed =
        typeof window !== "undefined" && window.confirm("Delete this tenant?");
      if (confirmed) deleteTenant.mutate();
      return;
    }
    Alert.alert(
      "Delete Tenant",
      "Are you sure you want to delete this tenant?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteTenant.mutate(),
        },
      ]
    );
  };

  // Destructive actions live behind the header overflow menu.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        tenantQuery.data ? (
          <IconButton
            icon="ellipsis-horizontal"
            accessibilityLabel="More actions"
            size={36}
            onPress={() => setMenuOpen(true)}
          />
        ) : null,
    });
  }, [navigation, tenantQuery.data]);

  if (tenantQuery.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={palette.tint} />
      </View>
    );
  }
  if (tenantQuery.isError) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="cloud-offline-outline"
          tone="danger"
          title="Couldn't load this tenant"
          body={tenantQuery.error.message}
          action={<Button label="Try again" variant="secondary" onPress={() => tenantQuery.refetch()} />}
        />
      </View>
    );
  }

  const tenant = tenantQuery.data as any;
  const unitLabel = tenant.unit_id
    ? unitNameById.get(String(tenant.unit_id)) ?? "Unknown"
    : "Unassigned";
  const name = tenant.full_name ?? tenant.fullName ?? "Tenant";
  const email = tenant.email ?? null;
  const phone =
    tenant.phone ?? tenant.phone_number ?? tenant.phoneNumber ?? null;
  const avatarUri = tenant.avatar_url || tenant.image_url || null;

  return (
    <ScrollView
      style={{ backgroundColor: palette.page }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.hero}>
        <Avatar name={name} size={64} uri={avatarUri} />
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
          {name}
        </Text>
        {!!email && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {email}
          </Text>
        )}
        <View style={styles.contactRow}>
          <Button
            label="Call"
            icon="call-outline"
            variant="secondary"
            disabled={!phone}
            accessibilityLabel="Call tenant"
            onPress={() => phone && Linking.openURL(`tel:${phone}`)}
            style={styles.contactBtn}
          />
          <Button
            label="Email"
            icon="mail-outline"
            variant="secondary"
            disabled={!email}
            accessibilityLabel="Email tenant"
            onPress={() => email && Linking.openURL(`mailto:${email}`)}
            style={styles.contactBtn}
          />
        </View>
      </View>

      <SectionHeader title="Unit" style={{ marginTop: 8 }} />
      <Card padded={false}>
        <Pressable
          onPress={() => setIsChangingUnit((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={`Unit: ${unitLabel}. Change unit.`}
          style={styles.unitRow}
        >
          <View style={styles.unitIcon}>
            <Ionicons name="home-outline" size={18} color={palette.tintDark} />
          </View>
          <Text style={[styles.unitName, !tenant.unit_id && { color: palette.muted }]} numberOfLines={1}>
            {unitLabel}
          </Text>
          <Text style={styles.link}>{isChangingUnit ? "Cancel" : "Change"}</Text>
          <Ionicons
            name={isChangingUnit ? "chevron-up" : "chevron-forward"}
            size={18}
            color={palette.chevron}
          />
        </Pressable>

        {isChangingUnit && (
          <View style={styles.unitPicker}>
            {[{ id: "", name: "Unassigned" }, ...(unitsQuery.data?.items ?? [])].map((u) => {
              const on = selectedUnit === String(u.id);
              return (
                <Pressable
                  key={String(u.id) || "none"}
                  style={({ pressed }) => [styles.option, pressed && { backgroundColor: palette.page }]}
                  onPress={() => setSelectedUnit(String(u.id))}
                >
                  <View style={[styles.radio, on && { borderColor: palette.tint }]}>
                    {on ? <View style={styles.radioDot} /> : null}
                  </View>
                  <Text style={[styles.optionText, on && font("body", 600)]}>{u.name}</Text>
                </Pressable>
              );
            })}
            {!!updateUnit.error && (
              <Text style={[styles.errorText, { marginTop: 6 }]}>{updateUnit.error.message}</Text>
            )}
            <Button
              label={updateUnit.isPending ? "Saving..." : "Save unit"}
              full
              disabled={updateUnit.isPending}
              style={{ marginTop: 8 }}
              onPress={() =>
                updateUnit.mutate({
                  unit_id: selectedUnit ? selectedUnit : null,
                })
              }
            />
          </View>
        )}
      </Card>

      <SectionHeader title="Details" />
      <Card>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Field
              label="Email"
              placeholder="email@example.com"
              onBlur={onBlur}
              onChangeText={onChange}
              value={(value as string) ?? ""}
              autoCapitalize="none"
              keyboardType="email-address"
              error={errors.email?.message as string | undefined}
            />
          )}
        />
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <Field
              label="Phone"
              placeholder="Phone number"
              onBlur={onBlur}
              onChangeText={onChange}
              value={(value as string) ?? ""}
              keyboardType="phone-pad"
            />
          )}
        />
        <Controller
          control={control}
          name="rent_amount"
          render={({ field: { onChange, onBlur, value } }) => (
            <Field
              label="Rent amount"
              prefix="$"
              placeholder="1200"
              hint="Optional. Leave blank to use the unit's rent."
              keyboardType="numeric"
              onBlur={onBlur}
              onChangeText={onChange}
              value={(value as string) ?? ""}
              error={errors.rent_amount?.message as string | undefined}
            />
          )}
        />
        <View style={styles.dateRow}>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="lease_start"
              render={({ field: { onChange, onBlur, value } }) => (
                <DateField
                  label="Lease start"
                  value={(value as string) ?? ""}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={errors.lease_start?.message as string | undefined}
                />
              )}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="lease_end"
              render={({ field: { onChange, onBlur, value } }) => (
                <DateField
                  label="Lease end"
                  value={(value as string) ?? ""}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={errors.lease_end?.message as string | undefined}
                />
              )}
            />
          </View>
        </View>
        {!!updateDetails.error && (
          <Text style={[styles.errorText, { marginBottom: 8 }]}>{updateDetails.error.message}</Text>
        )}
        <Button
          label={updateDetails.isPending ? "Saving..." : "Save details"}
          full
          disabled={updateDetails.isPending}
          onPress={handleSubmit((v) => updateDetails.mutate(v as any))}
        />
      </Card>

      <Sheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        header={<SheetHeader label={name} onClose={() => setMenuOpen(false)} />}
      >
        <SheetAction
          icon="swap-horizontal-outline"
          label="Change unit"
          onPress={() => {
            setMenuOpen(false);
            setIsChangingUnit(true);
          }}
        />
        <SheetAction
          icon="trash-outline"
          label={deleteTenant.isPending ? "Deleting..." : "Delete tenant"}
          danger
          onPress={() => {
            setMenuOpen(false);
            onDeleteTenant();
          }}
        />
      </Sheet>
    </ScrollView>
  );
}

/** Formats digits as YYYY-MM-DD while typing. */
function maskDate(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 4) return d;
  if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
}

function prettyDate(iso: string): string | null {
  if (!dateRegex.test(iso)) return null;
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** Stores YYYY-MM-DD; shows "Feb 1, 2025" until focused. */
function DateField({
  label,
  value,
  onChange,
  onBlur,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const iso = (value || "").slice(0, 10);
  const pretty = prettyDate(iso);
  return (
    <Field
      label={label}
      placeholder="YYYY-MM-DD"
      hint={focused ? "YYYY-MM-DD" : undefined}
      value={!focused && pretty ? pretty : iso}
      onChangeText={(t) => onChange(maskDate(t))}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        onBlur();
      }}
      keyboardType="numbers-and-punctuation"
      autoCapitalize="none"
      error={error}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, alignSelf: "center", width: "100%", maxWidth: 720 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: palette.page },
  errorText: { ...type.caption, color: "#b42318", textAlign: "center" },
  hero: { alignItems: "center", paddingTop: 4, paddingBottom: 8 },
  title: { ...type.display, color: palette.ink, marginTop: 12, textAlign: "center", alignSelf: "stretch" },
  subtitle: { ...type.caption, color: palette.muted, marginTop: 2, textAlign: "center", alignSelf: "stretch" },
  contactRow: { flexDirection: "row", gap: 10, marginTop: 16, alignSelf: "stretch" },
  contactBtn: { flex: 1, alignSelf: "auto" },
  unitRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, height: 60 },
  unitIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: palette.wash,
    alignItems: "center",
    justifyContent: "center",
  },
  unitName: { ...type.bodyStrong, color: palette.ink, flex: 1 },
  link: { ...font("body", 600), fontSize: 14, color: palette.tint },
  unitPicker: { borderTopWidth: 1, borderTopColor: palette.border, padding: 12 },
  option: { flexDirection: "row", alignItems: "center", gap: 12, height: 44, paddingHorizontal: 8, borderRadius: 8 },
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
  dateRow: { flexDirection: "row", gap: 12 },
});
