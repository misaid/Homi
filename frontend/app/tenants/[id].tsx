import { useApi } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import type { Paginated, Tenant, Unit } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
        lease_start: t.lease_start ?? t.leaseStart ?? "",
        lease_end: t.lease_end ?? t.leaseEnd ?? "",
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

  if (tenantQuery.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading tenant...</Text>
      </View>
    );
  }
  if (tenantQuery.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{tenantQuery.error.message}</Text>
        <Pressable
          onPress={() => tenantQuery.refetch()}
          style={styles.retryBtn}
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const tenant = tenantQuery.data as any;
  const unitLabel = tenant.unit_id
    ? unitNameById.get(String(tenant.unit_id)) ?? "Unknown"
    : "Unassigned";

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>
        {tenant.full_name ?? tenant.fullName ?? "Tenant"}
      </Text>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View
            style={[
              styles.badge,
              tenant.unit_id ? styles.badgeBlue : styles.badgeGray,
            ]}
          >
            <Text style={styles.badgeText}>{unitLabel}</Text>
          </View>
          <Pressable
            style={[styles.button, styles.btnSecondary]}
            onPress={() => setIsChangingUnit((v) => !v)}
          >
            <Text style={[styles.btnText, styles.btnSecondaryText]}>
              {isChangingUnit ? "Cancel" : "Change unit"}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.btnDanger]}
            onPress={onDeleteTenant}
          >
            <Text style={[styles.btnText, styles.btnDangerText]}>
              {deleteTenant.isPending ? "Deleting..." : "Delete"}
            </Text>
          </Pressable>
        </View>

        {isChangingUnit && (
          <View style={{ marginTop: 10 }}>
            <View style={styles.dropdown}>
              <Pressable
                style={styles.dropdownItem}
                onPress={() => setSelectedUnit("")}
              >
                <Text style={styles.dropdownText}>Unassigned</Text>
              </Pressable>
              {(unitsQuery.data?.items ?? []).map((u) => (
                <Pressable
                  key={String(u.id)}
                  style={styles.dropdownItem}
                  onPress={() => setSelectedUnit(String(u.id))}
                >
                  <Text style={styles.dropdownText}>{u.name}</Text>
                </Pressable>
              ))}
            </View>
            {!!updateUnit.error && (
              <Text
                style={[
                  styles.errorText,
                  { textAlign: "center", marginTop: 6 },
                ]}
              >
                {updateUnit.error.message}
              </Text>
            )}
            <View style={[styles.actions, { marginTop: 8 }]}>
              <Pressable
                onPress={() =>
                  updateUnit.mutate({
                    unit_id: selectedUnit ? selectedUnit : null,
                  })
                }
                style={[styles.button, styles.btnPrimary]}
                disabled={updateUnit.isPending}
              >
                <Text style={[styles.btnText, styles.btnPrimaryText]}>
                  {updateUnit.isPending ? "Saving..." : "Save unit"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="email@example.com"
                onBlur={onBlur}
                onChangeText={onChange}
                value={(value as string) ?? ""}
                autoCapitalize="none"
              />
            )}
          />
          {errors.email && (
            <Text style={styles.errorText}>
              {errors.email.message as string}
            </Text>
          )}
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Phone</Text>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                onBlur={onBlur}
                onChangeText={onChange}
                value={(value as string) ?? ""}
              />
            )}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Rent amount (optional)</Text>
          <Controller
            control={control}
            name="rent_amount"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.rent_amount && styles.inputError]}
                placeholder="e.g. 1200"
                keyboardType="numeric"
                onBlur={onBlur}
                onChangeText={onChange}
                value={(value as string) ?? ""}
              />
            )}
          />
          {errors.rent_amount && (
            <Text style={styles.errorText}>
              {(errors.rent_amount.message as string) ?? ""}
            </Text>
          )}
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Lease start (YYYY-MM-DD)</Text>
          <Controller
            control={control}
            name="lease_start"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.lease_start && styles.inputError]}
                placeholder="YYYY-MM-DD"
                onBlur={onBlur}
                onChangeText={onChange}
                value={(value as string) ?? ""}
                autoCapitalize="none"
              />
            )}
          />
          {errors.lease_start && (
            <Text style={styles.errorText}>
              {errors.lease_start.message as string}
            </Text>
          )}
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Lease end (YYYY-MM-DD)</Text>
          <Controller
            control={control}
            name="lease_end"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.lease_end && styles.inputError]}
                placeholder="YYYY-MM-DD"
                onBlur={onBlur}
                onChangeText={onChange}
                value={(value as string) ?? ""}
                autoCapitalize="none"
              />
            )}
          />
          {errors.lease_end && (
            <Text style={styles.errorText}>
              {errors.lease_end.message as string}
            </Text>
          )}
        </View>
        {!!updateDetails.error && (
          <Text
            style={[styles.errorText, { textAlign: "center", marginBottom: 8 }]}
          >
            {updateDetails.error.message}
          </Text>
        )}
        <View style={styles.actions}>
          <Pressable
            onPress={handleSubmit((v) => updateDetails.mutate(v))}
            style={[styles.button, styles.btnPrimary]}
            disabled={updateDetails.isPending}
          >
            <Text style={[styles.btnText, styles.btnPrimaryText]}>
              {updateDetails.isPending ? "Saving..." : "Save details"}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  muted: { color: "#666", marginTop: 8 },
  errorText: { color: "#b00020" },
  retryBtn: {
    backgroundColor: "#1b73e8",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  retryText: { color: "#fff", fontWeight: "600" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e0e0e0",
    marginBottom: 16,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeBlue: { backgroundColor: "#e0f2fe" },
  badgeGray: { backgroundColor: "#f3f4f6" },
  badgeText: { color: "#111827", fontSize: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  field: { marginBottom: 12 },
  label: { marginBottom: 6, color: "#222", fontWeight: "600" },
  input: {
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputError: { borderColor: "#b00020" },
  dropdown: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 10 },
  dropdownText: { color: "#111" },
  actions: { flexDirection: "row", gap: 10 },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: { backgroundColor: "#0a7ea4" },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  btnSecondary: {
    backgroundColor: "#f0f0f0",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
  },
  btnSecondaryText: { color: "#222", fontWeight: "700" },
  btnDanger: { backgroundColor: "#b00020" },
  btnDangerText: { color: "#fff", fontWeight: "700" },
});
