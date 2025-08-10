import { useApi } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import type { Paginated, Unit } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const schema = z.object({
  full_name: z.string().min(1, "Full name is required"),
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
  unit_id: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
});

type FormValues = z.infer<typeof schema>;

export default function NewTenantScreen() {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { unit_id: unitIdParam } = useLocalSearchParams<{ unit_id?: string }>();
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  const unitsQuery = useQuery<Paginated<Unit>, Error>({
    queryKey: qk.units(1, 100),
    queryFn: () => api.get<Paginated<Unit>>(`/api/v1/units?page=1&limit=100`),
  });

  const units = unitsQuery.data?.items ?? [];
  const unitNameById = useMemo(() => {
    const map = new Map<string, string>();
    units.forEach((u) => map.set(String(u.id), u.name));
    return map;
  }, [units]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      lease_start: "",
      lease_end: "",
      unit_id: (unitIdParam as string) || "",
    },
  });

  const selectedUnitId = watch("unit_id") as string | undefined;
  const selectedUnitLabel = selectedUnitId
    ? unitNameById.get(String(selectedUnitId)) || "Unknown unit"
    : "Select unit";

  const mutation = useMutation<unknown, Error, FormValues>({
    mutationFn: async (values) =>
      api.post(`/api/v1/tenants`, {
        full_name: values.full_name,
        email: values.email,
        phone: values.phone,
        lease_start: values.lease_start,
        lease_end: values.lease_end,
        unit_id: values.unit_id,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.tenants() });
      await queryClient.invalidateQueries({ queryKey: qk.units() });
      try {
        router.replace("/(tabs)/tenants");
      } catch {
        router.back();
      }
    },
  });

  const onSubmit = (values: FormValues) => mutation.mutate(values);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.header}>New Tenant</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Full name</Text>
        <Controller
          control={control}
          name="full_name"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.full_name && styles.inputError]}
              placeholder="Enter full name"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              autoCapitalize="words"
            />
          )}
        />
        {errors.full_name && (
          <Text style={styles.errorText}>{errors.full_name.message}</Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="example@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              onBlur={onBlur}
              onChangeText={onChange}
              value={(value as string) ?? ""}
            />
          )}
        />
        {errors.email && (
          <Text style={styles.errorText}>{errors.email.message as string}</Text>
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
              keyboardType="phone-pad"
              onBlur={onBlur}
              onChangeText={onChange}
              value={(value as string) ?? ""}
            />
          )}
        />
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

      <View style={styles.field}>
        <Text style={styles.label}>Unit</Text>
        <Controller
          control={control}
          name="unit_id"
          render={({ field: { value } }) => (
            <View>
              <Pressable
                onPress={() => setShowUnitPicker((v) => !v)}
                style={styles.select}
              >
                <Text style={styles.selectText}>{selectedUnitLabel}</Text>
              </Pressable>
              {showUnitPicker && (
                <View style={styles.dropdown}>
                  <Pressable
                    key="none"
                    onPress={() => {
                      setValue("unit_id", "");
                      setShowUnitPicker(false);
                    }}
                    style={styles.dropdownItem}
                  >
                    <Text style={styles.dropdownText}>Unassigned</Text>
                  </Pressable>
                  {units.map((u) => (
                    <Pressable
                      key={String(u.id)}
                      onPress={() => {
                        setValue("unit_id", String(u.id));
                        setShowUnitPicker(false);
                      }}
                      style={styles.dropdownItem}
                    >
                      <Text style={styles.dropdownText}>{u.name}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}
        />
      </View>

      {!!mutation.error && (
        <Text
          style={[styles.errorText, { textAlign: "center", marginBottom: 8 }]}
        >
          {mutation.error.message}
        </Text>
      )}

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.button, styles.btnSecondary]}
          disabled={mutation.isPending}
        >
          <Text style={[styles.btnText, styles.btnSecondaryText]}>Cancel</Text>
        </Pressable>

        <Pressable
          onPress={handleSubmit(onSubmit)}
          style={[styles.button, styles.btnPrimary]}
          disabled={mutation.isPending}
        >
          <Text style={[styles.btnText, styles.btnPrimaryText]}>
            {mutation.isPending ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
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
  errorText: { color: "#b00020", marginTop: 6 },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  button: {
    flex: 1,
    paddingVertical: 12,
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
  select: {
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectText: { color: "#111" },
  dropdown: {
    marginTop: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 10 },
  dropdownText: { color: "#111" },
});
