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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  monthly_rent: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "string" ? Number(v) : v))
    .refine((n) => Number.isFinite(n) && n > 0, {
      message: "Monthly rent must be greater than 0",
    }),
  notes: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
});
type FormValues = z.infer<typeof schema>;

export default function UnitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const unitId = String(id);
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const unitQuery = useQuery<Unit, Error>({
    queryKey: qk.unit(unitId),
    queryFn: () => api.get<Unit>(`/api/v1/units/${unitId}`),
    enabled: !!unitId,
  });

  const tenantsQuery = useQuery<Paginated<Tenant>, Error>({
    queryKey: qk.tenants(1, 20),
    queryFn: () =>
      api.get<Paginated<Tenant>>(`/api/v1/tenants?page=1&limit=20`),
  });

  const tenants = useMemo(
    () =>
      tenantsQuery.data?.items.filter((t) => String(t.unit_id) === unitId) ??
      [],
    [tenantsQuery.data, unitId]
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (unitQuery.data) {
      reset({
        name: unitQuery.data.name ?? "",
        address: unitQuery.data.address ?? "",
        monthly_rent: (unitQuery.data.monthly_rent as unknown as string) ?? "",
        notes: (unitQuery.data.notes as string | undefined) ?? "",
      });
    }
  }, [unitQuery.data, reset]);

  const updateMutation = useMutation<Unit, Error, FormValues>({
    mutationFn: async (values) =>
      api.put<Unit>(`/api/v1/units/${unitId}`, {
        name: values.name,
        address: values.address,
        monthly_rent: values.monthly_rent as number,
        notes: values.notes,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.unit(unitId) });
      await queryClient.invalidateQueries({ queryKey: qk.units() });
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation<unknown, Error, void>({
    mutationFn: async () => api.del(`/api/v1/units/${unitId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.units() });
      router.replace("/(tabs)/units");
    },
  });

  const onDelete = () => {
    Alert.alert("Delete Unit", "Are you sure you want to delete this unit?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate(),
      },
    ]);
  };

  if (unitQuery.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading unit...</Text>
      </View>
    );
  }

  if (unitQuery.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{unitQuery.error.message}</Text>
        <Pressable onPress={() => unitQuery.refetch()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const unit = unitQuery.data as Unit;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{unit.name}</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={[styles.button, styles.btnSecondary]}
            onPress={() => setIsEditing((v) => !v)}
          >
            <Text style={[styles.btnText, styles.btnSecondaryText]}>
              {isEditing ? "Cancel" : "Edit"}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.btnDanger]}
            onPress={onDelete}
          >
            <Text style={[styles.btnText, styles.btnDangerText]}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Text>
          </Pressable>
        </View>
      </View>

      {isEditing ? (
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="Enter name"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value as string}
                />
              )}
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name.message}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Address</Text>
            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.address && styles.inputError]}
                  placeholder="Enter address"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value as string}
                />
              )}
            />
            {errors.address && (
              <Text style={styles.errorText}>{errors.address.message}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Monthly Rent</Text>
            <Controller
              control={control}
              name="monthly_rent"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.monthly_rent && styles.inputError,
                  ]}
                  placeholder="e.g. 1500"
                  onBlur={onBlur}
                  onChangeText={onChange as any}
                  value={String(value ?? "")}
                  keyboardType="numeric"
                />
              )}
            />
            {errors.monthly_rent && (
              <Text style={styles.errorText}>
                {errors.monthly_rent.message as string}
              </Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Notes</Text>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="Any notes..."
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={(value as string) ?? ""}
                  multiline
                  numberOfLines={4}
                />
              )}
            />
          </View>

          {!!updateMutation.error && (
            <Text
              style={[
                styles.errorText,
                { textAlign: "center", marginBottom: 8 },
              ]}
            >
              {updateMutation.error.message}
            </Text>
          )}

          <View style={styles.actions}>
            <Pressable
              onPress={handleSubmit((v) => updateMutation.mutate(v))}
              style={[styles.button, styles.btnPrimary]}
              disabled={updateMutation.isPending}
            >
              <Text style={[styles.btnText, styles.btnPrimaryText]}>
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.itemTitle}>{unit.name}</Text>
          {!!unit.address && <Text style={styles.sub}>{unit.address}</Text>}
          <Text style={styles.rent}>
            ${Number(unit.monthly_rent ?? 0).toLocaleString()} monthly
          </Text>
          {!!unit.notes && <Text style={styles.notes}>{unit.notes}</Text>}
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tenants</Text>
        <Pressable
          style={[styles.button, styles.btnSecondary]}
          onPress={() => router.push(`/tenants/new?unit_id=${unitId}`)}
        >
          <Text style={[styles.btnText, styles.btnSecondaryText]}>
            Assign tenant
          </Text>
        </Pressable>
      </View>

      {tenantsQuery.isPending ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : tenantsQuery.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{tenantsQuery.error.message}</Text>
        </View>
      ) : tenants.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.muted}>No tenants</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {tenants.map((t) => (
            <View key={t.id} style={styles.listItem}>
              <Text style={styles.tenantName}>{t.full_name}</Text>
              {!!t.email && <Text style={styles.tenantSub}>{t.email}</Text>}
              {!!t.phone && <Text style={styles.tenantSub}>{t.phone}</Text>}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { alignItems: "center", justifyContent: "center", padding: 16 },
  muted: { color: "#666", marginTop: 8 },
  errorText: { color: "#b00020", textAlign: "center" },
  retryBtn: {
    backgroundColor: "#1b73e8",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  retryText: { color: "#fff", fontWeight: "600" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: "700" },
  headerActions: { flexDirection: "row", gap: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e0e0e0",
    marginBottom: 16,
  },
  itemTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  sub: { color: "#444", marginBottom: 6 },
  rent: { color: "#111", fontWeight: "600" },
  notes: { marginTop: 8, color: "#222" },
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
  textarea: { height: 100, textAlignVertical: "top" },
  inputError: { borderColor: "#b00020" },
  actions: { flexDirection: "row", gap: 10 },
  list: { gap: 10 },
  listItem: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e0e0e0",
  },
  tenantName: { fontWeight: "700" },
  tenantSub: { color: "#444" },
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
});
